var program = require('commander');
var Primus = require('primus');
var Socket = Primus.createSocket({
  transformer: process.env.SOCKET_TYPE,
  plugin: {
    'substream': require('substream')
  },
  parser: 'JSON'
});

program
  .version('0.0.1')
  .usage('[options] target')
  .option('-h, --host <name>', 'hostname')
  .option('-p, --port <port>', 'port number', parseInt)
  .option('-n, --name [shell]', 'type of shell, defauly xterm-color')
  .option('-c, --cols [number]', 'number of column for shell', parseInt)
  .option('-r, --rows [number]', 'number of rows for shell', parseInt)
  .option('-d, --cwd [path]', 'cwd path')
  .option('-e, --env [number]', 'set envs one per option', [])
  .parse(process.argv);

if(!program.args[0] || !program.port || !program.host) {
  program.help();
  process.exit(0);
}

var cmd = JSON.stringify({
      username: "ubuntu",
      host: "runnable2.net",
      port: "49154"
    });
var addr = 'http://'+program.host+":"+program.port;
addr += "?args="+cmd;
// TODO add test of args
console.log("connecting to ", addr);
var primus = new Socket(addr);

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
  // process.stdin.setRawMode(true);
  // if not set binary string get sent which would require decoding into pty
  process.stdin.setEncoding('utf8');
  // pipe terminal to primus substream
  process.stdin.pipe(terminal).pipe(process.stdout);

  // var start = new Date();
  // clientEvents.write({event: "ping", data: start});

  // clientEvents.on('data', function(data) {
  //   console.log("clientEvents: ping-pong took: ",new Date()-start);
  //   start = new Date();
  //   clientEvents.write({event: "ping", data: start});
  // });
};
primus.on('open', onConnect);
