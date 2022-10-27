#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var jsyaml = require('js-yaml');
var jsonschema = require('jsonschema');
var configs = require("../src/configs");
var utils = require("../src/utils");


var apipecker = require("apipecker");
var commander = require('commander');
var program = new commander.Command();

const authLocation = "header";

function customResultsHandler(results) {
    console.log(JSON.stringify(results.lotStats));
}

function customRequestBuilder(method, apikey, authLocation) {
    var data = { user: apikey }; // TODO: data is not needed
    var jsonData = JSON.stringify(data);
    var requestConfig = {
        options: {
            method: method.toUpperCase(),
            headers: {
                'apikey': `'${apikey}'`, // TODO: take from SLA's context.apikeys
                'Content-Type': 'application/json',
                'Content-Length': jsonData.length
            }
        },
        data: jsonData
    }
    return requestConfig;
}

function customUrlBuilder(authLocation, endpoint, apikey) { // TODO: the function argument here is used if the apikey is a query parameter
    
    if (authLocation == "header"){
        var url = `http://localhost${endpoint}`;
    } else if (authLocation == "query"){
        var url =  `http://localhost${endpoint}?apikey=${apikey}`;    
    } else if (authLocation == "url"){
        var url =  `http://localhost${endpoint}/${apikey}`;    
    }
    return url
}

function runTest(oasPath, slaPath, testOptions) {

    var limitedPaths = [];
    var allProxyApikeys = [];

    if (testOptions === undefined) {
        //configs.logger.info("Default test configurations will be used.");
        // TODO: load performancetTest.json
    }
    else {
        // TODO: load options.testConfig
    }

    // Load OAS from oasPath
    var oasDoc = utils.loadAndValidateOAS(oasPath);

    // Load and validate all SLA(s)
    var SLAs = [];
    if (fs.lstatSync(slaPath).isDirectory()) { // FOLDER
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
    var SLAsFiltered = utils.validateSLAs(SLAs);

    for (var subSLA of SLAsFiltered) {
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

                    apipecker.run({ // TODO: the logs produced by this are not in the same order as 'endpoint's because of the async
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


    if (limitedPaths.length != Object.keys(oasDoc.paths).length) { // "ratelimiting-less" endpoints testing
        for (var endpoint in oasDoc.paths) { // TODO: this should be done for each plan in testOptions (for 'npm test' it should be all the plans in the SLAs linked to the provided OAS)
            if (!limitedPaths.includes(endpoint)) { // "ratelimiting-less" endpoints 
                for (var method in oasDoc.paths[endpoint]) {
                    for (var apikey in allProxyApikeys) {
                        // If the endpoint has params these are "parametrized"
                        endpoint = endpoint.replace(/{|}/g, "");

                        // for testing
                        console.log(`curl -X ${method.toUpperCase()} -H "apikey: ${allProxyApikeys[apikey]}" localhost${endpoint}; echo`)
                        
                        apipecker.run({ // TODO: the logs produced by this are not in the same order as 'endpoint's because of the async
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
}

module.exports = {
    runTest: runTest
};
