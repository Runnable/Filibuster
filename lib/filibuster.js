'use strict';
require('./loadenv.js')();
var term = require('../drivers/'+process.env.NSTYPE+'.js');
var Primus = require('primus');
var express = require('express');
var http = require('http');

function Filibuster (services) {
  services = sanitizeInput(services);

  // add multiplex to Primus
  services.primus.use('substream', require('substream'));

  // handle connection
  services.primus.on('connection', function (socket) {
    if (socket.query.type !== 'filibuster') {
      return socket.end();
    }
    term.connect(
      getArgs(socket.query),
      getPtyOptions(socket.query),
      function(err, terminal) {
      if(err) {
        console.error("term returned err:", err);
        return socket.end();
      }
      connectStreams(socket, terminal);
    });
  });

  return services.httpServer;
}

function sanitizeInput (services) {
  // normilize inputs
  if (!services) {
    services = {};
  }
  // select what to add
  if (typeof services.express !== 'function') {
    services.express = express();
  }
  if (typeof services.httpServer !== 'object') {
    services.httpServer = http.createServer(services.express);
  }
  if (typeof services.primus !== 'object') {
    services.primus = new Primus(
      services.httpServer,
      {
        transformer: process.env.SOCKET_TYPE,
        parser: 'JSON'
      });
  }

  return services;
}
function connectStreams (socket, terminal) {
  // used for resize and ping events
  setupClientStream(socket.substream('clientEvents'), terminal);

  // used for terminal
  setupTerminalStream(socket.substream('terminal'), terminal);

  // cleanup terminal
  socket.on('end', function() {
    terminal.destroy();
  });

  // terminal closed, end connection
  terminal.on('close', function() {
    terminal.destroy();
    socket.end();
  });
}

function getArgs(query) {
  var args = {};

  if (typeof query.args === 'string') {
    args = JSON.parse(query.args);
  }

  return args;
}

function getPtyOptions(query) {
  var opts = {};
  if (typeof query.opts === 'string') {
    opts = JSON.parse(query.opts);
  }

  var ptyOptions = {
    name: opts.name || 'xterm-color',
    cols: parseInt(opts.cols) || 80,
    rows: parseInt(opts.rows) || 30,
  };

  if(opts.cwd) {
    ptyOptions.cwd = opts.cwd;
  }

  if(typeof opts.env === 'object') {
    ptyOptions.env = opts.env;
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
module.exports = Filibuster;