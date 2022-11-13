const { execSync } = require("child_process");
var chai = require("chai");
var configs = require("../src/configs.js");

var testConfig = "tests/basicTestConfig.yaml"
var oas4Test = "tests/specs/simple_api_oas.yaml"
var slasPath = "tests/specs/slas/"

// the output of this command is what is analyzed with chai, meaning it must be json only hence the LOGGER_LEVEL env. variable set to 'error'
var cmd = `export LOGGER_LEVEL=error ; node ./src/index.js runTest --specs $PWD/${testConfig} --oas $PWD/${oas4Test} --sla ${slasPath}`;
var globalTimeout = 10000;


/**
 * Runs a Chai test checking that the given plan-endpoint-method combination got 
 * the expected accepted requests according to the SLA. 
 * @param {object} apipeckerLogs - Logs from API Pecker.
 * @param {string} planName - Plan name, such as "pro".
 * @param {string} endpoint - An API endpoint (without host).
 * @param {string} method - A CRUD method. 
 * @param {string} expectedSuccess - The number of requests that should get HTTP 200. 
 */
function chaiModularized(apipeckerLogs, planName, endpoint, method, expectedSuccess) {
  var http200 = 0;
  apipeckerLogs.forEach(result => {
    if (result["planName"] == planName && result["endpoint"] == endpoint && result["method"] == method) {
      result["results"].forEach(iterationResults => {
        if (iterationResults["result"]["stats"][0]["statusCode"] == 200) {
          http200++;
        }
      });
    }
  });
  chai.expect(http200).to.equal(expectedSuccess);
}


describe(`Testing based on ${testConfig}`, function () {

  this.timeout(globalTimeout);

  try {
    var apipeckerLogs = execSync(cmd).toString()
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

  it('BASIC PLAN: GET to /pets - 1 per second', function () {
    chaiModularized(apipeckerLogs, "basic", "/pets", "get", 6); // 3 apikeys, 2 seconds, 1 request accepted
  });
  it('BASIC PLAN: POST to /pets - 2 per minute', function () {
    chaiModularized(apipeckerLogs, "basic", "/pets", "post", 12); // 3 apikeys, 2 minutes, 2 requests accepted
  });
  it('BASIC PLAN: GET to /pets/id - 3 per second', function () {
    chaiModularized(apipeckerLogs, "basic", "/pets/id", "get", 18); // 3 apikeys, 2 seconds, 3 requests accepted
  });
  it('BASIC PLAN: PUT to /pets/id - 4 per minute', function () {
    chaiModularized(apipeckerLogs, "basic", "/pets/id", "put", 24); // 3 apikeys, 2 minutes, 4 requests accepted
  });
  it('BASIC PLAN: DELETE to /pets/id - 5 per second', function () {
    chaiModularized(apipeckerLogs, "basic", "/pets/id", "delete", 30); // 3 apikeys, 2 seconds, 5 requests accepted
  });

  it('PRO PLAN: GET to /pets - 10 per second', function () {
    chaiModularized(apipeckerLogs, "pro", "/pets", "get", 60); // 3 apikeys, 2 seconds, 10 requests accepted
  });
  it('PRO PLAN: POST to /pets - 20 per minute', function () {
    chaiModularized(apipeckerLogs, "pro", "/pets", "post", 120); // 3 apikeys, 2 minutes, 20 requests accepted
  });
  it('PRO PLAN: GET to /pets/id - 30 per second', function () {
    chaiModularized(apipeckerLogs, "pro", "/pets/id", "get", 180); // 3 apikeys, 2 seconds, 30 requests accepted
  });
  it('PRO PLAN: PUT to /pets/id - 40 per minute', function () {
    chaiModularized(apipeckerLogs, "pro", "/pets/id", "put", 240); // 3 apikeys, 2 minutes, 40 requests accepted
  });
  it('PRO PLAN: DELETE to /pets/id - 50 per second', function () {
    chaiModularized(apipeckerLogs, "pro", "/pets/id", "delete", 300); // 3 apikeys, 2 seconds, 50 requests accepted
  });
});
