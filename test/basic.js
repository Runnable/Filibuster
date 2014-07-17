'use strict';
var config = require("../configs.js");
var Lab = require('lab');
var Primus = require('primus');
var Socket = Primus.createSocket({
  transformer: 'websockets',
  plugin: {
    'substream': require('substream')
  },
  parser: 'JSON'
});
var docker = require('./fixtures/docker.js');

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
  var server = {};
  Lab.test('no inputs', function (done) {
    try {
      server = require('../filibuster.js');
      server = server();
    } catch (err) {
      return new Error("failed to catch invalid middleware");
    }
    return done();
  });
  Lab.test('only express', function (done) {
    var express = require('express');
    var app = express();
    try {
      server = require('../filibuster.js');
      server = server({
        express: app
      });
    } catch (err) {
      return new Error("failed to catch invalid middleware");
    }
    return done();
  });
  Lab.test('only http', function (done) {
    var express = require('express');
    var app = express();
    var http = require('http');
    var httpServer = http.createServer(app);
    try {
      server = require('../filibuster.js');
      server = server({
        httpServer: httpServer
      });
    } catch (err) {
      return new Error("failed to catch invalid middleware");
    }
    return done();
  });
  Lab.test('only primus', function (done) {
    var express = require('express');
    var app = express();
    var http = require('http');
    var httpServer = http.createServer(app);
    var primus = new Primus(httpServer,{transformer: config.socketType,parser: 'JSON'});
    try {
      server = require('../filibuster.js');
      server = server({
        primus: primus
      });
    } catch (err) {
      return new Error("failed to catch invalid middleware");
    }
    return done();
  });
});

Lab.experiment('test middleware', function () {
  var server = {};
  Lab.test('invalid middleware', function (done) {
    try {
      server = require('../filibuster.js');
      var args = {
        middlewares: {
          fake: "fake"
        }
      };
      server = server(args);
    } catch (err) {
      return done();
    }
    return new Error("failed to catch invalid middleware");
  });
  Lab.test('valid middleware', function (done) {
    try {
      server = require('../filibuster.js');
      var args = {
        middlewares: {
          test: function(req,res, next) {
            next("test");
          }
        }
      };
      server = server(args);
      server.listen(config.port);
    } catch (err) {
      return new Error("failed to catch invalid middleware");
    }
    var primus = new Socket('http://localhost:3111?type=filibuster' +
      '&args={"containerId": "b9fd4051eb2e"}');
    primus.on('error', function () {
      server.close(done);
    });
  });
});

