var pty = require('pty.js');

var init = function(cb) {
  console.log("bash init");
  cb(null, "bash");
};

var connect = function(pid, nsArgs, streamOpts) {
  var term = pty.spawn('bash', [], streamOpts);
  return term;
};

module.exports.connect = connect;
module.exports.init = init;
