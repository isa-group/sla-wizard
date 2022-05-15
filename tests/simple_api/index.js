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

app.get("/once-per-second-endpoint", function(req,res){
  res.send({"endpoint":"/once-per-second-endpoint",
            "description": "This endpoint accepts requests only once per second"});
});

app.get("/twice-per-minute-endpoint", function(req,res){
  res.send({"endpoint":"/twice-per-minute-endpoint",
            "description": "This endpoint accepts requests only twice per minute"});
});
