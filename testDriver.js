'use strict';
var pty = require('pty.js');

var connect = function(args, streamOpts, cb) {
  if (args.error) {
    return cb(new Error("test_error"));
  }
  if (!args.pid) {
    return cb(new Error('failed to get pid'));
  }
  var term = pty.spawn('bash', [], streamOpts);
  cb(null, term);
};

module.exports.connect = connect;
