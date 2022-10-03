var fs = require('fs');
var path = require('path');
var jsyaml = require('js-yaml');
var jsonschema = require('jsonschema');
var url = require("url");
var axios = require("axios");
var configs = require("./configs");
var utils = require("./utils");


/**
 * Receives a SLA plan and produces (as string) a Envoy dynamic config file
 * according to the limitations it defines.
 * @param {object} SLAs - SLA plan(s).
 * @param {object} oasDoc - Open API definition.
 * @param {string} apiServerURL - API server url.
 * @param {string} configTemplatePath - Path to proxy config template.
*/
function generateEnvoyConfig(SLAs, oasDoc, apiServerURL, configTemplatePath = 'templates/envoy.yaml'){

  var envoyTemplate = jsyaml.load(utils.getProxyConfigTemplate(configTemplatePath));

  var routesDefinition = [];
  var limitedPaths = [];
  apiServerURL = url.parse(apiServerURL)

  for (var subSLA of SLAs){
    var subSLARates = subSLA["rates"];

      for (var endpoint in subSLARates){
        limitedPaths.push(endpoint);

        for (var method in subSLARates[endpoint]){
          var method_specs = subSLARates[endpoint][method];
          var max = method_specs["requests"][0]["max"];
          var period = method_specs["requests"][0]["period"];
          period = utils.getLimitPeriod(period,"envoy");
          routesDefinition.push({
            "match": {
              "path": endpoint
            },
            "route": {
              "cluster": "main-cluster"
            },
            "typed_per_filter_config": {
              "envoy.filters.http.local_ratelimit": {
                "@type": "type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit",
                "stat_prefix": "route_rate_limit",
                "token_bucket": {
                  "max_tokens": max,
                  "fill_interval": period
                },
                "filter_enabled": {
                  "runtime_key": "route_limit_enabled",
                  "default_value": {
                    "numerator": 100,
                    "denominator": "HUNDRED"
                  }
                },
                "filter_enforced": {
                  "runtime_key": "route_limit_enforced",
                  "default_value": {
                    "numerator": 100,
                    "denominator": "HUNDRED"
                  }
                }
              }
            }
          });
        }
      }

  }

  for (var endpoint in oasDoc.paths){
    if (!limitedPaths.includes(endpoint)){
      routesDefinition.push({
         "match": {
           "path": endpoint
         },
         "route": {
           "cluster": "main-cluster"
         }
       });
    }
  }

  envoyTemplate.static_resources
    .listeners[0].filter_chains[0].filters[0]
    .typed_config.route_config.virtual_hosts[0].routes = routesDefinition
  envoyTemplate.static_resources
    .clusters[0].load_assignment.endpoints[0].lb_endpoints[0]
    .endpoint.address.socket_address.address = apiServerURL.hostname
  envoyTemplate.static_resources
    .clusters[0].load_assignment.endpoints[0].lb_endpoints[0]
    .endpoint.address.socket_address.port_value = apiServerURL.port
  return jsyaml.dump(envoyTemplate);
}


/**
 * Receives a SLA plan and produces (as string) a Traefik dynamic config file
 * according to the limitations it defines.
 * @param {object} SLAs - SLA plan(s).
 * @param {object} oasDoc - Open API definition.
 * @param {string} apiServerURL - API server url.
 * @param {string} configTemplatePath - Path to proxy config template.
 */
function generateTraefikConfig(SLAs, oasDoc, apiServerURL, configTemplatePath = 'templates/traefik.yaml'){

  var traefikTemplate = jsyaml.load(utils.getProxyConfigTemplate(configTemplatePath));

  var trackingQueryName = "apikey";
  var routersDefinition = {};
  var middlewaresDefinition = {};
  var limitedPaths = [];

  for (var subSLA of SLAs){
    var subSLARates = subSLA["rates"];

      for (var endpoint in subSLARates){
        limitedPaths.push(endpoint);

        for (var method in subSLARates[endpoint]){
          var method_specs = subSLARates[endpoint][method];
          var max = method_specs["requests"][0]["max"];
          var period = method_specs["requests"][0]["period"];
          var sanitized_endpoint = utils.sanitizeEndpoint(endpoint);
          period = utils.getLimitPeriod(period,"traefik");
          routersDefinition[sanitized_endpoint] = {
            rule: `PathPrefix(\`${endpoint}\`)`,
            service: "main-service",
            middlewares: [sanitized_endpoint]
          }
          middlewaresDefinition[sanitized_endpoint] = {
            rateLimit: {
              sourceCriterion: {requestHeaderName: trackingQueryName},
              average: max,
              period: `1${period}`,
              burst: max
            }
          }
        }
      }
  }

  for (var endpoint in oasDoc.paths){ // "free" endpoints are taken from OAS as they're missing from SLA
    if (!limitedPaths.includes(endpoint)){
      routersDefinition[utils.sanitizeEndpoint(endpoint)] = {
        rule: `PathPrefix(\`${endpoint}\`)`,
        service: "main-service"
      }
    }
  }
  traefikTemplate.http.services["main-service"].loadBalancer.servers[0].url = apiServerURL
  traefikTemplate.http.routers = routersDefinition
  traefikTemplate.http.middlewares = middlewaresDefinition
  return jsyaml.dump(traefikTemplate)
}


