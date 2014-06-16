var program = require('commander');
var Primus = require('primus');

program
  .version('0.0.1')
  .usage('[options] target')
  .option('-h, --host <name>', 'hostname')
  .option('-p, --port <port>', 'port number', parseInt)
  .option('-n, --number <number>', 'number of connections to open', parseInt)
  .option('-d, --delay <seconds>', 'seconds between new connection calls', parseInt)
  .option('-c, --command <string>', 'command to run')

  .parse(process.argv);

if(!program.port || !program.host) {
  program.help();
  process.exit(0);
}
var doneCnt=0;
var startCnt=0;
var start = function(cb) {
  var Socket = Primus.createSocket({ 
    transformer: 'websockets',
    plugin: {
      'substream': require('substream')
    }, 
    parser: 'JSON'
  });
  var addr = 'http://'+program.host+":"+program.port;
  addr += "?pid="+startCnt;
  var primus = new Socket(addr);
  primus.on('open', function() {
    var terminal = primus.substream('terminal');
    var clientEvents = primus.substream('clientEvents');
    var start = new Date();
    var onRep = function() {
      start = new Date(); 
      terminal.write("pwd\n"); 
    };
    onRep();
    terminal.on('data', function function_name (data) {
      if(~data.indexOf("/home/ubuntu/Filibuster")) {
        console.log("pwd took", new Date() - start);
        doneCnt++;
        setTimeout(onRep, 10000);
      }
    });
  });
  cb();
};

start(function inter() {
  startCnt++;
  if(startCnt < 1000) {
    start(inter);
  }
});
