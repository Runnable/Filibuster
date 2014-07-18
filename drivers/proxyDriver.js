'use strict';
var config = require("./configs.js");
var Primus = require('primus');
var Socket = Primus.createSocket({
  transformer: config.primus.transformer,
  parser: 'JSON'
});
// proxy stream to destination
var connect = function(args, streamOpts, cb) {
  var primus = new Socket('http://'+args.ipaddress+':'+args.port+"?type="+args.type);
  cb(null, primus);
};

module.exports.connect = connect;
