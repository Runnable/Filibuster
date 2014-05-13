// listen on port
// query pass in pid
// output a stream

var nsenter = require('./nsenterDriver.js');
nsenter.init(function(err,cmdpath) {
  if (err) {
    console.log('err with nsenter: '+err);
    process.exit();
  }
  console.log("nsenter found and ready: "+cmdpath);
});
var express = require('express');
var app = express();

app.get('/attach', function(req, res, next) {
  if(!(req.query && req.query.pid)) {
    return res.send(400);
  }
  var stream = nsenter.connect(req.query, "--mount --uts --ipc --net --pid", null);

});

module.exports = app;