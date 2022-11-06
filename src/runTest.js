#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var jsyaml = require('js-yaml');
var configs = require("../src/configs");
var utils = require("../src/utils");
var apipecker = require("apipecker");


/**
 * Receives "minute" or "second" and returns the delay (in ms) to 
 * accommodate the requested iterations in a unit of that period of time. 
 * @param {string} period - One of: second or minute.
 * @param {string} iterations - Iterations to do in the given period.
 */
function getDelay(period, iterations = 10){
    if (period == "minute"){
        return 60000/iterations;
    } else {
        return 1000/iterations;
    }
}


/**
 * Gets a function that receives the results obtained by 
 * APIPecker, adds the method, plan name and endpoint and 
 * outputs a valid JSON.
 * Note this does not do anything else because the actual results 
 * analyzing is done in the script that is run with Mocha 
 * (check package.json).
 * @param {object} results - Results obtained by APIPecker.
 */
function getCustomResultsHandler(method, planName, endpoint) {
    return function (results) {
        console.log(JSON.stringify([{
            method: method,
            planName: planName,
            endpoint: endpoint,
            results: results.lotStats
        }]));
    }
}


/**
 * Gets an HTTP request builder to be used by API Pecker.
 * @param {string} authLocation - One of 'header', 'query' or 'url'. 
 * @param {string} method - HTTP method.
 * @param {string} apikey - API key.
 */
function getCustomRequestBuilder(authLocation, method, apikey) {
    return function () {
        var customRequest = {
            options: {
                method: method.toUpperCase()
            }
        }
        if (authLocation == "header") {
            customRequest["options"]["headers"] = {
                apikey: apikey
            }  
        }      
        return customRequest
    }
}


/**
 * Gets a URL builder to be used in the request that API Pecker will perform.
 * @param {string} authLocation - One of 'header', 'query' or 'url'.  
 * @param {string} endpoint - API endpoint.
 * @param {string} apikey - API key.
 */
function getCustomUrlBuilder(authLocation, endpoint, apikey) {
    return function () {
        if (authLocation == "header") {
            var url = `http://localhost${endpoint}`;
        } else if (authLocation == "query") {
            var url = `http://localhost${endpoint}?apikey=${apikey}`;
        } else if (authLocation == "url") {
            var url = `http://localhost${endpoint}/${apikey}`;
        }
        return url
    }
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
    var authLocation = testSpecs["authLocation"]

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
                    var endpoint_sanitized = endpoint.replace(/{|}/g, "");

                    // for testing
                    //console.log(`curl -X ${method.toUpperCase()} -H "apikey: ${slaApikeys[apikey]}" localhost${endpoint}; echo`)
                    var iterations = subSLARates[endpoint][method]["requests"][0]["max"]*3; // extra requests to trigger 429s
                    apipecker.run({
                        concurrentUsers: 1,
                        iterations: iterations*2, // runs for two units of "period" to check rates are reset
                        delay: getDelay(subSLARates[endpoint][method]["requests"][0]["period"],iterations),
                        verbose: true,
                        urlBuilder: getCustomUrlBuilder(authLocation, endpoint_sanitized, slaApikeys[apikey]),
                        requestBuilder: getCustomRequestBuilder(authLocation, method, slaApikeys[apikey]),
                        resultsHandler: getCustomResultsHandler(method, planName, endpoint_sanitized)
                    });
                }
            }
        }
    }

    if (limitedPaths.length != Object.keys(oasDoc.paths).length) { // "ratelimiting-less" endpoints testing // TODO: these should always get 20X
        for (var endpoint in oasDoc.paths) { // TODO: this should be done for each plan in testOptions (for 'npm test' it should be all the plans in the SLAs linked to the provided OAS)
            if (!limitedPaths.includes(endpoint)) { // "ratelimiting-less" endpoints 
                for (var method in oasDoc.paths[endpoint]) {
                    for (var apikey in allProxyApikeys) {
                        // If the endpoint has params these are "parametrized"
                        endpoint = endpoint.replace(/{|}/g, "");

                        // for testing
                        //console.log(`curl -X ${method.toUpperCase()} -H "apikey: ${allProxyApikeys[apikey]}" localhost${endpoint}; echo`)

                        apipecker.run({
                            concurrentUsers: 1,
                            iterations: 100,
                            delay: 100, // in ms
                            verbose: true,
                            urlBuilder: getCustomUrlBuilder(authLocation, endpoint, allProxyApikeys[apikey]),
                            requestBuilder: getCustomRequestBuilder(authLocation, method, allProxyApikeys[apikey]),
                            resultsHandler: getCustomResultsHandler(method, planName, endpoint)
                        });
                    }
                }
            }
        }
    }
}


module.exports = {
    runTest: runTest
};
