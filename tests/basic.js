var cp = require('child_process');
var chai = require("chai");
var configs = require("../src/configs.js");
var jsyaml = require('js-yaml');
var fs = require('fs');
var path = require('path');

var globalTimeout = 10000;
var testConfig = process.env.TEST_CONFIG;
var oas4Test = process.env.OAS4TEST;
var slasPath = process.env.SLAS_PATH;

if (testConfig == undefined) { // "tests/basicTestConfig.yaml"
    console.log("TEST_CONFIG not defined");
    process.exit(1)
}
if (oas4Test == undefined) { // "tests/specs/simple_api_oas.yaml"
    console.log("OAS4TEST not defined")
    process.exit(1)
}
if (slasPath == undefined) { // "tests/specs/slas/"
    console.log("SLAS_PATH not defined")
    process.exit(1)
}

// Load one of the SLAs to count the API keys
var slaFileNames = fs.readdirSync(slasPath);
var numApikeys = jsyaml.load(fs.readFileSync(path.join(slasPath, slaFileNames[0]),
    'utf8')).context.apikeys.length; // this is the number of API keys of a single SLA
var slasPerPlan = slaFileNames.length / 2; // divided by two because there are two plans: basic and pro

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
    chai.expect(http200).to.equal(expectedSuccess);
}

describe(`Testing based on ${testConfig}`, function() {

    this.timeout(globalTimeout);

    try {

        // The output of this command is what is analyzed with chai, meaning it must be JSON only, hence the LOGGER_LEVEL variable set to 'error'
        // `export LOGGER_LEVEL=error ; node ./src/index.js runTest --specs $PWD/${testConfig} --oas $PWD/${oas4Test} --sla ${slasPath}`
        console.log(new Date());
        var apipeckerLogs = cp.spawnSync("node",
            ["./src/index.js",
                "runTest",
                "--specs",
                `${testConfig}`,
                "--oas",
                `${oas4Test}`,
                "--sla", 
                `${slasPath}`
            ], {
                encoding: 'utf8',
                env: {
                    LOGGER_LEVEL: "error"
                },
                maxBuffer: 1024 * 1024 * 1024
            }).stdout;
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

    // process the JSON produced by runTest

    it('Check number of tests performed', function() {
        // 144 - (6 SLAs * 3 apikeys per sla * 5 endpointsAndMethod API has) + (3 apikeys per SLA * 6 SLAs * 3 open endpointsAndMethod API has) [All endpoints' RL]
        // 108 - (6 SLAs * 3 apikeys per sla * 3 endpointsAndMethod API has) + (3 apikeys per SLA * 6 SLAs * 3 open endpointsAndMethod API has) [Only 'per second' RL endpoints]
        // 90 - (6 SLAs * 3 apikeys per sla * 2 endpointsAndMethod API has) + (3 apikeys per SLA * 6 SLAs * 3 open endpointsAndMethod API has) [Only 'per minute' RL endpoints]
        chai.expect(apipeckerLogs).to.have.lengthOf(144); // 
    });

    it('Check all requests to rate limiting-less endpoints succeeded', function() {
        apipeckerLogs.forEach(result => {
            if (result["endpoint"].includes("/open-endpoint")) {
                result["results"].forEach(iterationResults => {
                    chai.expect(iterationResults["result"]["stats"][0]["statusCode"]).to.equal(200);
                });
            }
        });
    });

    var testSpecs = jsyaml.load(fs.readFileSync(testConfig, 'utf8'));
    var minutesToRun = testSpecs["minutesToRun"];
    var secondsToRun = testSpecs["secondsToRun"];

    it('BASIC PLAN: GET to /pets - 1 per second', function() {
        var allowed = 1;
        chaiModularized(apipeckerLogs, "basic", "/pets", "get", allowed * numApikeys * secondsToRun * slasPerPlan);
    });
    it('BASIC PLAN: POST to /pets - 2 per minute', function() {
        var allowed = 2;
        chaiModularized(apipeckerLogs, "basic", "/pets", "post", allowed * numApikeys * minutesToRun * slasPerPlan);
    });
    it('BASIC PLAN: GET to /pets/id - 3 per second', function() {
        var allowed = 3;
        chaiModularized(apipeckerLogs, "basic", "/pets/id", "get", allowed * numApikeys * secondsToRun * slasPerPlan);
    });
    it('BASIC PLAN: PUT to /pets/id - 4 per minute', function() {
        var allowed = 4;
        chaiModularized(apipeckerLogs, "basic", "/pets/id", "put", allowed * numApikeys * minutesToRun * slasPerPlan);
    });
    it('BASIC PLAN: DELETE to /pets/id - 5 per second', function() {
        var allowed = 5;
        chaiModularized(apipeckerLogs, "basic", "/pets/id", "delete", allowed * numApikeys * secondsToRun * slasPerPlan);
    });

    it('PRO PLAN: GET to /pets - 10 per second', function() {
        var allowed = 10;
        chaiModularized(apipeckerLogs, "pro", "/pets", "get", allowed * numApikeys * secondsToRun * slasPerPlan);
    });
    it('PRO PLAN: POST to /pets - 20 per minute', function() {
        var allowed = 20;
        chaiModularized(apipeckerLogs, "pro", "/pets", "post", allowed * numApikeys * minutesToRun * slasPerPlan);
    });
    it('PRO PLAN: GET to /pets/id - 30 per second', function() {
        var allowed = 30;
        chaiModularized(apipeckerLogs, "pro", "/pets/id", "get", allowed * numApikeys * secondsToRun * slasPerPlan);
    });
    it('PRO PLAN: PUT to /pets/id - 40 per minute', function() {
        var allowed = 40;
        chaiModularized(apipeckerLogs, "pro", "/pets/id", "put", allowed * numApikeys * minutesToRun * slasPerPlan);
    });
    it('PRO PLAN: DELETE to /pets/id - 50 per second', function() {
        var allowed = 50;
        chaiModularized(apipeckerLogs, "pro", "/pets/id", "delete", allowed * numApikeys * secondsToRun * slasPerPlan);
    });
});