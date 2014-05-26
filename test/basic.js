var Lab = require('lab');
var Primus = require('primus');
var Socket = Primus.createSocket({
  transformer: 'websockets',
  plugin: {
    'substream': require('substream')
  },
  parser: 'JSON'
});
var proxyquire =  require('proxyquire').noPreserveCache();

var server;
Lab.experiment('init', function () {
  Lab.test("start server", function(done){
    try {
      server = require('../index.js');
    } catch (err) {
      return done(err);
    }
    return done();
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
        primus.end();
      }
    });
    check('failed to connect', done);
  });
  Lab.test('send term command', function (done) {
    var term = primus.substream('terminal');
    term.on('data', function (data) {
      if(~data.indexOf('TEST')) {
        pass = true;
        primus.end();
      }
    });
    check('echo failed to run', done);
    term.write('echo TEST\n');
  });
  Lab.test('send clientEventsStream bogus event not object', function (done) {
    var cs = primus.substream('clientEvents');
    cs.on('data', function (data) {
      if(~data.indexOf('error')){
        pass = true;
        primus.end();
      }
    });
    check('echo failed to ping', done);
    cs.write('bogus');
  });
  Lab.test('send clientEventsStream ping event', function (done) {
    var cs = primus.substream('clientEvents');
    cs.on('data', function (data) {
      if(data.event === 'pong') {
        pass = true;
        primus.end();
      }
    });
    check('echo failed to ping', done);
    cs.write({
      event: "ping"
    });
  });
  Lab.test('send clientEventsStream bogus resize event with no data', function (done) {
    var cs = primus.substream('clientEvents');
    cs.on('data', function (data) {
      if(~data.indexOf('error')){
        pass = true;
        primus.end();
      }
    });
    check('echo failed to ping', done);
    cs.write({
      event: "resize"
    });
  });
  Lab.test('send clientEventsStream bogus resize event with null data', function (done) {
    var cs = primus.substream('clientEvents');
    cs.on('data', function (data) {
      if(~data.indexOf('error')){
        pass = true;
        primus.end();
      }
    });
    check('echo failed to ping', done);
    cs.write({
      event: "resize",
      data: []
    });
  });
  Lab.test('send clientEventsStream bogus resize event with only x data', function (done) {
    var cs = primus.substream('clientEvents');
    cs.on('data', function (data) {
      if(~data.indexOf('error')){
        pass = true;
        primus.end();
      }
    });
    check('echo failed to ping', done);
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
    cs.write({
      event: "resize",
      data: {
        x: 222,
        y: 123
      }
    });
    term.write('tput lines\n');
    term.on('data', function function_name (data) {
      if(~data.indexOf('123')){
        pass = true;
        term.write('tput lines\n');
      }
      if(~data.indexOf('123') && pass){
        primus.end();
      }
    });
  });
  Lab.test('send clientEventsStream bogus event', function (done) {
    var cs = primus.substream('clientEvents');
    cs.on('data', function (data) {
      if(~data.indexOf('error')){
        pass = true;
        primus.end();
      }
    });
    check('echo failed to ping', done);
    cs.write({
      event: "bogus"
    });
  });
  Lab.test('send terminal disconnet', function (done) {
    var term = primus.substream('terminal');
    pass = true;
    term.write('exit\n');
    check('error closing term', done);
  });
});


Lab.experiment('session with opts', function () {
  Lab.test('send clientEventsStream correct resize event', function (done) {
    var pass = false;
    var primus = new Socket('http://localhost:3111?pid=1234&name=xterm-color&cols=222&rows=123&cwd=/&env={"TEST":"env"}');
    var term = primus.substream('terminal');
    term.write('tput lines\n');
    term.on('data', function function_name (data) {
      if(~data.indexOf('123')){
        pass = true;
        term.write('tput lines\n');
      }
      if(~data.indexOf('123') && pass){
        primus.end();
      }
    });
    primus.on('end', function () {
      if (pass) {
        return done();
      }
      return done(new Error(errMsg));
    });
  });
});
