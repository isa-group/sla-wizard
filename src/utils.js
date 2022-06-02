var jsyaml = require('js-yaml');
var fs = require('fs');
var path = require('path');
var jsonschema = require('jsonschema');
var url = require("url");
var nameValidator = require('validator');
var assert = require("assert");
var configs = require("./configs");
var generate = require("./generate");


/**
 * Validates user provided (CLI) parameters.
 * @param {object} proxy - Proxy type.
 * @param {object} options - CLI options.
 */
function validateParamsCLI(proxy, options){ // TODO
  return proxy, options;
}


/**
 * Loads and validates an OAS document. In case it's valid, returns the
 * OAS object.
 * @param {string} file - Path to the OAS description.
 */
function loadAndValidateOAS(file){

  // Load
  try {
    var spec = fs.readFileSync(path.join('', file), 'utf8');
    var oasDoc = jsyaml.load(spec);
    configs.logger.info('Input oas-doc %s: %s', file, oasDoc);
  } catch (err) {
    configs.logger.error("Error loading OAS file: " + err);
    process.exit();
  }

  // Validate
  var oas_schema = jsyaml.load(fs.readFileSync(path.join(__dirname, '../schemas/openapi-3.0.yaml'), 'utf8'));
  var validator = new jsonschema.Validator()
  var err = validator.validate(oasDoc, oas_schema);
  if (err.valid == false) {
    configs.logger.error(`oasDoc is not valid: ${err.errors}, quitting`);
    process.exit();
  }
  return oasDoc;
}


/**
 * Checks if an array contains an (complex) object.
 * @param {array} arrayOfObjects - An array of objects.
 * @param {object} objectToCheck - An SLA to validate.
 */
function arrayContainsObject(arrayOfObjects, objectToCheck){ // TODO: not performant if the array is large
  var res = false
  arrayOfObjects.forEach(element => {
    try {
       assert.deepStrictEqual(element, objectToCheck)
       res = true;
    } catch (err) {}
  });
  return res;
}


/**
 * Sanitizes the endpoint to be used for naming zones, servers, etc.
 * @param {string} input - Endpoint to sanitize.
 */
function sanitizeEndpoint(input) {
  var chars = '-AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789';
  return nameValidator.whitelist(input, chars);
}


/**
 * Validates an array of SLA. For each SLA, it checks:
 *     - It conforms to the SLA schema
 *     - Its type is 'agreement'
 * If any of the SLAs in the array does not conform to those two requirements,
 * the execution stops. Additionally, if the array contains duplicated SLAs, those
 * will be ignored.
 * @param {object} slaToValidate - An SLA to validate.
 */
function validateSLAs(SLAsToValidate){

  var SLAsFiltered = [];
  var SLAschema = jsyaml.load(fs.readFileSync(path.join(__dirname, '../schemas/sla.json'), 'utf8')); // TODO: check schema conforms to https://github.com/isa-group/SLA4OAI-Specification/blob/main/versions/1.0.0-Draft.md
  configs.logger.debug("SLAs to validate:");
  configs.logger.debug(JSON.stringify(SLAsToValidate));
  SLAsToValidate.forEach(element => {
    var validator = new jsonschema.Validator()
    var err = validator.validate(element, SLAschema);
    if (err.valid == false) {
      configs.logger.error(`SLA with id ${element.context.id} is not valid: ${err.errors}, quitting`);
      process.exit();
    }
    else if (element.context.type != "agreement"){
      configs.logger.error(`SLA with id ${element.context.id} is not of type 'agreement', quitting`);
      process.exit();
    }

    else if (arrayContainsObject(SLAsFiltered, element)){ // else if (SLAsFiltered.includes(element)){
      configs.logger.warn(`SLA with id ${element.context.id} is duplicated`);
    }
    else {
      SLAsFiltered.push(element);
    }
  });

  if (SLAsFiltered.length == 0 ){
    configs.logger.error("None of the provided SLAs is valid, nothing to do. ");
    process.exit();
  }
  configs.logger.debug("Valid SLAs:");
  configs.logger.debug(JSON.stringify(SLAsFiltered));
  return SLAsFiltered;
}


/**
 * Given a string, checks if it's a valid URL.
 * @param {string} potentialURL - A potential URL.
 */
function isAValidUrl(potentialURL){
  try {
    new url.URL(potentialURL);
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
 * Loads a proxy config template.
 * @param {string} configTemplatePath - Path to proxy config template.
*/
function getProxyConfigTemplate(configTemplatePath){
  return fs.readFileSync(path.join('', configTemplatePath));
}


module.exports = {
    sanitizeEndpoint: sanitizeEndpoint,
    validateSLAs: validateSLAs,
    isAValidUrl: isAValidUrl,
    getLimitPeriod: getLimitPeriod,
    getProxyConfigTemplate: getProxyConfigTemplate,
    validateParamsCLI: validateParamsCLI,
    loadAndValidateOAS: loadAndValidateOAS
};
