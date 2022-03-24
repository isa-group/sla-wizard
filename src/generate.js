var fs = require('fs');
var path = require('path');
var jsyaml = require('js-yaml');
var ZSchema = require("z-schema");
var url = require("url");
var configs = require("./configs");
var https = require('https')


/**
 * Given a URL, makes a GET request to get an array of SLAs.
 * @param {string} slasURL - A URL.
 */
 function getSLAsFromURL(slasURL){ // TODO: this is async
   http.get(slasURL, function(res) {
     // Buffer the body entirely for processing as a whole.
     var bodyChunks = [];
     res.on('data', function(chunk) {
       // You can process streamed parts here...
       bodyChunks.push(chunk);
     }).on('end', function() {
       var body = Buffer.concat(bodyChunks);
       return body
     })
   });
 }


/**
 * Given a string, checks if it's a valid URL.
 * @param {string} potentialURL - A potential URL.
 */
function isAValidUrl(potentialURL){
  try {
    new url.URL(s);
    return true;
  } catch (err) {
    return false;
  }
};


/**
 * Given a SLA-like period, returns the equivalent proxy time period.
 * @param {string} proxy - One of: nginx, haproxy, traefik and envoy.
 * @param {string} period - One of: second, minute, hour, day, month and year.
 */
function getLimitPeriod(period, proxy){
  var periodMap = null;
  switch (proxy) {
    case 'nginx': // NGINX only accepts second and minute
      periodMap = {
        'second': 's',
        'minute': 'm'
      };
      break;
    case 'haproxy': // HAProxy does not support month and year
      periodMap = {
        'second': 's',
        'minute': 'm',
        'hour': 'h',
        'day': 'd'
      };
      break;
    case 'traefik': // Traefik does not support month and year
      periodMap = {
        'second': 's',
        'minute': 'm',
        'hour': 'h',
        'day': 'd'
      };
      break;
    case 'envoy':
      periodMap = {
        'second': '1s',
        'minute': '60s',
        'hour': '3600s',
        'day': '86400s',
        'month': '2592000s',
        'year': '31536000s'
      };
      break;
  }
  return periodMap[period];
}


/**
 * Receives a SLA plan and produces (as string) a Envoy dynamic config file
 * according to the limitations it defines.
 * @param {object} SLAs - SLA plan(s).
 * @param {object} oasDoc - Open API definition.
 */
