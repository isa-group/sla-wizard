var fs = require('fs');
var path = require('path');
var jsyaml = require('js-yaml');
var jsonschema = require('jsonschema');
var url = require("url");
var configs = require("./configs");
var utils = require("./utils");
var https = require('https')


/**
 * Receives a SLA plan and produces (as string) a Envoy dynamic config file
 * according to the limitations it defines.
 * @param {object} SLAs - SLA plan(s).
 * @param {object} oasDoc - Open API definition.
 * @param {string} api_server_url - API server url.
 * @param {string} configTemplatePath - Path to proxy config template.
*/
function generateEnvoyConfig(SLAs, oasDoc, api_server_url, configTemplatePath = 'templates/envoy.yaml'){

  var envoyTemplate = jsyaml.load(utils.getProxyConfigTemplate(configTemplatePath));

  var routesDefinition = [];
  var limitedPaths = [];
  api_server_url = url.parse(api_server_url)

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
              "prefix": endpoint
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
    .endpoint.address.socket_address.address = api_server_url.hostname
  envoyTemplate.static_resources
    .clusters[0].load_assignment.endpoints[0].lb_endpoints[0]
    .endpoint.address.socket_address.port_value = api_server_url.port
  return jsyaml.dump(envoyTemplate);
}


/**
 * Receives a SLA plan and produces (as string) a Traefik dynamic config file
 * according to the limitations it defines.
 * @param {object} SLAs - SLA plan(s).
 * @param {object} oasDoc - Open API definition.
 * @param {string} api_server_url - API server url.
 * @param {string} configTemplatePath - Path to proxy config template.
 */
function generateTraefikConfig(SLAs, oasDoc, api_server_url, configTemplatePath = 'templates/traefik.yaml'){

  var traefikTemplate = jsyaml.load(utils.getProxyConfigTemplate(configTemplatePath));

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
      routersDefinition[sanitized_endpoint] = {
        rule: `PathPrefix(\`${endpoint}\`)`,
        service: "main-service"
      }
    }
  }
  traefikTemplate.http.services["main-service"].loadBalancer.servers[0].url = api_server_url
  traefikTemplate.http.routers = routersDefinition
  traefikTemplate.http.middlewares = middlewaresDefinition
  return jsyaml.dump(traefikTemplate)
}


/**
 * Receives a SLA plan and produces (as string) an HAProxy config file according
 * to the limitations it defines.
 * @param {object} SLAs - SLA plan(s).
 * @param {object} oasDoc - Open API definition.
 * @param {string} api_server_url - API server url.
 * @param {string} configTemplatePath - Path to proxy config template.
 */
function generateHAproxyConfig(SLAs, oasDoc, api_server_url, configTemplatePath = 'templates/haproxy.cfg'){

  var haproxyTemplate = utils.getProxyConfigTemplate(configTemplatePath).toString();

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
    http-request track-sc0 base32+src
    http-request set-var(req.rate_limit) int(${max})
    http-request set-var(req.request_rate) base32+src,table_http_req_rate()
    acl rate_abuse var(req.rate_limit),sub(req.request_rate) lt 0
    http-request deny deny_status 429 if rate_abuse
    server ${sanitized_endpoint} ${api_server_url.replace("http://","")} \n\n` // protocol not allowed here
        }
      }

  }

  for (var endpoint in oasDoc.paths){
    if (!limitedPaths.includes(endpoint)){
      haproxyTemplate = haproxyTemplate.replace('%%DEFAULT_BACKEND_PH%%',
`backend default-server
    mode http
    server default-server ${api_server_url.replace("http://","")}`);
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
 * @param {string} api_server_url - API server url.
 * @param {string} configTemplatePath - Path to proxy config template.
 */
function generateNginxConfig(SLAs, oasDoc, api_server_url, configTemplatePath = 'templates/nginx.conf'){

  var nginxTemplate = utils.getProxyConfigTemplate(configTemplatePath).toString();

  var limitsDefinition = "";
  var locationDefinitions = "";
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
          var limit = `limit_req_zone $binary_remote_addr ` +
                  `zone=${zone_name}:${zone_size} rate=${max}r/${period};\n    `
          limitsDefinition += limit;
        }

        /////////////// LOCATIONS
        var location = `
          location ${endpoint} {
              proxy_pass ${api_server_url};
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
              proxy_pass ${api_server_url};
          }\n`
      locationDefinitions += location;
    }
  }

  return nginxTemplate
            .replace('%%LIMIT_REQ_ZONE_PH%%', limitsDefinition)
            .replace('%%LOCATIONS_PH%%', locationDefinitions);
}


/**
 * Configuration file generation handle.
 * @param {string} file - Path to the OAS description.
 * @param {string} type - Proxy type.
 * @param {string} outFile - Path where to save the produced proxy configuration.
 * @param {string} customTemplate - Path to custom proxy config template.
 */
function generateConfigHandle(file, type, outFile, customTemplate) {

  // Load OAS
  try {
    var spec = fs.readFileSync(path.join('', file), 'utf8');
    var oasDoc = jsyaml.load(spec);
    configs.logger.info('Input oas-doc %s: %s', file, oasDoc);
  } catch (err) {
    configs.logger.error("" + err);
    process.exit();
  }

  // Validate OAS
  var oas_schema = jsyaml.load(fs.readFileSync(path.join(__dirname, '../schemas/openapi-3.0.yaml'), 'utf8'));
  var validator = new jsonschema.Validator()
  var err = validator.validate(oasDoc, oas_schema);
  if (err.valid == false) {
    configs.logger.error(`oasDoc is not valid: ${err.errors}, quitting`);
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
      if (utils.isAValidUrl(element)) { // URL
        configs.logger.debug(`Getting SLAs from ${element}...`);
        SLAs.concat(utils.getSLAsFromURL(element));
      }
      else {
        if (path.isAbsolute(element)){ // info.x-sla.$ref can be absolute
          var elementPath = element;
        } else {
          var elementPath = path.join(oasLocation, element);
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
      }
    } catch (err) {
      configs.logger.error(`Error with SLA(s) ${element}: ${err}. Quitting`);
      process.exit();
    }
  });

  // Validate SLAs
  var SLAsFiltered = utils.validateSLAs(SLAs);

  // Get server url
  try {
    var api_server_url = oasDoc.servers[0].url;
  } catch {
    configs.logger.error("OAS' servers property missing");
    process.exit();
  }

  // Generate proxy config according to SLA
  var proxyType = type
  switch (proxyType) {
    case 'nginx':
      var proxyConf = generateNginxConfig(SLAsFiltered,
                                          oasDoc,
                                          api_server_url,
                                          customTemplate);
      break;
    case 'haproxy':
      var proxyConf = generateHAproxyConfig(SLAsFiltered,
                                            oasDoc,
                                            api_server_url,
                                            customTemplate);
      break;
    case 'traefik':
      var proxyConf = generateTraefikConfig(SLAsFiltered,
                                            oasDoc,
                                            api_server_url,
                                            customTemplate);
      break;
    case 'envoy':
      var proxyConf = generateEnvoyConfig(SLAsFiltered,
                                            oasDoc,
                                            api_server_url,
                                            customTemplate);
      break;
  }

  // Write the obtained proxy config to file
  var configFile = outFile
  fs.writeFileSync(configFile, proxyConf);
}

module.exports = {
    generateConfigHandle: generateConfigHandle,
};
