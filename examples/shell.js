var adbhost = require('../index.js')
var adb   = adbhost.createConnection({host: process.argv[2]});
var shell = adb.createStream('shell:');
process.stdin.pipe(shell);
//process.stdin.setRawMode(true);
shell.pipe(process.stdout);