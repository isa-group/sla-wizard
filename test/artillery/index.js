var fs = require('fs');
var path = require('path');
var jsyaml = require('js-yaml');
var jsonschema = require('jsonschema');
var url = require("url");
var axios = require("axios");
var configs = require("../../src/configs");
var utils = require("../../src/utils");
var child_process = require('child_process');

var artilleryTestingFile = "./test/artillery/artillery-testing.yaml"; // TODO: should be at /tmp
var artilleryResultsFile = "/tmp/sla4oai-tools-artillery-report.json";
var oasPath = process.argv[2];


// 1. Generate Artillery's YAML file - based on the provided OAS: take url and all paths with their limitations
if (oasPath === undefined){
    configs.logger.error("Path to OAS missing");
    process.exit();
}
configs.logger.info(`(TODO): Writing Artillery's testing file to ${artilleryTestingFile}`);


// 2. Run Artillery to get the JSON results
configs.logger.info("Running Artillery testing...");
child_process.execSync(`artillery run ${artilleryTestingFile} --output=${artilleryResultsFile}`);


// 3. Process (and output) the obtained JSON rresults
configs.logger.info("Obtained results:");
configs.logger.info("(TODO): check /tmp/sla4oai-tools-artillery-report.json");
