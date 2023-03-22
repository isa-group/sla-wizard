var cp = require('child_process');
var chai = require("chai");
var configs = require("../src/configs.js");
var jsyaml = require('js-yaml');
var fs = require('fs');
var testConfig = "tests/basicTestConfig.yaml"
var oas4Test = "tests/specs/simple_api_oas.yaml"
var slasPath = "tests/specs/slas/"

var globalTimeout = 10000;
var numApikeys = 3;


/**
 * Runs a Chai test checking that the given plan-endpoint-method combination got 
 * the expected accepted requests according to the SLA. 
 * @param {object} apipeckerLogs - Logs from API Pecker.
 * @param {string} planName - Plan name, such as "pro".
 * @param {string} endpoint - An API endpoint (without host).
 * @param {string} method - A CRUD method. 
 * @param {string} expectedSuccess - The number of requests that should get HTTP 200. 
 * @param {string} expectedFailure - The number of requests that should get HTTP 429. 
 */
function chaiModularized(apipeckerLogs, planName, endpoint, method, expectedSuccess, expectedFailure) {
  var http200 = 0;
  var http429 = 0;
  var httpOther = [];
  apipeckerLogs.forEach(result => {
    if (result["planName"] == planName && result["endpoint"] == endpoint && result["method"] == method) {
      result["results"].forEach(iterationResults => {
        if (iterationResults["result"]["stats"][0]["statusCode"] == 200) {
          http200++;
        } else if (iterationResults["result"]["stats"][0]["statusCode"] == 429) {
          http429++;
        } else {
          httpOther.push(iterationResults["result"]["stats"][0]["statusCode"]);
        }
      });
    }
  });
  console.log(`Received 200s: ${http200}`);
  console.log(`Received 429s: ${http429}`);
  console.log(`(Sum: ${http200+http429})`);
  console.log(`Other codes: ${httpOther}`);
  chai.expect(http200).to.equal(expectedSuccess) //&& chai.expect(http429).to.equal(expectedFailure);
}

describe(`Testing based on ${testConfig}`, function () {

  this.timeout(globalTimeout);

  try {
    
    // The output of this command is what is analyzed with chai, meaning it must be JSON only hence the LOGGER_LEVEL variable set to 'error'
    // `export LOGGER_LEVEL=error ; node ./src/index.js runTest --specs $PWD/${testConfig} --oas $PWD/${oas4Test} --sla ${slasPath}`
    console.log(new Date());
    var apipeckerLogs = cp.spawnSync("node", 
                                    ["./src/index.js", 
                                     "runTest", 
                                     "--specs",
                                     `${testConfig}`,
                                     "--oas",
                                     `${oas4Test}`,
                                     "--sla",`${slasPath}`], 
                                     { encoding : 'utf8',
                                       env: {LOGGER_LEVEL:"error"},
                                       maxBuffer: 1024 * 1024 * 1024 }).stdout;
  } catch (error) {
    configs.logger.error(`Ran runTest but: ${error.status} with '${error.message}'`); 
    process.exit();
  }

  try {
    apipeckerLogs = JSON.parse(apipeckerLogs.replace(/\]\n\[/g, ","));
  } catch (error) {
    configs.logger.error(`Error parsing APIPecker logs: ${error.message}. Logs were: \n${apipeckerLogs}`);
    process.exit();
  }

  it('Check number of tests performed', function () {
    chai.expect(apipeckerLogs).to.have.lengthOf(48); // process the JSON produced by runTest
  });

  it('Check all requests to rate limiting-less endpoints succeeded', function () {
    apipeckerLogs.forEach(result => {
      if (result["endpoint"].includes("/open-endpoint")) {
        result["results"].forEach(iterationResults => {
          chai.expect(iterationResults["result"]["stats"][0]["statusCode"]).to.equal(200);
        });
      }
    });
  });

  var testSpecs = jsyaml.load(fs.readFileSync(testConfig, 'utf8'));
  var extraRequests = testSpecs["extraRequests"];
  var minutesToRun = testSpecs["minutesToRun"];
  var secondsToRun = testSpecs["secondsToRun"];
  
  it('BASIC PLAN: GET to /pets - 1 per second', function () {
    var allowed = 1;
    chaiModularized(apipeckerLogs, "basic", "/pets", "get", allowed*numApikeys*secondsToRun);
  });
  it('BASIC PLAN: POST to /pets - 2 per minute', function () {
    var allowed = 2;
    chaiModularized(apipeckerLogs, "basic", "/pets", "post", allowed*numApikeys*minutesToRun);
  });
  it('BASIC PLAN: GET to /pets/id - 3 per second', function () {
    var allowed = 3;
    chaiModularized(apipeckerLogs, "basic", "/pets/id", "get", allowed*numApikeys*secondsToRun);
  });
  it('BASIC PLAN: PUT to /pets/id - 4 per minute', function () {
    var allowed = 4;
    chaiModularized(apipeckerLogs, "basic", "/pets/id", "put", allowed*numApikeys*minutesToRun);
  });
  it('BASIC PLAN: DELETE to /pets/id - 5 per second', function () {
    var allowed = 5;
    chaiModularized(apipeckerLogs, "basic", "/pets/id", "delete", allowed*numApikeys*secondsToRun);
  });

  it('PRO PLAN: GET to /pets - 10 per second', function () {
    var allowed = 10;
    chaiModularized(apipeckerLogs, "pro", "/pets", "get", allowed*numApikeys*secondsToRun);
  });
  it('PRO PLAN: POST to /pets - 20 per minute', function () {
    var allowed = 20;
    chaiModularized(apipeckerLogs, "pro", "/pets", "post", allowed*numApikeys*minutesToRun);
  });
  it('PRO PLAN: GET to /pets/id - 30 per second', function () {
    var allowed = 30;
    chaiModularized(apipeckerLogs, "pro", "/pets/id", "get", allowed*numApikeys*secondsToRun);
  });
  it('PRO PLAN: PUT to /pets/id - 40 per minute', function () {
    var allowed = 40;
    chaiModularized(apipeckerLogs, "pro", "/pets/id", "put", allowed*numApikeys*minutesToRun);
  });
  it('PRO PLAN: DELETE to /pets/id - 50 per second', function () {
    var allowed = 50;
    chaiModularized(apipeckerLogs, "pro", "/pets/id", "delete", allowed*numApikeys*secondsToRun);
  });
});