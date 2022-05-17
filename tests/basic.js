const { exec } = require("child_process");
var chai = require("chai");

var cmd = "node ./src/index.js runTest --json --specs basicTestConfig.yaml --oas specs/simple_api_oas.yaml"; // TODO: take parameters provided to 'npm test'

describe('Test', function () {
  it('Just an obvious test', function () {

    exec(cmd, (error, stdout, stderr) => { // TODO: fix async
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      var slaWizardLogs = stdout;
      //console.log(slaWizardLogs);

      chai.expect(slaWizardLogs).to.have.lengthOf.above(2000); // TODO: process the JSON produced by runTest

    });
  });
});
