var Primus = require('primus');
var Socket = Primus.createSocket({ 
  transformer: 'websockets',
  plugin: {
    'substream': require('substream')
  }, 
  parser: 'JSON'
});

var primus = new Socket('http://localhost:3111/attach/again?pid=123');
primus.on('open', function () {
  console.log('primus: connection established');
});
primus.on('error', function (err) {
  console.log('primus: error event', err);
});
primus.on('end', function () {
  console.log('primus: connection closed');
});
primus.on('reconnect', function () {
  console.log('primus: reconnect event happend');
});


process.stdin.setEncoding('utf8');
var terminal = primus.substream('terminal');
process.stdin.pipe(terminal);

var clientEvents = primus.substream('clientEvents');
clientEvents.write({"event":"ping"});
clientEvents.write({"event":"resize"});


clientEvents.on('data', function(data) {
  console.log("clientEvents: ", data);
});