var pty = require('pty.js');

var connect = function(nsArgs, streamOpts, cb) {
  var term = pty.spawn('bash', [], streamOpts);
  cb(null, term);
};

module.exports.connect = connect;
