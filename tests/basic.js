#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var jsyaml = require('js-yaml');
var jsonschema = require('jsonschema');
var configs = require("../../src/configs");
var utils = require("../../src/utils");


var apipecker = require("apipecker");
var commander = require('commander');
var program = new commander.Command();

function customUrlBuilder(userId){
    var url = "http://localhost/once-per-second-endpoint";
    var url = "http://localhost/once-per-second-endpoint";
    //var url = "http://localhost/open-endpoint";
    return url;
}

function customRequestBuilder(userId){
    var data = {
        user : userId
    };

    var jsonData = JSON.stringify(data);

    var requestConfig = {
        options: {
            method: "GET",
            headers: {
                'Api-Token': 'TOKEN-'+userId, // TODO: take from SLA's consumer
                'Content-Type': 'application/json',
                'Content-Length': jsonData.length
            }
        },
        data : jsonData
    }

    return requestConfig;
}

function customResultsHandler(results){
    var deniedRequests = 0;
    for (var stats in results.lotStats) {
        var statusCode = results.lotStats[stats].result.stats[0].statusCode;
        if (statusCode == 429) {
          deniedRequests++;
        }
        var userID = results.lotStats[stats].result.stats[0].id;
        var iterationId = results.lotStats[stats].id
        configs.logger.info(`${iterationId}: ${userID} - ${statusCode}`);
    }
    var totalRequests = results.lotStats.length;
    configs.logger.info("Sucess: " + (100 - (deniedRequests / totalRequests * 100)) + "%");
}

function runTest(oasPath, testOptions){
  if (options.testConfig === undefined){
    configs.logger.info("Default test configurations will be used.");
    // TODO: load performancetTest.json
  }
  else {
    // TODO: load options.testConfig
  }

  //TODO: load OAS from oasPath

  apipecker.run({
      concurrentUsers : 1,
      iterations : 6,
      delay : 1100, // in ms
      verbose : true,
      urlBuilder: customUrlBuilder,
      requestBuilder : customRequestBuilder,
      resultsHandler : customResultsHandler
  });
}
