'use strict';
require('../lib/loadenv.js')();
var Lab = require('lab');
var Primus = require('primus');
var filibusterServer = require('../lib/filibuster.js');
var Socket = Primus.createSocket({
  transformer: 'websockets',
  plugin: {
    'substream': require('substream')
  },
  parser: 'JSON'
});

Lab.experiment('init', function () {
  var testServer;
  Lab.test("start server", function(done){
    try {
      testServer = require('../index.js');
    } catch (err) {
      return done(err);
    }
    testServer.close(done);
  });
});

Lab.experiment('test app inputs', function () {
  var server;
  Lab.test('only express', function (done) {
    var express = require('express');
    var app = express();
    server = filibusterServer({
      express: app
    });
    done();
  });
  Lab.test('only http', function (done) {
    var express = require('express');
    var app = express();
    var http = require('http');
    var httpServer = http.createServer(app);
    server = filibusterServer({
      httpServer: httpServer
    });
    done();
  });
  Lab.test('only primus', function (done) {
    var express = require('express');
    var app = express();
    var http = require('http');
    var httpServer = http.createServer(app);
    var primus = new Primus(httpServer, {
      transformer: process.env.SOCKET_TYPE,
      parser: 'JSON'
    });
    server = filibusterServer({
      primus: primus
    });
    done();
  });
});

