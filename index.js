// 'use strict';

var config = require("./configs.js");
var nsenter;
if (config.nsType === "nsenter") {
  nsenter = require('./nsenterDriver.js');
} else if (config.nsType === 'test') {
  nsenter = require('./testDriver.js');
}
var Primus = require('primus');
var http = require('http');
var server = http.createServer();
var primus = new Primus(server, { transformer: config.socketType, parser: 'JSON' });

nsenter.init(function(err,cmdpath) {
  if (err) {
    console.log('err with nsenter: '+err);
    process.exit();
  }
  console.log("nsenter found and ready: "+cmdpath);
});

// add multiplex to Primus
primus.use('substream', require('substream'));

primus.on('connection', function (socket) {
  console.log("attaching too: "+socket.query.pid);
  var terminal = nsenter.connect(socket.query.pid, "--mount --uts --ipc --net --pid", {
      name: 'xterm-color',
      cols: 80,
      rows: 30
    });
  // used for resize and ping events
  var clientEventsStream = socket.substream('clientEvents');
  // used for terminal
  var terminalStream = socket.substream('terminal');

  // connect terminalStream to container stream in
  terminalStream.pipe(terminal.stdin);
  // connect container out to terminalStream
  terminal.stdout.pipe(terminalStream);

  /*
    This stream only accepts objects formated like so:
    {
      event: "EVENT_NAME", // must be string
      data: data // can be anything
    }
  */
  clientEventsStream.on('data', function(message) {
    if(typeof message !== 'object' || typeof message.event !== 'string') {
      return console.log('invalid input:', message);
    }
    if(message.event === 'resize') {
      if(message.data && message.data.x && message.data.y) {
        return terminal.resize(message.data.x, message.data.y);
      }
      return console.log("missing x and y data", message);
    } else if (message.event === 'ping') {
      return clientEventsStream.write({
        event: "pong"
      });
    }
    return console.log("event not supported: ", message.event);
  });
});

server.listen(config.port);
module.exports = server;