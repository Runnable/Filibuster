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

Lab.experiment('init', function () {
  var testServer;
  Lab.test("start server", function(done){
    try {
      testServer = require('../index.js');
    } catch (err) {
      return done(err);
    }
    return done();
  });
});

var server;
Lab.beforeEach(function(done){
  try {
    server = require('../filibuster.js');
    server.listen(config.port, done);
  } catch (err) {
    return done(err);
  }
});

Lab.afterEach(function(done){
  server.close(function() {
    done();
  });
});

Lab.experiment('invalid connections', function () {
  Lab.test('connect with no pid', function (done) {
    var primus = new Socket('http://localhost:3111');
    primus.on('data', function (data) {
      if(~data.indexOf('error')){
        return done();
      }
      return done(new Error('connection was real'));
    });
  });
  Lab.test('connect with no pid', function (done) {
    var primus = new Socket('http://localhost:3111?d=[]');
    primus.on('data', function (data) {
      if(~data.indexOf('error')){
        return done();
      }
      return done(new Error('connection was real'));
    });
  });
  Lab.test('connect with no pid value', function (done) {
    var primus = new Socket('http://localhost:3111?pid');
    primus.on('data', function (data) {
      if(~data.indexOf('error')){
        return done();
      }
      return done(new Error('connection was real'));
    });
  });
  Lab.test('connect with invalid args', function (done) {
    var primus = new Socket('http://localhost:3111?pid=anand');
    primus.on('data', function (data) {
      if(~data.indexOf('error')){
        return done();
      }
      return done(new Error('connection was real'));
    });
  });
});

Lab.experiment('session', function () {
  var primus;
  var pass = false;
  Lab.beforeEach(function (done) {
    pass = false;
    primus = new Socket('http://localhost:3111?pid=1234');
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
    term.on('data', function (data) {
      if(~data.indexOf('TEST')) {
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
    cs.on('data', function (data) {
      cs.write({
        event: "resize",
        data: {
          x: 222,
          y: 123
        }
      });
      term.write('tput cols\n');
      term.on('data', function function_name (data) {
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
    term.on('data', function (data) {
      pass = true;
      term.write('exit\n');
    });
    check('error closing term', done);
  });
});


Lab.experiment('session with opts', function () {
  Lab.test('send params in url', function (done) {
    var pass = false;
    var primus = new Socket('http://localhost:3111?pid=1234&name=xterm-color&cols=222&rows=123&cwd=/&env={"TEST":"env"}');
    var term = primus.substream('terminal');
    term.on('data', function function_name (data) {
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
      return done(new Error(errMsg));
    });
  });
});
