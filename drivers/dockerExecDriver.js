/**
 * @module drivers/dockerExecDriver
 */
'use strict';

var events = require('events');
var pty = require('pty.js');
var which = require('which');

var log = require('../lib/logger').getChild(__filename);

var dockerPath;
var eventEmitter = new events.EventEmitter();
var found = false;

which('docker', function(err, cmdpath) {
  if (err) {
    log.fatal({
      err: err
    }, 'err finding docker');
    process.exit(1);
  }
  dockerPath = cmdpath;
  found = true;
  eventEmitter.emit('connected');
});

// pid of container to connect to *REQUIRED
// Args are argument for docker-enter.
// docker enter is a script which just needs docker containerId
var connect = function(nsArgs, streamOpts, cb) {
  if(!nsArgs.containerId) {
    return null;
  }
  if (!found) {
    return eventEmitter.on('found', function() {
      spawnTerm();
    });
  }

  spawnTerm();

  function spawnTerm() {
    var cmd = dockerPath + ' exec -it ' + nsArgs.containerId + ' bash';
    var term = pty.spawn('bash', ['-c', cmd], streamOpts);
    cb(null, term);
  }
};

module.exports.connect = connect;
