const { execSync } = require("child_process");
var chai = require("chai");
var configs = require("../src/configs.js");

var testConfig = "tests/basicTestConfig.yaml"
var oas4Test = "tests/specs/simple_api_oas.yaml"
var slasPath = "tests/specs/slas/"

// the output of this command is what is analyzed with chai, meaning it must be json only hence the LOGGER_LEVEL env. variable set to 'error'
var cmd = `export LOGGER_LEVEL=error ; node ./src/index.js runTest --specs $PWD/${testConfig} --oas $PWD/${oas4Test} --sla ${slasPath}`;
var globalTimeout = 10000;

function processRes() {
  var deniedRequests = 0;
  for (var stats in results.lotStats) {
    var statusCode = results.lotStats[stats].result.stats[0].statusCode;
    if (statusCode != 200) {
      deniedRequests++;
    }
    var userID = results.lotStats[stats].result.stats[0].id;
    var iterationId = results.lotStats[stats].id
    configs.logger.info(`${iterationId}: ${userID} - ${statusCode}`);
  }
  var totalRequests = results.lotStats.length;
  configs.logger.info("Sucess: " + (100 - (deniedRequests / totalRequests * 100)) + "%");
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

  it('Check number of endpoints tested', function () { // TODO: 1st ver. one of these per endpoint
    chai.expect(apipeckerLogs).to.have.lengthOf(48); // TODO: process the JSON produced by runTest
  });
  it('Check all requests succeeded', function () { // TODO: this will happen only in the first iteration. The second will get some 429 already
    apipeckerLogs.forEach(result => {
      chai.expect(result["result"]["stats"][0]["statusCode"]).to.equal(200); // TODO: process the JSON produced by runTest
    });

  });
});
