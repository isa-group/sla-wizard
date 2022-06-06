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


function customRequestBuilder(userId){
    var data = {
        user : userId
    };

    var jsonData = JSON.stringify(data);

    var requestConfig = {
        options: {
            method: "GET",
            headers: {
                'apikey': `${userId}`, // TODO: take from SLA's consumer
                'Content-Type': 'application/json',
                'Content-Length': jsonData.length
            }
        },
        data : jsonData
    }

    return requestConfig;
}

function customResultsHandler(results){
    console.log(JSON.stringify(results.lotStats));
}

function runTest(oasPath, testOptions){
  if (testOptions === undefined){
    configs.logger.info("Default test configurations will be used.");
    // TODO: load performancetTest.json
  }
  else {
    // TODO: load options.testConfig
  }

  // Load OAS from oasPath
  var oasDoc = utils.loadAndValidateOAS(oasPath);

  for (var endpoint in oasDoc.paths){ // TODO: this should be done for each plan in testOptions (for 'npm test' it should be all the plans in the SLAs linked to the provided OAS)

    console.log(endpoint);

    function customUrlBuilder(userId){
        var url =  `http://localhost${endpoint}?apikey=${userId}`;
        //console.log("Got: " + url);
        return url
    }

    apipecker.run({ // TODO: the logs produced by this are not in the same order as 'endpoint's because of the async
        concurrentUsers : 1,
        iterations : 1,
        delay : 1100, // in ms
        verbose : true,
        urlBuilder: customUrlBuilder,
        requestBuilder : customRequestBuilder,
        resultsHandler : customResultsHandler
    });

  }
}

module.exports = {
    runTest: runTest
};