/**
 * Receives a SLA plan and produces (as string) an HAProxy config file according
 * to the limitations it defines.
 * @param {object} SLAs - SLA plan(s).
 * @param {object} oasDoc - Open API definition.
 * @param {string} apiServerURL - API server url.
 * @param {string} configTemplatePath - Path to proxy config template.
 */
function generateHAproxyConfig(SLAs, oasDoc, apiServerURL, configTemplatePath = 'templates/haproxy.cfg'){

  var haproxyTemplate = utils.getProxyConfigTemplate(configTemplatePath).toString();

  var trackingQueryName = "apikey";
  var frontendDefinition = "";
  var backendDefinition = "";
  var limitedPaths = [];

  for (var subSLA of SLAs){
    var subSLARates = subSLA["rates"];

      for (var endpoint in subSLARates){
        limitedPaths.push(endpoint);
        var sanitized_endpoint = utils.sanitizeEndpoint(endpoint);

        for (var method in subSLARates[endpoint]){
          frontendDefinition += `use_backend ${sanitized_endpoint} if { path_beg ${endpoint} } \n    `
          var method_specs = subSLARates[endpoint][method];
          var max = method_specs["requests"][0]["max"];
          var period = method_specs["requests"][0]["period"];
          period = utils.getLimitPeriod(period,"haproxy");
          backendDefinition +=
`backend ${sanitized_endpoint}
    mode http
    stick-table type binary len 20 size 100k expire 1${period} store http_req_rate(1${period})
    acl has_token url_param(${trackingQueryName}) -m found
    acl exceeds_limit url_param(${trackingQueryName}),table_http_req_rate() gt ${max}
    http-request track-sc0 url_param(${trackingQueryName}) unless exceeds_limit
    http-request deny deny_status 403 if !has_token
    http-request deny deny_status 429 if exceeds_limit
    server ${sanitized_endpoint} ${apiServerURL.replace("http://","")} \n\n` // protocol not allowed here
        }
      }
  }

  for (var endpoint in oasDoc.paths){
    if (!limitedPaths.includes(endpoint)){
      haproxyTemplate = haproxyTemplate.replace('%%DEFAULT_BACKEND_PH%%',
`backend default-server
    mode http
    server default-server ${apiServerURL.replace("http://","")}`);
    break;
    }
  }

  return haproxyTemplate
            .replace('%%FRONTEND_PH%%', frontendDefinition)
            .replace('%%BACKEND_PH%%', backendDefinition);
}


/**
 * Receives a SLA plan and produces (as string) an NGINX config file according
 * to the limitations it defines.
 * @param {object} SLAs - SLA plan(s).
 * @param {object} oasDoc - Open API definition.
 * @param {string} apiServerURL - API server url.
 * @param {string} configTemplatePath - Path to proxy config template.
 */
function generateNginxConfig(SLAs, oasDoc, apiServerURL, configTemplatePath = 'templates/nginx.conf'){

  var nginxTemplate = utils.getProxyConfigTemplate(configTemplatePath).toString();

  var limitsDefinition = "";
  var trackingHeaderName = "apikey";
  var locationDefinitions = `    if ($http_${trackingHeaderName} = "") { return 403; }\n`;
  var limitedPaths = [];

  for (var subSLA of SLAs){
    var subSLARates = subSLA["rates"];

      for (var endpoint in subSLARates){
        limitedPaths.push(endpoint);

        /////////////// LIMITS
        for (var method in subSLARates[endpoint]){
          var method_specs = subSLARates[endpoint][method];
          var max = method_specs["requests"][0]["max"];
          var period = method_specs["requests"][0]["period"];
          var zone_name = utils.sanitizeEndpoint(endpoint);
          var zone_size = "10m" // 1 megabyte = 16k IPs
          period = utils.getLimitPeriod(period,"nginx");
          var limit = `limit_req_zone $http_${trackingHeaderName} ` +
                  `zone=${zone_name}:${zone_size} rate=${max}r/${period};\n    `
          limitsDefinition += limit;
        }

        /////////////// LOCATIONS
        var location = `
          location ${endpoint} {
              proxy_pass ${apiServerURL};
              limit_req zone=${zone_name};
          }\n`
        locationDefinitions += location;

      };

  }

  for (var endpoint in oasDoc.paths){
    if (!limitedPaths.includes(endpoint)){
      /////////////// LOCATIONS
      var location = `
          location ${endpoint} {
              proxy_pass ${apiServerURL};
          }\n`
      locationDefinitions += location;
    }
  }

  return nginxTemplate
            .replace('%%LIMIT_REQ_ZONE_PH%%', limitsDefinition)
            .replace('%%LOCATIONS_PH%%', locationDefinitions);
}


/**
 * Given a URL, makes a GET request to get an array of SLAs.
 * @param {string} slasURL - A URL.
 */
