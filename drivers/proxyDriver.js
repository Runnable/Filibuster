'use strict';
require('../lib/loadenv.js')();
var Primus = require('primus');
var Socket = Primus.createSocket({
  transformer: process.env.SOCKET_TYPE,
  parser: 'JSON'
});
// proxy stream to destination
var connect = function(args, streamOpts, cb) {
  var primus = new Socket('http://'+args.ipaddress+':'+args.port+"?type="+args.type);
  cb(null, primus);
};

module.exports.connect = connect;
