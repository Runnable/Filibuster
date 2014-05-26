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
}

nsenter.init(function(err,cmdpath) {
  if (err) {
    console.log('err with nsenter: '+err);
    process.exit(1);
  }
  console.log("nsenter found and ready: "+cmdpath);
});

// add multiplex to Primus
primus.use('substream', require('substream'));

// handle connection
primus.on('connection', function (socket) {
  console.log(typeof socket.query);
  if (typeof socket.query.pid !== 'string'||
    !parseInt(socket.query.pid)) {
    socket.write("error: invalid args");
    return socket.end();
  }
  console.log("attaching too: "+socket.query.pid);

  var ptyOptions = {
    name: socket.query.name || 'xterm-color',
    cols: parseInt(socket.query.cols) || 80,
    rows: parseInt(socket.query.rows) || 30,
  };

  if(socket.query.cwd) {
    ptyOptions.cwd = socket.query.cwd;
  }

  if(socket.query.env) {
    ptyOptions.env = JSON.parse(socket.query.env);
  }

  var terminal = nsenter.connect(socket.query.pid, "--mount --uts --ipc --net --pid", ptyOptions);
  // used for resize and ping events
  var clientEventsStream = socket.substream('clientEvents');
  // used for terminal
  var terminalStream = socket.substream('terminal');

  // pipe stream to terminal, and terminal out to stream
  terminalStream.pipe(terminal);

  terminal.on('data', function(data) {
    terminalStream.write(data);
  });

  /*
    This stream only accepts objects formated like so:
    {
      event: "EVENT_NAME", // must be string
      data: data // can be anything
    }
  */
  clientEventsStream.on('data', function(message) {
    if(typeof message !== 'object' || typeof message.event !== 'string') {
      clientEventsStream.write("error: invalid input");
      return console.log('invalid input:', message);
    }
    if(message.event === 'resize') {
      if(typeof message.data !== 'object' ||
        typeof message.data.x !== 'number' ||
        typeof message.data.y !== 'number') {
        clientEventsStream.write("error: invalid x and y data");
        return console.log("invalid x and y data", message);
      }
      return terminal.resize(message.data.x, message.data.y);
    } else if (message.event === 'ping') {
      return clientEventsStream.write({
        event: "pong"
      });
    }
    clientEventsStream.write("error: event not supported");
    return console.log("event not supported: ", message.event);
  });

  socket.on('end', function(data) {
    console.log("main end: ", data);
  });
  clientEventsStream.on('end', function(data) {
    console.log("clientEventsStream end: ", data);
  });
  // terminal closed, end connection
  terminal.on('end', function(data) {
    terminal.destroy();
    socket.end();
    console.log("terminal end: ", data);
  });
});

module.exports = server;