function generateEnvoyConfig(SLAs, oasDoc){

  var envoyTemplate = jsyaml.load(fs.readFileSync(
            path.join(__dirname, '../templates/envoy.yaml'), 'utf8'));
  var routesDefinition = [];
  var limitedPaths = [];
  try {
    var api_server_url = url.parse(oasDoc.servers[0].url); // TODO: it's an array
  } catch {
    configs.logger.error("OAS' servers property missing");
    process.exit();
  }

  for (var subSLA of SLAs){
    var slaPlans = subSLA["plans"]; // TODO:
    for (var plans in slaPlans){
      for (var endpoint in slaPlans[plans]["rates"]){ // TODO: quotas
        limitedPaths.push(endpoint);

        for (var method in slaPlans[plans]["rates"][endpoint]){
          if (method == "get"){ // TODO: other methods
            var method_specs = slaPlans[plans]["rates"][endpoint][method];
            var max = method_specs["requests"][0]["max"];
            var period = method_specs["requests"][0]["period"];
            period = getLimitPeriod(period,"envoy");
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
 */
function generateTraefikConfig(SLAs, oasDoc){

  var traefikTemplate = jsyaml.load(fs.readFileSync(
            path.join(__dirname, '../templates/traefik.yaml'), 'utf8'));
  var routersDefinition = {};
  var middlewaresDefinition = {};
  var limitedPaths = [];
  try {
    var api_server_url = oasDoc.servers[0].url; // TODO: it's an array
  } catch {
    configs.logger.error("OAS' servers property missing");
    process.exit();
  }

  for (var subSLA of SLAs){
    var slaPlans = subSLA["plans"]; // TODO:
    for (var plans in slaPlans){
      for (var endpoint in slaPlans[plans]["rates"]){ // TODO: quotas
        limitedPaths.push(endpoint);

        for (var method in slaPlans[plans]["rates"][endpoint]){
          if (method == "get"){ // TODO: other methods
            var method_specs = slaPlans[plans]["rates"][endpoint][method];
            var max = method_specs["requests"][0]["max"];
            var period = method_specs["requests"][0]["period"];
            period = getLimitPeriod(period,"traefik");
            routersDefinition[endpoint.replace(/\//g, '')] = {
              rule: `PathPrefix(\`${endpoint}\`)`,
              service: "main-service",
              middlewares: [endpoint.replace(/\//g, '')]
            }
            middlewaresDefinition[endpoint.replace(/\//g, '')] = {
              rateLimit: {
                average: max,
                period: `1${period}`,
                burst: max
              }
            }
          }
        }
      }
    }
  }

  for (var endpoint in oasDoc.paths){ // "free" endpoints are taken from OAS as they're missing from SLA
    if (!limitedPaths.includes(endpoint)){
      routersDefinition[endpoint.replace(/\//g, '')] = {
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
 */
function generateHAproxyConfig(SLAs, oasDoc){ // https://www.haproxy.com/blog/four-examples-of-haproxy-rate-limiting/

  var haproxyTemplate = fs
                .readFileSync(path.join(__dirname, '../templates/haproxy.cfg')) // TODO: allow custom
                .toString();

  var frontendDefinition = "";
  var backendDefinition = "";
  var limitedPaths = [];
  try {
    var api_server_url = oasDoc.servers[0].url; // TODO: it's an array
  } catch {
    configs.logger.error("OAS' servers property missing");
    process.exit();
  }

  for (var subSLA of SLAs){
    var slaPlans = subSLA["plans"]; // TODO:
    for (var plans in slaPlans){
      for (var endpoint in slaPlans[plans]["rates"]){ // TODO: quotas
        limitedPaths.push(endpoint);

        for (var method in slaPlans[plans]["rates"][endpoint]){
          if (method == "get"){ // TODO: other methods
            frontendDefinition += `use_backend ${endpoint.replace(/\//g, '')} if { path_beg ${endpoint} } \n    `
            var method_specs = slaPlans[plans]["rates"][endpoint][method];
            var max = method_specs["requests"][0]["max"];
            var period = method_specs["requests"][0]["period"];
            period = getLimitPeriod(period,"haproxy");
            backendDefinition +=
`backend ${endpoint.replace(/\//g, '')}
    mode http
    stick-table type binary len 20 size 100k expire 1${period} store http_req_rate(1${period})
    http-request track-sc0 base32+src
    http-request set-var(req.rate_limit) int(${max})
    http-request set-var(req.request_rate) base32+src,table_http_req_rate()
    acl rate_abuse var(req.rate_limit),sub(req.request_rate) lt 0
    http-request deny deny_status 429 if rate_abuse
    server ${endpoint.replace(/\//g, '')} ${api_server_url.replace("http://","")} \n\n` // protocol not allowed here
          }
        }
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
 */
function generateNginxConfig(SLAs, oasDoc){
  var nginxTemplate = fs
                .readFileSync(path.join(__dirname, '../templates/nginx')) // TODO: allow custom
                .toString();

  var limitsDefinition = "";
  var locationDefinitions = "";
  var limitedPaths = [];
  try {
    var api_server_url = oasDoc.servers[0].url; // TODO: it's an array
  } catch {
    configs.logger.error("OAS' servers property missing");
    process.exit();
  }

  for (var subSLA of SLAs){
    var slaPlans = subSLA["plans"]; // TODO:
    for (var plans in slaPlans){
      for (var endpoint in slaPlans[plans]["rates"]){ // TODO: quotas
        limitedPaths.push(endpoint);

        /////////////// LIMITS
        for (var method in slaPlans[plans]["rates"][endpoint]){
          if (method == "get"){ // TODO: other methods
            var method_specs = slaPlans[plans]["rates"][endpoint][method];
            var max = method_specs["requests"][0]["max"];
            var period = method_specs["requests"][0]["period"];
            var zone_name = endpoint.replace('/',''); // TODO: sanitize
            var zone_size = "10m" // 1 megabyte = 16k IPs
            period = getLimitPeriod(period,"nginx");
            var limit = `limit_req_zone $binary_remote_addr ` +
                    `zone=${zone_name}:${zone_size} rate=${max}r/${period};\n    `
            limitsDefinition += limit;
          }
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
 */
function generateConfigHandle(file, type, outFile) {

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
  var oas_schema = jsyaml.load(fs.readFileSync(
            path.join(__dirname, '../schemas/oas-3.0.yaml'), 'utf8'));
  var validator = new ZSchema();
  var err = validator.validate(oasDoc, oas_schema);
  if (err == false) {
    configs.logger.info('oasDoc is not valid');
    //configs.logger.error('oasDoc is not valid: ' + JSON.stringify(validator.getLastErrors()));
    //return;  //TODO: validation fails but works at https://editor.swagger.io/
  }

  // Get SLA(s) path(s) from OAS - TODO: the SLAs should be validated
  var SLApaths = [];
  var oasLocation = file.substring(0, file.lastIndexOf('/'));
  try {
    var partialSlaPath = oasDoc["info"]["x-sla"]["$ref"]

    if(typeof partialSlaPath === "string" ){
      SLApaths.push(partialSlaPath);
    } else {
      SLApaths = partialSlaPath;
    }
  } catch {
    configs.logger.error("OAS' info.x-sla property missing");
    process.exit();
  }

  // Load all SLA path(s) - TODO: paths must be relative? https://swagger.io/docs/specification/using-ref/
  var SLAs = [];
  SLApaths.forEach(element => { // TODO for each, check that: sla.context.type == "instance" and add try/cath
    if (element.isDirectory()) { // TODO: test these 3 below
      // FOLDER
      fs.readdirSync(element).forEach(file => {
        var slaPath = path.join(oasLocation, file); // add base path to SLA paths
        SLAs.push(jsyaml.load(fs.readFileSync(path.join('', slaPath), 'utf8')));
      });
    } else if (element.isAValidUrl()){
      // URL
      SLAs.concat(getSLAsFromURL(element)); // document that the URL must return an array even if it's just one
    } else {
      // FILE
      var slaPath = path.join(oasLocation, element); // add base path to SLA paths
      SLAs.push(jsyaml.load(fs.readFileSync(path.join('', slaPath), 'utf8')));
    }
  });

  // Generate proxy config according to SLA
  var proxyType = type // TODO: make enum
  switch (proxyType) {
    case 'nginx':
      var proxyConf = generateNginxConfig(SLAs, oasDoc);
      break;
    case 'haproxy':
      var proxyConf = generateHAproxyConfig(SLAs, oasDoc);
      break;
    case 'traefik':
      var proxyConf = generateTraefikConfig(SLAs, oasDoc);
      break;
    case 'envoy':
      var proxyConf = generateEnvoyConfig(SLAs, oasDoc);
      break;
  }

  // Write the obtained proxy config to file
  var configFile = outFile
  fs.writeFileSync(configFile, proxyConf);
}

module.exports = {
    generateConfigHandle: generateConfigHandle,
};
