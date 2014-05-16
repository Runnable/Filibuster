var nsenterPath = "/usr/local/bin/nsenter";
var pty = require('pty.js');
var which = require('which');

var init = function(cb) {
  which('nsenter', function(err, cmdpath) {
    if (err) {
      return cb(new Error('nsenter not avalible. module useless'));
    }
    nsenterPath = cmdpath;
    return cb(null, cmdpath);
  });
};

// pid of container to connect to *REQUIRED
// Args are argument for nsenter. defaults to all
// Opts are option for pty default empty
// returns stream to STDIN of container
// return null if invalid argument
var connect = function(pid, nsArgs, streamOpts) {
  if(!pid) {
    return null;
  }
  var args = nsArgs || "--mount --uts --ipc --net --pid";
  var cmd = "sudo " + nsenterPath + " --target " + pid + " " + args;
  var term = pty.spawn('bash', ["-c", cmd], streamOpts);

  return term;
};

module.exports.connect = connect;
module.exports.init = init;
