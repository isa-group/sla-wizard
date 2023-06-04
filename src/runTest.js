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
 * @param {string} requestsToSendPerTimeUnit - Iterations to do in the given period (total requests to send in 1 minute or second)
 * @param {string} timeUnitsToRun - Time units (for example, 20 seconds or 4 minutes) to run
 */
function getDelay(period, requestsToSendPerTimeUnit, timeUnitsToRun) {
    var totalNumberOfRequestsToSend = requestsToSendPerTimeUnit * timeUnitsToRun;
    if (period == "minute") {
        return (timeUnitsToRun * 60000) / totalNumberOfRequestsToSend;
    } else {
        return (timeUnitsToRun * 1000) / totalNumberOfRequestsToSend;
    }
}


/**
 * Returns a function that receives the results obtained by 
 * APIPecker, adds the method, plan name and endpoint and 
 * outputs a valid JSON.
 * Note this does not do anything else because the actual results 
 * analyzing is done in the script that is run with Mocha 
 * (check package.json).
 * @param {object} results - Results obtained by APIPecker.
 */
function getCustomResultsHandler(method, planName, endpoint) {
    return function(results) {
        console.log(JSON.stringify([{
            method: method,
            planName: planName,
            endpoint: endpoint,
            results: results.lotStats
        }]));
    }
}


/**
 * Returns an HTTP request builder to be used by API Pecker.
 * @param {string} authLocation - One of 'header', 'query' or 'url'. 
 * @param {string} method - HTTP method.
 * @param {string} apikey - API key.
 */
function getCustomRequestBuilder(authLocation, method, apikey) {
    return function() {
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
 * Returns a URL builder to be used in the request that API Pecker will perform.
 * @param {string} authLocation - One of 'header', 'query' or 'url'.  
 * @param {string} endpoint - API endpoint.
 * @param {string} apikey - API key.
 */
function getCustomUrlBuilder(authLocation, endpoint, apikey) {
    return function() {
        var url;
        if (authLocation == "header") {
            url = `http://localhost${endpoint}`;
        } else if (authLocation == "query") {
            url = `http://localhost${endpoint}?apikey=${apikey}`;
        } else if (authLocation == "url") {
            url = `http://localhost${endpoint}/${apikey}`;
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
    var authLocation = testSpecs["authLocation"];
    var extraRequests = testSpecs["extraRequests"];
    var minutesToRun = testSpecs["minutesToRun"];
    var secondsToRun = testSpecs["secondsToRun"];

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

                    var period = subSLARates[endpoint][method]["requests"][0]["period"];
                    var timeUnitsToRun;
                    if (period == "minute") {
                        timeUnitsToRun = minutesToRun;
                    } else {
                        timeUnitsToRun = secondsToRun;
                    }

                    // for testing
                    //console.log(`curl -X ${method.toUpperCase()} -H "apikey: ${slaApikeys[apikey]}" localhost${endpoint}; echo`)
                    var requestsToSendPerTimeUnit = subSLARates[endpoint][method]["requests"][0]["max"] * extraRequests; // extra requests to trigger 429s

                    /*
                    if (period == "second" && planName == "pro" && endpoint_sanitized == "/pets/id" && method == "delete"){
                        console.log(`${planName} - ${endpoint_sanitized} - ${method} - ${slaApikeys[apikey]}`)
                        console.log(`Will perform ${requestsToSendPerTimeUnit*timeUnitsToRun} requests with a delay of ${getDelay(period,requestsToSendPerTimeUnit,timeUnitsToRun)} milliseconds`);
                        console.log("------------------------")
                    }
                    */

                    apipecker.run({
                        concurrentUsers: 1,
                        iterations: requestsToSendPerTimeUnit * timeUnitsToRun, // runs for X units of "period" to check rates are reset
                        delay: getDelay(period, requestsToSendPerTimeUnit, timeUnitsToRun),
                        verbose: true,
                        urlBuilder: getCustomUrlBuilder(authLocation, endpoint_sanitized, slaApikeys[apikey]),
                        requestBuilder: getCustomRequestBuilder(authLocation, method, slaApikeys[apikey]),
                        resultsHandler: getCustomResultsHandler(method, planName, endpoint_sanitized)
                    });
                }
            }
        }
    }

    if (limitedPaths.length != Object.keys(oasDoc.paths).length) { // "ratelimiting-less" endpoints testing 
        for (var endpoint in oasDoc.paths) {
            if (!limitedPaths.includes(endpoint)) {
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
                            resultsHandler: getCustomResultsHandler(method, undefined, endpoint)
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