var pty = require('pty.js');

// ssh into container
var connect = function(args, streamOpts, cb) {
  var cmd = [args.username+"@"+args.host, "-p", args.port];
  var term = pty.spawn('ssh', cmd, streamOpts);
  cb(null, term);
};

module.exports.connect = connect;
