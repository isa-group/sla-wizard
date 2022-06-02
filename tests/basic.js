const { execSync } = require("child_process");
var chai = require("chai");
var configs = require("../src/configs.js");

var testConfig = "basicTestConfig.yaml"
var oas4Test = "specs/simple_api_oas.yaml"
var cmd = `node ./src/index.js runTest --specs ${testConfig} --oas ${oas4Test}`;
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
    var slaWizardLogs = JSON.parse(execSync(cmd).toString());
  } catch (error) {
    configs.logger.error(error); // `Status Code: ${error.status} with '${error.message}'`
    process.exit();
  }

  console.log(slaWizardLogs[0])

  it('Just an obvious test', function () { // TODO: 1st ver. one of these per endpoint

    chai.expect(slaWizardLogs).to.have.lengthOf.above(2000); // TODO: process the JSON produced by runTest
  });
});
