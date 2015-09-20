'use strict';
var dockerPath;
var pty = require('pty.js');
var which = require('which');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var found = false;

module.exports = {
  connect: connect,
  remove: remove
};

which('docker', function(err, cmdpath) {
  if (err) {
    console.log('err finding docker '+err);
    process.exit(1);
  }
  dockerPath = cmdpath;
  found = true;
  eventEmitter.emit('connected');
});

/**
 * Holds a list of terminals by uuid. This allows us to reconnect to existing
 * terminals in the case of a connection drop, or if we just want to keep the
 * bash terminals around so they can be reloaded at a later time.
 * @type Object
 */
var terminalSessions = {};

// pid of container to connect to *REQUIRED
// Args are argument for docker-enter.
// docker enter is a script which just needs docker containerId
function connect (nsArgs, streamOpts, cb) {
  // We cannot connect a terminal unless we know the exact container id
  if(!nsArgs.containerId) {
    return null;
  }

  // Optional session UUID to allow for reconnects to exisiting terminal
  // sessions.
  var uuid = nsArgs.sessionUUID;

  // Get the terminal for the connection request
  if (!found) {
    return eventEmitter.on('found', function() {
      getTerm();
    });
  }
  getTerm();

  function getTerm() {
    // Look for an exisiting terminal given a session uuid
    if (uuid && terminalSessions[uuid]) {
      return cb(null, terminalSessions[uuid]);
    }

    // Otherwise, spawn a new terminal
    spawnTerm();
  }

  function spawnTerm() {
    var cmd = dockerPath + ' exec -it ' + nsArgs.containerId + ' bash';
    var term = pty.spawn('bash', ['-c', cmd], streamOpts);

    // If we were provided a uuid, map the new terminal to that uuid
    if (uuid) {
      terminalSessions[uuid] = term;
      // Remove the terminal from the map on close
      term.on('close', function () {
        delete terminalSessions[uuid];
      });
    }

    return cb(null, term);
  }
};

/**
 * Removes and closes a terminal session with the given uuid.
 * @param {String} uuid Unique identifier for the terminal session.
 */
function remove (uuid) {
  var terminal = terminalSessions[uuid];
  if (!terminal) { return; }
  delete terminalSessions[uuid];
  terminal.kill();
}
