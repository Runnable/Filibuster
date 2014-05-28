//'use strict';
var config = require("./configs.js");
var Primus = require('primus');
var http = require('http');
var server = http.createServer();
var primus = new Primus(server, { transformer: config.socketType, parser: 'JSON' });

var nsenter;
if (config.nsType === "nsenter") {
  nsenter = require('./nsenterDriver.js');
} else if (config.nsType === 'test') {
  nsenter = require('./testDriver.js');
  // comment out for debuging
  console.log = function(){return;};
}

// add multiplex to Primus
primus.use('substream', require('substream'));

// handle connection
primus.on('connection', function (socket) {
  if (typeof socket.query.pid !== 'string'||
    !parseInt(socket.query.pid)) {
    socket.write("error: invalid args");
    return socket.end();
  }
  console.log("attaching too: "+socket.query.pid);

  var terminal = nsenter.connect(socket.query.pid,
    "--mount --uts --ipc --net --pid",
    getPtyOptions(socket.query),
    function(err, terminal) {
      if(err) {
        console.error("nsenter returned err:", err);
        return socket.end();
      }
      // used for resize and ping events
      setupClientStream(socket.substream('clientEvents'), terminal);

      // used for terminal
      setupTerminalStream(socket.substream('terminal'), terminal);

      // cleanup terminal
      socket.on('end', function(data) {
        terminal.destroy();
      });

      // terminal closed, end connection
      terminal.on('end', function(data) {
        terminal.destroy();
        socket.end();
      });
    });
});

function getPtyOptions(opts) {
  var ptyOptions = {
    name: opts.name || 'xterm-color',
    cols: parseInt(opts.cols) || 80,
    rows: parseInt(opts.rows) || 30,
  };

  if(opts.cwd) {
    ptyOptions.cwd = opts.cwd;
  }

  if(opts.env) {
    ptyOptions.env = JSON.parse(opts.env);
  }
  return ptyOptions;
}

function setupTerminalStream(terminalStream, terminal) {
  // pipe stream to terminal, and terminal out to stream
  terminalStream.on('data', function(data) {
    terminal.write(data);
  });

  terminal.on('data', function(data) {
    terminalStream.write(data);
  });
  return terminalStream;
}

function setupClientStream(clientEventsStream, terminal)  {
  /*
    This stream only accepts objects formated like so:
    {
      event: "EVENT_NAME", // must be string
      data: data // can be anything
    }
  */
  clientEventsStream.on('data', function(message) {
    if(typeof message !== 'object' || typeof message.event !== 'string') {
      clientEventsStream.write({
        event: "error",
        data: "invalid input"
      });
      return console.log('invalid input:', message);
    }
    if(message.event === 'resize') {
      if(typeof message.data !== 'object' ||
        typeof message.data.x !== 'number' ||
        typeof message.data.y !== 'number') {
        clientEventsStream.write({
          event: "error",
          data: "invalid x and y data"
        });
        return console.log("invalid x and y data", message);
      }
      return terminal.resize(message.data.x, message.data.y);
    } else if (message.event === 'ping') {
      return clientEventsStream.write({
        event: "pong"
      });
    }
    clientEventsStream.write({
      event: "error",
      data: "event not supported"
    });
    return console.log("event not supported: ", message.event);
  });
  clientEventsStream.write({
    event: "connected"
  });
  return clientEventsStream;
}

module.exports = server;