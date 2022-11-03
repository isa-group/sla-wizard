#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var jsyaml = require('js-yaml');
var configs = require("../src/configs");
var utils = require("../src/utils");
var apipecker = require("apipecker");

const authLocation = "query";

/**
 * Receives the results obtained by APIPecker and outputs a valid JSON.
 * Note this does not do anything else because the actual results processing
 * is done in the script that is run with Mocha (check package.json).
 * @param {object} results - Results obtained by APIPecker.
 */
function customResultsHandler(results) {
    console.log(JSON.stringify(results.lotStats));
}


/**
 * Tests the correctness of a proxy configuration made by SLA Wizard using API Pecker.
 * @param {string} oasPath - Path to an OpenAPI Specification document.
 * @param {string} slaPath - Path to SLA agreement(s).
 * @param {string} testOptions - Configuration of the test to be run.
 */
function runTest(oasPath, slaPath, testOptions = "./specs/testSpecs.yaml") {

    var limitedPaths = [];
    var allProxyApikeys = [];

    // Load test configuration
    var testSpecs = jsyaml.load(fs.readFileSync(path.join('', testOptions), 'utf8'));

    // Load OAS from oasPath
    var oasDoc = utils.loadAndValidateOAS(oasPath);

    // Load and validate all SLA(s)
    var SLAs = [];

    try {
        if (fs.lstatSync(slaPath).isDirectory()) { // FOLDER (if there's a folder inside the folder this will fail)
            fs.readdirSync(slaPath).forEach(file => {
                var partialSlaPath = path.join(slaPath, file); // add base path to SLA paths
                configs.logger.debug(`File in directory: ${partialSlaPath}`);
                SLAs.push(jsyaml.load(fs.readFileSync(path.join('', partialSlaPath), 'utf8')));
            });
        } else { // FILE
            configs.logger.debug(`File: ${slaPath}`);
            var slaPath = slaPath; // add base path to SLA paths
            SLAs.push(jsyaml.load(fs.readFileSync(path.join('', slaPath), 'utf8')));
        }
    } catch (err) {
        configs.logger.error(`Error with SLA(s) ${slaPath}: ${err}. Quitting`);
        process.exit();
    }


    var SLAsFiltered = utils.validateSLAs(SLAs);

    for (var subSLA of SLAsFiltered) {
        var planName = subSLA["plan"]["name"];
        var subSLARates = subSLA["plan"]["rates"];
        var slaApikeys = subSLA["context"]["apikeys"]
        allProxyApikeys = allProxyApikeys.concat(slaApikeys);

        for (var endpoint in subSLARates) {
            limitedPaths.indexOf(endpoint) === -1 ? limitedPaths.push(endpoint) : {};

            for (var method in subSLARates[endpoint]) {
                for (var apikey in slaApikeys) {
                    // If the endpoint has params these are "parametrized"
                    endpoint = endpoint.replace(/{|}/g, "");

                    // for testing
                    console.log(`curl -X ${method.toUpperCase()} -H "apikey: ${slaApikeys[apikey]}" localhost${endpoint}; echo`)

                    /**
                     * Builds a URL to be used in the request that API Pecker will perform.
                     */
                    function customUrlBuilder() {
                        if (authLocation == "header") {
                            var url = `http://localhost${endpoint}`;
                        } else if (authLocation == "query") {
                            var url = `http://localhost${endpoint}?apikey=${slaApikeys[apikey]}`;
                        } else if (authLocation == "url") {
                            var url = `http://localhost${endpoint}/${slaApikeys[apikey]}`;
                        }
                        console.log("Url: " + url)
                        return url
                    }

                    /**
                     * Builds an HTTP request to be used by API Pecker.
                     */
                    function customRequestBuilder() {
                        var customRequest = {
                            options: {
                                method: method.toUpperCase(),
                                headers: {
                                    'apikey': `'${slaApikeys[apikey]}'`
                                }
                            }
                        }
                        console.log(customRequest)
                        return customRequest;
                    }

                    apipecker.run({
                        concurrentUsers: 1,
                        iterations: testSpecs["clients"].find(item => item.type == planName)["count"],
                        delay: 1100, // in ms
                        verbose: true,
                        urlBuilder: customUrlBuilder,
                        requestBuilder: customRequestBuilder, 
                        resultsHandler: customResultsHandler
                    });
                }
            }
        }
    }

    /*
    if (limitedPaths.length != Object.keys(oasDoc.paths).length) { // "ratelimiting-less" endpoints testing // TODO: these should always get 20X
        for (var endpoint in oasDoc.paths) { // TODO: this should be done for each plan in testOptions (for 'npm test' it should be all the plans in the SLAs linked to the provided OAS)
            if (!limitedPaths.includes(endpoint)) { // "ratelimiting-less" endpoints 
                for (var method in oasDoc.paths[endpoint]) {
                    for (var apikey in allProxyApikeys) {
                        // If the endpoint has params these are "parametrized"
                        endpoint = endpoint.replace(/{|}/g, "");

                        // for testing
                        console.log(`curl -X ${method.toUpperCase()} -H "apikey: ${allProxyApikeys[apikey]}" localhost${endpoint}; echo`)

                        apipecker.run({
                            concurrentUsers: 1,
                            iterations: 1,
                            delay: 1100, // in ms
                            verbose: true,
                            urlBuilder: customUrlBuilder, //(endpoint, slaApikeys[apikey]),
                            requestBuilder: customRequestBuilder, //(method, slaApikeys[apikey]),
                            resultsHandler: customResultsHandler
                        });
                    }
                }
            }
        }
    }
    */
}


module.exports = {
    runTest: runTest
};