Lab.experiment('test connectivity', function () {
  var dockerServer = null;
  Lab.before(function(done) {
    dockerServer = docker.listen(config.dockerPort, done);
  });
  Lab.after(function(done) {
    dockerServer.close(done);
  });
  var server = {};
  Lab.beforeEach(function(done){
    try {
      server = require('../filibuster.js');
      server = server();
      server.listen(config.port, done);
    } catch (err) {
      return done(err);
    }
  });

  Lab.afterEach(function(done){
    server.close(done);
  });

  Lab.experiment('session', function () {
    var primus;
    var pass = false;
    Lab.beforeEach(function (done) {
      pass = false;
      primus = new Socket('http://localhost:3111?' +
        'type=filibuster&args={"containerId": "b9fd4051eb2e"}');
      done();
    });
    var check = function(errMsg, done) {
      primus.on('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error(errMsg));
      });
    };
    Lab.test('connect', function (done) {
      primus.on('data', function (data) {
        if(data.name === 'terminal'){
          pass = true;
          return primus.end();
        }
      });
      check('failed to connect', done);
    });
    Lab.test('send term command', function (done) {
      var term = primus.substream('terminal');
      var buffer = '';
      term.on('data', function (data) {
        buffer += data;
        if(~buffer.indexOf('TEST')) {
          pass = true;
          return primus.end();
        }
        term.write('echo TEST\n');
      });
      check('echo failed to run', done);
    });
    Lab.test('send clientEventsStream bogus event not object', function (done) {
      var cs = primus.substream('clientEvents');
      cs.on('data', function (data) {
        if(data.event === 'error' && data.data === "invalid input"){
          pass = true;
          return primus.end();
        }
        cs.write('bogus');
      });
      check('echo failed to ping', done);
    });
    Lab.test('send clientEventsStream ping event', function (done) {
      var cs = primus.substream('clientEvents');
      cs.on('data', function (data) {
        if(data.event === 'pong') {
          pass = true;
          return primus.end();
        }
        cs.write({
          event: "ping"
        });
      });
      check('echo failed to ping', done);
    });
    Lab.test('send clientEventsStream bogus resize event with no data', function (done) {
      var cs = primus.substream('clientEvents');
      cs.on('data', function (data) {
        if(data.event === 'error' && data.data === "invalid x and y data"){
          pass = true;
          return primus.end();
        }
        cs.write({
          event: "resize"
        });
      });
      check('echo failed to ping', done);
    });
    Lab.test('send clientEventsStream bogus resize event with null data', function (done) {
      var cs = primus.substream('clientEvents');
      cs.on('data', function (data) {
        if(data.event === 'error' && data.data === "invalid x and y data"){
          pass = true;
          return primus.end();
        }
        cs.write({
          event: "resize",
          data: []
        });
      });
      check('echo failed to ping', done);
    });
    Lab.test('send clientEventsStream bogus resize event with only x data', function (done) {
      var cs = primus.substream('clientEvents');
      cs.on('data', function (data) {
        if(data.event === 'error' && data.data === "invalid x and y data"){
          pass = true;
          return primus.end();
        }
        cs.write({
          event: "resize",
          data: {
            x: 0
          }
        });
      });
      check('echo failed to ping', done);
    });
    Lab.test('send clientEventsStream correct resize event', function (done) {
      var cs = primus.substream('clientEvents');
      var term = primus.substream('terminal');
      check('echo failed to ping', done);
      cs.on('data', function () {
        cs.write({
          event: "resize",
          data: {
            x: 222,
            y: 123
          }
        });
        term.write('tput cols\n');
        term.on('data', function (data) {
          if(~data.indexOf('222')){
            pass = true;
            term.write('tput lines\n');
          }
          if(~data.indexOf('123') && pass){
            return primus.end();
          }
        });
      });
    });
    Lab.test('send clientEventsStream bogus event', function (done) {
      var cs = primus.substream('clientEvents');
      cs.on('data', function (data) {
        if(data.event === 'error' && data.data === "event not supported"){
          pass = true;
          return primus.end();
        }
        cs.write({
          event: "bogus"
        });
      });
      check('echo failed to ping', done);
    });
    Lab.test('send exit command to terminal', function (done) {
      var term = primus.substream('terminal');
      term.on('data', function () {
        pass = true;
        term.write('exit\n');
      });
      check('error closing term', done);
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
      primus.on('end', function () {
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
      var term = primus.substream('terminal');
      term.on('data', function (data) {
        if(~data.indexOf('123')){
          pass = true;
          term.write('tput cols\n');
        }
        if(~data.indexOf('222') && pass){
          return primus.end();
        }
        term.write('tput lines\n');
      });
      primus.on('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error("failed to pass opts"));
      });
    });
    Lab.test('set cwd to /', function (done) {
      var pass = false;
      var primus = new Socket('http://localhost:3111?type=filibuster&opts={"cwd":"/"}' +
        '&args={"containerId": "b9fd4051eb2e"}');
      var term = primus.substream('terminal');
      var buffer = '';
      term.on('data', function (data) {
        buffer += data;
        if(~buffer.indexOf('/')) {
          pass = true;
          return primus.end();
        }
        term.write('pwd\n');
      });
      primus.on('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error("failed to pass opts"));
      });
    });
    Lab.test('term', function (done) {
      var pass = false;
      var primus = new Socket('http://localhost:3111?type=filibuster&opts={"name":"vt100"}' +
        '&args={"containerId": "b9fd4051eb2e"}');
      var term = primus.substream('terminal');
      var buffer = '';
      term.on('data', function (data) {
        buffer += data;
        if(~buffer.indexOf('vt100')) {
          pass = true;
          return primus.end();
        }
        term.write('echo $TERM\n');
      });
      primus.on('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error("failed to pass opts"));
      });
    });
    Lab.test('env', function (done) {
      var pass = false;
      var primus = new Socket('http://localhost:3111?' +
        'type=filibuster&opts={"env":{"TEST":"thisIsEnv"}}' +
        '&args={"containerId": "b9fd4051eb2e"}');
      var term = primus.substream('terminal');
      var buffer = '';
      term.on('data', function (data) {
        buffer += data;
        if(~buffer.indexOf('thisIsEnv')) {
          pass = true;
          return primus.end();
        }
        term.write('echo $TEST\n');
      });
      primus.on('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error("failed to pass opts"));
      });
    });
    Lab.test('no filibuster filter', function (done) {
      var pass = true;
      var primus = new Socket('http://localhost:3111?type=other');
      primus.on('data', function () {
        pass = false;
      });
      primus.on('end', function () {
        if (pass) {
          return done();
        }
        return done(new Error("failed disconnet"));
      });
    });
  });
});