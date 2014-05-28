var pty = require('pty.js');
var which = require('which');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var found = false;

which('bash', function(err, cmdpath) {
  if (err) {
    console.log('err with bash: '+err);
    process.exit(1);
  }
  found = true;
  eventEmitter.emit('found');
});

var connect = function(pid, nsArgs, streamOpts, cb) {
  if(!pid) {
    return null;
  }
  if (!found) {
    return eventEmitter.on('found', function() {
      spawnTerm();
    });
  }

  spawnTerm();

  function spawnTerm() {
    var term = pty.spawn('bash', [], streamOpts);
    cb(null, term);
  }
};

module.exports.connect = connect;
