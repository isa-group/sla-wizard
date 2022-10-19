var fs = require('fs');
var path = require('path');
var jsyaml = require('js-yaml');
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
 * @param {string} authLocation - Where to look for the authentication parameter: 'header','query' or 'url'
 * @param {string} authName - Name of the authentication parameter, such as "token" or "apikey".
 */
 function generateTraefikConfig(SLAs, oasDoc, apiServerURL, configTemplatePath = 'templates/traefik.yaml', authLocation, authName){

  var traefikTemplate = jsyaml.load(utils.getProxyConfigTemplate(configTemplatePath));
  var routersDefinition = {};
  var middlewaresDefinition = {};
  var limitedPaths = [];
  var allProxyApikeys = [];

  for (var subSLA of SLAs){
    var planName = subSLA["plan"]["name"];
    var subSLARates = subSLA["plan"]["rates"];
    var slaApikeys = subSLA["context"]["apikeys"]
    allProxyApikeys = allProxyApikeys.concat(slaApikeys);

    for (var endpoint in subSLARates){
      limitedPaths.push(endpoint);
      var sanitized_endpoint = utils.sanitizeEndpoint(endpoint);

      for (var method in subSLARates[endpoint]){
        var method_specs = subSLARates[endpoint][method];
        var max = method_specs["requests"][0]["max"];
        var period = utils.getLimitPeriod(method_specs["requests"][0]["period"],"traefik");
                
        for (var i in slaApikeys) {
          if (authLocation == "query"){
            routersDefinition[`${planName}_${sanitized_endpoint}_ak${i}_${method}`] = {
              rule: `Path(\`${endpoint}\`) && Method(\`${method.toUpperCase()}\`) && Query(\`${authName}=${slaApikeys[i]}\`)`, 
              service: "main-service",
              middlewares: [`${planName}_addApikeyHeader_ak${i}`, `${planName}_${sanitized_endpoint}_${method}`] 
            }
          } else if (authLocation == "url"){
            routersDefinition[`${planName}_${sanitized_endpoint}_ak${i}_${method}`] = {
              rule: `Path(\`${endpoint}/${slaApikeys[i]}\`) && Method(\`${method.toUpperCase()}\`)`,
              service: "main-service",
              middlewares: ["removeApikeyFromURL", `${planName}_addApikeyHeader_ak${i}`, `${planName}_${sanitized_endpoint}_${method}`] 
            }
          } else if (authLocation == "header"){ // TODO: no loop needed in this case
            routersDefinition[`${planName}_${sanitized_endpoint}_${method}`] = {
              rule: `Path(\`${endpoint}\`) && Method(\`${method.toUpperCase()}\`) && HeadersRegexp(\`${authName}\`, \`${slaApikeys.join('|')}\`)`,
              service: "main-service",
              middlewares: [`${planName}_${sanitized_endpoint}_${method}`] 
            }
            break;
          }
          
          middlewaresDefinition[`${planName}_addApikeyHeader_ak${i}`] = { // This one is not added for authLocation 'header'
            headers: {
              customRequestHeaders: {
                [authName]: slaApikeys[i] 
              }
            }
          }
        }
        
        middlewaresDefinition[`${planName}_${sanitized_endpoint}_${method}`] = { // This one is always added, regardless of authLocation 'header', 'query' or 'url'
          rateLimit: {
            sourceCriterion: {requestHeaderName: authName},
            average: max,
            period: `1${period}`,
            burst: max
          }
        }
      }
    }
  }

  var allProxyApikeys_regex = allProxyApikeys.join('|'); 
  for (var endpoint in oasDoc.paths){ // "free" endpoints are taken from OAS as they're missing from SLA
    var sanitized_endpoint = utils.sanitizeEndpoint(endpoint);
    if (!limitedPaths.includes(endpoint)){
      for (var method in oasDoc.paths[endpoint]){
        if (authLocation == "query"){
          routersDefinition[`${sanitized_endpoint}_${method}`] = {
            rule: `Path(\`${endpoint}\`) && Method(\`${method.toUpperCase()}\`) && Query(\`${authName}={${allProxyApikeys_regex}}\`)`, 
            service: "main-service"
          }
        } else if (authLocation == "url") {
          routersDefinition[`${sanitized_endpoint}_${method}`] = {
            rule: `Path(\`${endpoint}/${slaApikeys[i]}\`) && Method(\`${method.toUpperCase()}\`)`, 
            service: "main-service",
            middlewares: ["removeApikeyFromURL"] 
          }
        } else if (authLocation == "header") {
          routersDefinition[`${sanitized_endpoint}_${method}`] = {
            rule: `Path(\`${endpoint}\`) && Method(\`${method.toUpperCase()}\`) && HeadersRegexp(\`${authName}\`, \`${allProxyApikeys_regex}\`)`, 
            service: "main-service"
          }
        }
      }
    }
  }

  if (authLocation == "url") {
    middlewaresDefinition["removeApikeyFromURL"] = { 
      replacePathRegex: {
        regex: `/${allProxyApikeys_regex}`,
        replacement: "$1"
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
 * @param {string} authLocation - Where to look for the authentication parameter: 'header','query' or 'url'
 * @param {string} authName - Name of the authentication parameter, such as "token" or "apikey".
 */
function generateHAproxyConfig(SLAs, oasDoc, apiServerURL, configTemplatePath = 'templates/haproxy.cfg', authLocation, authName){

  var haproxyTemplate = utils.getProxyConfigTemplate(configTemplatePath).toString();
  var frontendDefinition = "";
  var backendDefinition = "";
  var limitedPaths = [];
  var allProxyApikeys = [];
  var getApikeyFromUrl = "";
  var removeApikeyFromURL = "";
  var apikeyChecks = 
`# Deny if missing key
acl has_apikey ${authLocation}(${authName}) -m found
http-request deny deny_status 401 if !has_apikey

# Deny if bad key
`;

  if (authLocation == "header") {
    authLocation = "hdr";
  } else if (authLocation == "query") {
    authLocation = "url_param";
  }

  for (var subSLA of SLAs){
    var planName = subSLA["plan"]["name"];
    var subSLARates = subSLA["plan"]["rates"];
    var slaApikeys = subSLA["context"]["apikeys"]
    allProxyApikeys = allProxyApikeys.concat(slaApikeys);

    // TODO: build here %%APIKEY_CHECKS_PH%%
    apikeyChecks += `acl ${planName}_valid_apikey ${authLocation}(${authName}) -m str ${slaApikeys.concat(' ')}\n`;

    for (var endpoint in subSLARates){
      limitedPaths.push(endpoint);
      var sanitized_endpoint = utils.sanitizeEndpoint(endpoint);
      
      for (var method in subSLARates[endpoint]){
                
        var method_specs = subSLARates[endpoint][method];
        var max = method_specs["requests"][0]["max"];
        var period = utils.getLimitPeriod(method_specs["requests"][0]["period"],"traefik");
        method = method.toUpperCase();
        var paramsCount = (endpoint.match(/{/g)||[]).length;
        var endpoint_paramsMod = endpoint.replace(/\/{(.*?)\}/g, `(?:\\/[^/]+){${paramsCount}}`); // If the endpoint has parameters these are regex'd

        frontendDefinition += `use_backend ${planName}_${sanitized_endpoint}_${method} if ${planName}_valid_apikey METH_${method} { path_reg \\${endpoint_paramsMod}\\/?$ } \n    `
        backendDefinition +=
`backend ${planName}_${sanitized_endpoint}_${method}
    stick-table type binary len 20 size 100k expire 1${period} store http_req_rate(1${period})
    acl exceeds_limit ${authLocation}(${authName}),table_http_req_rate() gt ${max}
    http-request track-sc0 ${authLocation}(${authName}) unless exceeds_limit
    http-request deny deny_status 429 if exceeds_limit
    server ${sanitized_endpoint} ${apiServerURL.replace("http://","")}\n` // protocol not allowed here
      }
    }
  }

  for (var endpoint in oasDoc.paths){
    if (!limitedPaths.includes(endpoint)){
      frontendDefinition += `use_backend no_ratelimit_endpoints if METH_GET { path_reg \/open-endpoint\/?$ } or METH_POST { path_reg \/open-endpoint\/?$ }`; // TODO: can have params too
      haproxyTemplate = haproxyTemplate.replace('%%DEFAULT_BACKEND_PH%%', // TODO: move the replace to the return
`backend no_ratelimit_endpoints
    server no_ratelimit_endpoints ${apiServerURL.replace("http://","")}`);
    break;
    }
  }

  apikeyChecks += `http-request deny deny_status 403 if !basic_valid_apikey !pro_valid_apikey`; // TODO: plan names here

  return haproxyTemplate
            .replace('%%GET_APIKEY_FROM_URL_PH%%', getApikeyFromUrl)
            .replace('%%APIKEY_CHECKS_PH%%', apikeyChecks)
            .replace('%%REMOVE_API_FROM_URL_PH%%', removeApikeyFromURL)
            .replace('%%FRONTEND_PH%%', frontendDefinition)
            .replace('%%BACKENDS_PH%%', backendDefinition);
}


/**
 * Receives a SLA plan and produces (as string) an NGINX config file according
 * to the limitations it defines.
 * @param {object} SLAs - SLA plan(s).
 * @param {object} oasDoc - Open API definition.
 * @param {string} apiServerURL - API server url.
 * @param {string} configTemplatePath - Path to proxy config template.
 * @param {string} authLocation - Where to look for the authentication parameter: 'header','query' or 'url'
 * @param {string} authName - Name of the authentication parameter, such as "token" or "apikey".
 */
function generateNginxConfig(SLAs, oasDoc, apiServerURL, configTemplatePath = 'templates/nginx.conf', authLocation, authName){ // TODO: improve resulting file format (i.e beautify)

  var nginxTemplate = utils.getProxyConfigTemplate(configTemplatePath).toString(); // TODO: should simplify the template 
  var limitsDefinition = "";
  var locationDefinitions = "";
  var uriRewrites = "";
  var limitedPaths = [];
  var allProxyApikeys = [];
  var uriOriginalSave = "set $uri_original $uri;"
  var getApikeyFromUrl = "";

  if (authLocation == "header") {
    authLocation = "http";
  } else if (authLocation == "query") {
    authLocation = "arg";
  } else if (authLocation == "url") {
    authLocation = "from_url";
    getApikeyFromUrl = `
        if ($request_uri ~* "([^/]*$)" ) { # Gets the apikey from the url
          set $from_url_apikey  $1;
        }`;
    uriOriginalSave = `
        if ($request_uri ~* "((.*)\/)" ) { # Gets the url w/o apikey
          set $uri_original  $1;
        }`;
  }
  var mapApikeysDefinition = `map $${authLocation}_${authName} $api_client_name {\n     default "";\n`;

  for (var subSLA of SLAs){
    var planName = subSLA["plan"]["name"];
    var subSLARates = subSLA["plan"]["rates"];
    var slaApikeys = subSLA["context"]["apikeys"]
    allProxyApikeys = allProxyApikeys.concat(slaApikeys); 
    mapApikeysDefinition += `     "~(${slaApikeys.join('|')})" "${planName}";\n`;

    for (var endpoint in subSLARates){ 
      limitedPaths.push(endpoint);

      for (var method in subSLARates[endpoint]){
        var method_specs = subSLARates[endpoint][method];
        var max = method_specs["requests"][0]["max"];
        var period = utils.getLimitPeriod(method_specs["requests"][0]["period"],"nginx");

        var zone_name = `${planName}_${utils.sanitizeEndpoint(endpoint)}_${method.toUpperCase()}`;
        var zone_size = "10m" // 1 megabyte = 16k IPs
      
        /////////////// LIMITS
        var limit = `limit_req_zone $${authLocation}_${authName} ` +
                `zone=${zone_name}:${zone_size} rate=${max}r/${period};\n    `
        limitsDefinition += limit;

        /////////////// LOCATIONS
        var location = `
        location /${zone_name} {
            rewrite /${zone_name} $uri_original break;
            proxy_pass ${apiServerURL};
            limit_req zone=${zone_name};
        }`
        locationDefinitions += location;
      }
    };
  }

  for (var endpoint in oasDoc.paths){
    var planBased = `\${api_client_name}_`;
    var check = "=";
    if (endpoint.includes('{')) {
      check = "~";
    }
    if (!limitedPaths.includes(endpoint)){ // "free" endpoints 
      var methods = Object.keys(oasDoc.paths[endpoint]);
      planBased = "";
      /////////////// LOCATIONS
      var location = ` 
        location ~ ${endpoint}_(${methods.join('|').toUpperCase()}) {
            rewrite ${endpoint}_(${methods.join('|').toUpperCase()}) $uri_original break;
            proxy_pass ${apiServerURL};
        }`
      locationDefinitions += location;
    }

    /////////////// URI BASED ROUTING
    var endpoint_paramsMod = endpoint.replace(/\{(.*?)\}/g, '(.+)'); // If the endpoint has parameters, these are modified so Nginx understands them
    var apikeysInUrl = "";
    if (authLocation == "from_url"){
      if (check == "~") {
        apikeysInUrl = `/(${allProxyApikeys.join('|')})`;
      } else {
        apikeysInUrl = `/$${authLocation}_${authName}`;        
      }
    }
    uriRewrites += `
        if ($uri ${check} ${endpoint_paramsMod}${apikeysInUrl}) {
          rewrite ${endpoint_paramsMod} "/${planBased}${utils.sanitizeEndpoint(endpoint)}_\${request_method}" break; 
        }`;
  }

  return nginxTemplate
            .replace('%%LIMIT_REQ_ZONE_PH%%', limitsDefinition)
            .replace('%%MAP_APIKEYS_PH%%', mapApikeysDefinition + '    }')
            .replace('%%GET_APIKEY_FROM_URL_PH%%', getApikeyFromUrl)
            .replace('%%AUTH_LOCATION_PH%%', `${authLocation}_${authName}`)
            .replace('%%URI_ORIGINAL_SAVE_PH%%', uriOriginalSave)
            .replace('%%URI_REWRITES_PH%%', uriRewrites)
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
 * @param {string} oasPath - Path to the OAS description.
 * @param {string} proxyType - Proxy type.
 * @param {string} slaPath - Path to the SLA description. 
 * @param {string} outFile - Path where to save the produced proxy configuration.
 * @param {string} customTemplate - Path to custom proxy config template. 
 * @param {string} authLocation - Where to look for the authentication parameter: 'header','query' or 'url'
 * @param {string} authName - Name of the authentication parameter, such as "token" or "apikey".
 
 */
function generateConfigHandle(oasPath, proxyType, slaPath, outFile, customTemplate, authLocation, authName) {

  // Load and validate OAS
  var oasDoc = utils.loadAndValidateOAS(oasPath);

  // Get server URL
  try {
    var apiServerURL = oasDoc.servers[0].url;
  } catch {
    configs.logger.error("OAS' servers property missing");
    process.exit();
  }

  // Get SLA(s) path(s) from OAS
  var SLApaths = [];
  var oasLocation = oasPath.substring(0, oasPath.lastIndexOf('/'));
  try {
    if (typeof slaPath === "string" ){
      SLApaths.push(slaPath);
    } else {
      SLApaths = slaPath;
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
        if (fs.lstatSync(element).isDirectory()) { // FOLDER
          fs.readdirSync(element).forEach(file => {
            var slaPath = path.join(element, file); // add base path to SLA paths
            configs.logger.debug(`File in directory: ${slaPath}`);
            SLAs.push(jsyaml.load(fs.readFileSync(path.join('', slaPath), 'utf8')));
          });
        } else { // FILE
          configs.logger.debug(`File: ${element}`);
          var slaPath = element; // add base path to SLA paths
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
                            outFile,
                            authLocation,
                            authName)
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
 * @param {string} authLocation - Where to look for the authentication parameter: 'header','query' or 'url'
 * @param {string} authName - Name of the authentication parameter, such as "token" or "apikey".
 */
function generateProxyConfig(proxyType,
                    SLAsFiltered,
                    oasDoc,
                    apiServerURL,
                    customTemplate,
                    outFile,
                    authLocation,
                    authName){
  switch (proxyType) {
    case 'nginx':
      var proxyConf = generateNginxConfig(SLAsFiltered,
                                          oasDoc,
                                          apiServerURL,
                                          customTemplate,
                                          authLocation,
                                          authName);
      break;
    case 'haproxy':
      var proxyConf = generateHAproxyConfig(SLAsFiltered,
                                            oasDoc,
                                            apiServerURL,
                                            customTemplate,
                                            authLocation,
                                            authName);
      break;
    case 'traefik':
      var proxyConf = generateTraefikConfig(SLAsFiltered,
                                            oasDoc,
                                            apiServerURL,
                                            customTemplate,
                                            authLocation,
                                            authName);
      break;
    case 'envoy':
      var proxyConf = generateEnvoyConfig(SLAsFiltered,
                                            oasDoc,
                                            apiServerURL,
                                            customTemplate,
                                            authLocation,
                                            authName);
      break;
  }
  fs.writeFileSync(outFile, proxyConf);
}


module.exports = {
    generateConfigHandle: generateConfigHandle
};
