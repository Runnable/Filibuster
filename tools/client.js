/**
 * @module tools/client
 */
var program = require('commander');
var Primus = require('primus');

var log = require('../lib/logger').getChild(__filename);

var Socket = Primus.createSocket({
  transformer: 'websockets',
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
log.trace({
  addr: addr
}, 'connecting');
var primus = new Socket(addr);

primus.on('error', function (err) {
  log.error({
    err: err
  }, 'Filibuster error occured');
  process.exit(0);
});
primus.on('end', function () {
  log.info('filibuster connection closed');
  process.exit(0);
});
primus.on('reconnect', function () {
  log.info('filibuster reconnecting reconnect event');
});

var onConnect = function() {
  log.info('connection established');
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
