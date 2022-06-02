const { execSync } = require("child_process");
var chai = require("chai");
var configs = require("../src/configs.js");

var testConfig = "tests/basicTestConfig.yaml"
var oas4Test = "tests/specs/simple_api_oas.yaml"
var cmd = `node ./src/index.js runTest --specs $PWD/${testConfig} --oas $PWD/${oas4Test}`;
var globalTimeout = 10000;

function processRes(){
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
    apipeckerLogs = JSON.parse(apipeckerLogs);
  } catch (error) {
    configs.logger.error(`Error parsing APIPecker logs: ${error.message} (logs where: ${apipeckerLogs})`);
    process.exit();
  }

  console.log(JSON.stringify(apipeckerLogs))

  it('Just an obvious test', function () { // TODO: 1st ver. one of these per endpoint

    chai.expect(apipeckerLogs).to.have.lengthOf.above(2000); // TODO: process the JSON produced by runTest
  });
});
