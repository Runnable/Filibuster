var init = function(cb) {
  console.log("bash init");
  cb(null, "bash");
};

// pid of container to connect to *REQUIRED
// Args are argument for nsenter. defaults to all
// Opts are option for pty default empty
// returns stream to STDIN of container
// return null if invalid argument
var connect = function(pid, nsArgs, streamOpts) {
  var spawn = require('child_process').spawn;
  var bash    = spawn('bash');

  bash.stdin.write("ls");

  bash.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });

  bash.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  bash.on('close', function (code) {
    console.log('child process exited with code ' + code);
  });
  return bash;
};

module.exports.connect = connect;
module.exports.init = init;
