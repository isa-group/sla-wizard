var express = require("express");
var app = express();

var port = 9999;

app.listen(port, function(){
  console.log("Ready at " + port);
});

app.get("/open-endpoint", function(req,res){
  res.send({"endpoint":"/open-endpoint",
            "description": "There's no restriction on this endpoint"});
});

app.get("/first-endpoint", function(req,res){
  res.send({"endpoint":"/first-endpoint",
            "description": "This is the first endpoint."});
});

app.get("/second-endpoint", function(req,res){
  res.send({"endpoint":"/second-endpoint",
            "description": "This is the second endpoint."});
});