Lab.experiment('test connectivity', function () {
  var server;
  Lab.beforeEach(function(done){
    server = filibusterServer();
    server.listen(process.env.PORT, done);
  });

  Lab.afterEach(function(done){
    server.close(done);
  });

  Lab.experiment('session', function () {
    var primus;
    var pass;
    Lab.beforeEach(function (done) {
      pass = false;
      primus = new Socket('http://localhost:3111?' +
        'type=filibuster&args={"containerId": "b9fd4051eb2e"}');
      primus.once('open', done);
    });
    var check = function(errMsg, done) {
      primus.once('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error(errMsg));
      });
    };
    Lab.test('send term command', function (done) {
      check('echo failed to run', done);
      var term = primus.substream('terminal');
      var buffer = '';
      term.on('data', function (data) {
        buffer += data;
        if(~buffer.indexOf('TEST')) {
          pass = true;
          return primus.end();
        }
      });
      term.write('echo TEST\n');
    });
    Lab.test('send clientEventsStream bogus event not object', function (done) {
      check('echo failed to ping', done);
      var cs = primus.substream('clientEvents');
      cs.on('data', function (data) {
        if(data.event === 'error' && data.data === "invalid input"){
          pass = true;
          return primus.end();
        }
      });
      cs.write('bogus');
    });
    Lab.test('send clientEventsStream ping event', function (done) {
      check('echo failed to ping', done);
      var cs = primus.substream('clientEvents');
      cs.on('data', function (data) {
        if(data.event === 'pong') {
          pass = true;
          return primus.end();
        }
      });
      cs.write({
        event: "ping"
      });
    });
    Lab.test('send clientEventsStream bogus resize event with no data', function (done) {
      check('echo failed to ping', done);
      var cs = primus.substream('clientEvents');
      cs.on('data', function (data) {
        if(data.event === 'error' && data.data === "invalid x and y data"){
          pass = true;
          return primus.end();
        }
      });
      cs.write({
        event: "resize"
      });
    });
    Lab.test('send clientEventsStream bogus resize event with null data', function (done) {
      check('echo failed to ping', done);
      var cs = primus.substream('clientEvents');
      cs.on('data', function (data) {
        if(data.event === 'error' && data.data === "invalid x and y data"){
          pass = true;
          return primus.end();
        }
      });
      cs.write({
        event: "resize",
        data: []
      });
    });
    Lab.test('send clientEventsStream bogus resize event with only x data', function (done) {
      check('echo failed to ping', done);
      var cs = primus.substream('clientEvents');
      cs.on('data', function (data) {
        if(data.event === 'error' && data.data === "invalid x and y data"){
          pass = true;
          return primus.end();
        }
      });
      cs.write({
        event: "resize",
        data: {
          x: 0
        }
      });
    });
    Lab.test('send clientEventsStream correct resize event', function (done) {
      var cs = primus.substream('clientEvents');
      var term = primus.substream('terminal');
      check('echo failed to ping', done);
      term.on('data', function (data) {
        if(~data.indexOf('222')){
          pass = true;
          term.write('tput lines\n');
        }
        if(~data.indexOf('123') && pass){
          return primus.end();
        }
      });
      cs.on('data', function () {
        term.write('tput cols\n');
      });
      cs.write({
        event: "resize",
        data: {
          x: 222,
          y: 123
        }
      });
      cs.write({
        event: "ping"
      });
    });
    Lab.test('send clientEventsStream bogus event', function (done) {
      check('echo failed to ping', done);
      var cs = primus.substream('clientEvents');
      cs.on('data', function (data) {
        if(data.event === 'error' && data.data === "event not supported"){
          pass = true;
          return primus.end();
        }
      });
      cs.write({
        event: "bogus"
      });
    });
    Lab.test('send exit command to terminal', function (done) {
      check('error closing term', done);
      var term = primus.substream('terminal');
      pass = true;
      term.write('exit\n');
    });
  });

  Lab.experiment('session with opts', function () {
    Lab.test('terminal start error', function (done) {
      var pass = true;
      var primus = new Socket('http://localhost:3111?type=filibuster' +
        '&args={"error":"222", "containerId": "b9fd4051eb2e"}');
      var term = primus.substream('terminal');
      term.on('data', function () {
        pass = false;
      });
      primus.once('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error("failed close on terminal error"));
      });
    });
    Lab.test('cols and row', function (done) {
      var pass = false;
      var primus = new Socket('http://localhost:3111?'+
        'type=filibuster&opts={"cols":"222","rows":"123"}'+
        '&args={"containerId": "b9fd4051eb2e"}');
      primus.once('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error("failed to pass opts"));
      });
      primus.once('open', function() {
        term.write('tput lines\n');
      });
      var term = primus.substream('terminal');
      term.on('data', function (data) {
        if(~data.indexOf('123')){
          pass = true;
          term.write('tput cols\n');
        }
        if(~data.indexOf('222') && pass){
          return primus.end();
        }
      });
    });
    Lab.test('set cwd to /', function (done) {
      var pass = false;
      var primus = new Socket('http://localhost:3111?type=filibuster&opts={"cwd":"/"}' +
        '&args={"containerId": "b9fd4051eb2e"}');
      primus.once('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error("failed to pass opts"));
      });
      primus.once('open', function() {
        term.write('pwd\n');
      });
      var term = primus.substream('terminal');
      var buffer = '';
      term.on('data', function (data) {
        buffer += data;
        if(~buffer.indexOf('/')) {
          pass = true;
          return primus.end();
        }
      });
    });
    Lab.test('term', function (done) {
      var pass = false;
      var primus = new Socket('http://localhost:3111?type=filibuster&opts={"name":"vt100"}' +
        '&args={"containerId": "b9fd4051eb2e"}');
      primus.once('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error("failed to pass opts"));
      });
      primus.once('open', function() {
        term.write('echo $TERM\n');
      });
      var term = primus.substream('terminal');
      var buffer = '';
      term.on('data', function (data) {
        buffer += data;
        if(~buffer.indexOf('vt100')) {
          pass = true;
          return primus.end();
        }
      });
    });
    Lab.test('env', function (done) {
      var pass = false;
      var primus = new Socket('http://localhost:3111?' +
        'type=filibuster&opts={"env":{"TEST":"thisIsEnv"}}' +
        '&args={"containerId": "b9fd4051eb2e"}');
      primus.once('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error("failed to pass opts"));
      });
      primus.once('open', function() {
        term.write('echo $TEST\n');
      });
      var term = primus.substream('terminal');
      var buffer = '';
      term.on('data', function (data) {
        buffer += data;
        if(~buffer.indexOf('thisIsEnv')) {
          pass = true;
          return primus.end();
        }
      });
    });
    Lab.test('no filibuster filter', function (done) {
      var pass = true;
      var primus = new Socket('http://localhost:3111?type=other');
      primus.on('data', function () {
        pass = false;
      });
      primus.once('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error("failed disconnet"));
      });
    });
    Lab.test('should error if no containerId passed', function (done) {
      var pass = true;
      var primus = new Socket('http://localhost:3111?type=filibuster');
      primus.on('data', function () {
        pass = false;
      });
      primus.once('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error("failed to return error for no containerId"));
      });
    });
  });
});