function getSLAsFromURL(slasURL,
                     proxyType,
                     oasDoc,
                     apiServerURL,
                     customTemplate,
                     outFile){
  axios
  .get(slasURL)
  .then(res => {
    // Validate SLAs
    var SLAsFiltered = utils.validateSLAs(res.data);

    // Generate and write to file proxy config according to SLA
    generateProxyConfig(proxyType,
                        SLAsFiltered,
                        oasDoc,
                        apiServerURL,
                        customTemplate,
                        outFile);
  }).catch(error => {
    configs.logger.error(error + ", quitting");
    process.exit();
  });
}


/**
 * Configuration file generation handle.
 * @param {string} file - Path to the OAS description.
 * @param {string} proxyType - Proxy type.
 * @param {string} outFile - Path where to save the produced proxy configuration.
 * @param {string} customTemplate - Path to custom proxy config template.
 */
function generateConfigHandle(file, proxyType, outFile, customTemplate) {

  // Load and validate OAS
  var oasDoc = utils.loadAndValidateOAS(file);

  // Get server URL
  try {
    var apiServerURL = oasDoc.servers[0].url;
  } catch {
    configs.logger.error("OAS' servers property missing");
    process.exit();
  }

  // Get SLA(s) path(s) from OAS
  var SLApaths = [];
  var oasLocation = file.substring(0, file.lastIndexOf('/'));
  try {
    var partialSlaPath = oasDoc["info"]["x-sla"]["$ref"] 
    if (partialSlaPath == undefined ){
      configs.logger.error("OAS' info.x-sla property missing value");
      process.exit();
    } else if (typeof partialSlaPath === "string" ){
      SLApaths.push(partialSlaPath);
    } else {
      SLApaths = partialSlaPath;
    }
  } catch {
    configs.logger.error("OAS' info.x-sla property missing");
    process.exit();
  }

  // Load all SLA path(s)
  var SLAs = [];
  SLApaths.forEach(element => {
    try{
      if (SLApaths.length != 1 && utils.isAValidUrl(element)){
        configs.logger.error("URL provided alongside other SLA pointers, quitting");
        process.exit();
      }
      else if (SLApaths.length == 1 && utils.isAValidUrl(element)){ // URL
        configs.logger.debug(`Getting SLAs from ${element}...`);
        getSLAsFromURL(element,
                       proxyType,
                       oasDoc,
                       apiServerURL,
                       customTemplate,
                       outFile);
      }
      else {
        var elementPath = path.join(oasLocation, element);
        if (path.isAbsolute(element)){ // info.x-sla.$ref can be absolute
          var elementPath = element;
        }
        if (fs.lstatSync(elementPath).isDirectory()) { // FOLDER
          fs.readdirSync(elementPath).forEach(file => {
            var slaPath = path.join(elementPath, file); // add base path to SLA paths
            configs.logger.debug(`File in directory: ${slaPath}`);
            SLAs.push(jsyaml.load(fs.readFileSync(path.join('', slaPath), 'utf8')));
          });
        } else { // FILE
          configs.logger.debug(`File: ${element}`);
          var slaPath = elementPath; // add base path to SLA paths
          SLAs.push(jsyaml.load(fs.readFileSync(path.join('', slaPath), 'utf8')));
        }

        // Validate SLAs
        var SLAsFiltered = utils.validateSLAs(SLAs);

        // Generate and write to file proxy config according to SLA
        generateProxyConfig(proxyType,
                            SLAsFiltered,
                            oasDoc,
                            apiServerURL,
                            customTemplate,
                            outFile)

      }
    } catch (err) {
      configs.logger.error(`Error with SLA(s) ${element}: ${err}. Quitting`);
      process.exit();
    }
  });
}


/**
 * Calls the actual proxy config file generation functions.
 * @param {string} proxyType - Proxy type.
 * @param {object} SLAsFiltered - Valid SLAs.
 * @param {object} oasDoc - Open API definition.
 * @param {string} apiServerURL - API server url.
 * @param {string} customTemplate - Path to custom proxy config template.
 * @param {string} outFile - Path where to save the produced proxy configuration.
 */
function generateProxyConfig(proxyType,
                    SLAsFiltered,
                    oasDoc,
                    apiServerURL,
                    customTemplate,
                    outFile){
  switch (proxyType) {
    case 'nginx':
      var proxyConf = generateNginxConfig(SLAsFiltered,
                                          oasDoc,
                                          apiServerURL,
                                          customTemplate);
      break;
    case 'haproxy':
      var proxyConf = generateHAproxyConfig(SLAsFiltered,
                                            oasDoc,
                                            apiServerURL,
                                            customTemplate);
      break;
    case 'traefik':
      var proxyConf = generateTraefikConfig(SLAsFiltered,
                                            oasDoc,
                                            apiServerURL,
                                            customTemplate);
      break;
    case 'envoy':
      var proxyConf = generateEnvoyConfig(SLAsFiltered,
                                            oasDoc,
                                            apiServerURL,
                                            customTemplate);
      break;
  }
  fs.writeFileSync(outFile, proxyConf);
}


module.exports = {
    generateConfigHandle: generateConfigHandle
};
