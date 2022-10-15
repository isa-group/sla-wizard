var express = require("express");
var app = express();

var port = 9999;

app.listen(port, function(){
  console.log("Ready at " + port);
});

app.get("/open-endpoint", function(req,res){
  res.send({"endpoint": req.originalUrl, "description": "GET"});
});
app.post("/open-endpoint", function(req,res){
  res.send({"endpoint": req.originalUrl, "description": "POST"});
});

app.get("/pets", function(req,res){
  res.send({"endpoint": req.originalUrl, "description": "GET"});
});
app.post("/pets", function(req,res){
  res.send({"endpoint": req.originalUrl, "description": "POST"});
});

app.get("/pets/:id", function(req,res){
  res.send({"endpoint": req.originalUrl, "description": "GET with id " + req.params.id});
});
app.put("/pets/:id", function(req,res){
  res.send({"endpoint": req.originalUrl, "description": "PUT with id " + req.params.id});
});
app.delete("/pets/:id", function(req,res){
  res.send({"endpoint": req.originalUrl, "description": "DELETE with id " + req.params.id});
});