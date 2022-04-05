var fs = require('fs');
var jsyaml = require('js-yaml');
var express = require("express");
var app = express();

var port = 8989;
var endpoint = "/array-of-slas";

app.listen(port, function(){
  console.log(`Ready at localhost:${port}${endpoint}`);
});

app.get(endpoint, function(req,res){
  var slas = [];
  var slaPaths = ["../specs/slas/sla1.yaml", "../specs/slas/sla2.yaml"];
  slaPaths.forEach(function(item){
    slas.push(jsyaml.load(fs.readFileSync(item)));
  });
  res.send(slas);
});
