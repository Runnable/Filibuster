var nsenterPath;
var pty = require('pty.js');
var which = require('which');
var event = require('events').EventEmitter;
var found = false;

which('nsenter', function(err, cmdpath) {
  if (err) {
    console.log('err with nsenter: '+err);
    process.exit(1);
  }
  nsenterPath = cmdpath;
  found = true;
  event.emit('connected');
});

// pid of container to connect to *REQUIRED
// Args are argument for nsenter. defaults to all
// Opts are option for pty default empty
// returns stream to STDIN of container
// return null if invalid argument
var connect = function(nsArgs, streamOpts, cb) {
  if(!nsArgs.pid) {
    return null;
  }
  if (!found) {
    return event.on('found', function() {
      spawnTerm();
    });
  }

  spawnTerm();

  function spawnTerm() {
    var args = nsArgs.cmd || "--mount --uts --ipc --net --pid";
    var cmd = "sudo " + nsenterPath + " --target " + nsArgs.pid + " " + args;
    var term = pty.spawn('bash', ["-c", cmd], streamOpts);
    cb(null, term);
  }
};

module.exports.connect = connect;
