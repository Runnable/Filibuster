var Primus = require('primus');
var Socket = Primus.createSocket({ 
  transformer: 'websockets',
  plugin: {
    'substream': require('substream')
  }, 
  parser: 'JSON'
});
var primus = new Socket('http://localhost:3111?pid=123&d={you:1}');

primus.on('error', function (err) {
  console.log('Filibuster: error occured', err);
  process.exit(0);
});
primus.on('end', function () {
  console.log('Filibuster: connection closed');
  process.exit(0);
});
primus.on('reconnect', function () {
  console.log('Filibuster: reconnecting reconnect event happend');
});

var onConnect = function() {
  console.log('connection established');
  var terminal = primus.substream('terminal');
  var clientEvents = primus.substream('clientEvents');

  // without this, we would only get streams once enter is pressed
  process.stdin.setRawMode(true);
  // if not set binary string get sent which would require decoding into pty
  process.stdin.setEncoding('utf8');
  // pipe terminal to primus substream
  process.stdin.pipe(terminal).pipe(process.stdout);

  clientEvents.on('data', function(data) {
    console.log("clientEvents: ", data);
  });
};
primus.on('open', onConnect);
