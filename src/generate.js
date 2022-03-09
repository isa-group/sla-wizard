var fs = require('fs');
var path = require('path');
var jsyaml = require('js-yaml');
var winston = require('winston');
var ZSchema = require("z-schema");


/**
 * Create a Winston logger.
 */
function createNewLogger() {
  var customFormat = winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  );

  /**
   * Configure here your custom levels.
   */
  var customLevels = {
    levels: {
      error: 7,
      warn: 8,
      custom: 9,
      info: 10,
      debug: 11,
    },
    colors: {
      error: "red",
      warn: "yellow",
      custom: "magenta",
      info: "white",
      debug: "blue",
    },
  };

  winston.addColors(customLevels.colors);
  const transports = [
    new winston.transports.Console({
      level: "info",
      handleExceptions: true,
      json: false,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.splat(),
        customFormat
      ),
    }),
  ];
  return winston.createLogger({
    levels: customLevels.levels,
    transports,
    exitOnError: false,
  });
}


/**
 * Given a SLA-like period, returns the equivalent NGINX time period.
 * @param {string} period - One of: second, minute, hour, day, month and year.
 */
function nginxLimitPeriod(period){
  // TODO: this would only work for second and minute (wrongly for month too)
  return(period[0])
}


/**
 * Receives a SLA plan and produces (as string) an NGINX config file according
 * to the limitations it defines.
 * @param {object} slaPlans - SLA plan.
 * @param {object} oasDoc - Open API definition.
 */
function generateNginxConfig(slaPlans, oasDoc){
  var nginxTemplate = fs
                .readFileSync(path.join(__dirname, '../templates/nginx'))
                .toString();

  var limitsDefinition = "";
  var locationDefinitions = "";
  var api_server_url = oasDoc.servers[0].url;

  for (var plans in slaPlans){
    for (var endpoint in slaPlans[plans]["rates"]){ // TODO: quotas

      /////////////// LIMITS
      for (var method in slaPlans[plans]["rates"][endpoint]){
        if (method == "get"){ // TODO: other methods
          var method_specs = slaPlans[plans]["rates"][endpoint][method];
          var max = method_specs["requests"][0]["max"];
          var period = method_specs["requests"][0]["period"];
          var zone_name = endpoint.replace('/',''); // TODO: sanitize
          var zone_size = "10m" // 1 megabyte = 16k IPs
          period = nginxLimitPeriod(period);
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

  return nginxTemplate
            .replace('LIMIT_REQ_ZONE_PH', limitsDefinition)
            .replace('LOCATIONS_PH', locationDefinitions);
}


/**
 * Configuration file generation handle.
 * @param {string} file - Path to the OAS description.
 * @param {string} type - Proxy type.
 * @param {string} outFile - Path where to save the produced proxy configuration.
 */
function generateConfigHandle(file, type, outFile) {

  // Create logger
  var logger = createNewLogger();

  // Load OAS
  try {
    var spec = fs.readFileSync(path.join('', file), 'utf8');
    var oasDoc = jsyaml.load(spec);
    logger.info('Input oas-doc %s: %s', file, oasDoc);
  } catch (err) {
    logger.error("" + err);
    process.exit();
  }

  // Validate OAS
  var oas_schema = jsyaml.load(fs.readFileSync(
            path.join(__dirname, '../schemas/oas-3.0.yaml'), 'utf8'));
  var validator = new ZSchema();
  var err = validator.validate(oasDoc, oas_schema);
  if (err == false) {
    logger.info('oasDoc is not valid');
    //logger.error('oasDoc is not valid: ' + JSON.stringify(validator.getLastErrors()));
    //return;  //TODO: validation fails but works at https://editor.swagger.io/
  }

  // Load SLA (from OAS)
  var basePath = file.substring(0, file.lastIndexOf('/'));
  var partialSlaPath = oasDoc["info"]["x-sla"]["$ref"] // TODO: the path could be relative but absolute too
  var slaPath = path.join(basePath, partialSlaPath);
  var sla = fs.readFileSync(path.join('', slaPath), 'utf8');

  // Generate proxy config according to SLA
  var slaPlans = jsyaml.load(sla)["plans"];
  var proxyType = type // TODO: sanitize
  if (proxyType == "nginx"){
    var proxyConf = generateNginxConfig(slaPlans, oasDoc);
  }

  // Write the obtained proxy config to file
  var configFile = outFile // TODO: sanitize
  fs.writeFileSync(configFile, proxyConf);
}

module.exports = {
    generateConfigHandle: generateConfigHandle,
};
