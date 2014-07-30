require('./lib/loadenv.js')();
var filibuster = require("./lib/filibuster.js");
var express = require('express');
var app = express();
var server = module.exports = filibuster(app);

server.listen(process.env.PORT);