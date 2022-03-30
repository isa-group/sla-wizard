var jsyaml = require('js-yaml');
var fs = require('fs');
var path = require('path');
var ZSchema = require("z-schema");
var nameValidator = require('validator');
var configs = require("./configs");
var assert = require("assert");


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
 *     - Its type is 'instance'
 * If any of the SLAs in the array does not conform to those two requirements,
 * the execution stops. Additionally, if the array contains duplicated SLAs, those
 * will be ignored.
 * @param {object} slaToValidate - An SLA to validate.
 */
function validateSLAs(SLAsToValidate){

  var SLAsFiltered = [];
  var SLAschema = jsyaml.load(fs.readFileSync(path.join(__dirname, '../schemas/sla.json'), 'utf8')); // TODO: check schema conforms to https://github.com/isa-group/SLA4OAI-Specification/blob/main/versions/1.0.0-Draft.md
  const validator = new ZSchema({
    ignoreUnresolvableReferences: true,
    ignoreUnknownFormats: true,
    breakOnFirstError: false,
  });
  configs.logger.debug("SLAs to validate:");
  configs.logger.debug(JSON.stringify(SLAsToValidate));
  SLAsToValidate.forEach(element => {
    var err = validator.validate(element, SLAschema);
    if (err == false) {
      configs.logger.error(`SLA with id ${element.context.id} is not valid ${JSON.stringify(validator.getLastErrors())}, quitting`);
      process.exit();
    }
    else if (element.context.type != "instance"){
      configs.logger.error(`SLA with id ${element.context.id} is not of type 'instance', quitting`);
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
 * Loads a proxy config template.
 * @param {string} configTemplatePath - Path to proxy config template.
*/
function getProxyConfigTemplate(configTemplatePath){
  return fs.readFileSync(path.join('', configTemplatePath));
}


module.exports = {
    sanitizeEndpoint: sanitizeEndpoint,
    validateSLAs: validateSLAs,
    getSLAsFromURL: getSLAsFromURL,
    isAValidUrl: isAValidUrl,
    getLimitPeriod: getLimitPeriod,
    getProxyConfigTemplate: getProxyConfigTemplate
};
