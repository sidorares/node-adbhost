// examples: (see full list of local services at https://github.com/android/platform_system_core/blob/master/adb/SERVICES.TXT)
// node portforward.js 10.0.0.10 tcp:8080 8081 # accept connections on localhost:8081 and forward to remote device tcp 8080
// node portforward.js 10.0.0.10 local:/var/run/something.sock 8081 # forward connection to remote Unix socket

var adbhost = require('../index.js')
var adb   = adbhost.createConnection({host: process.argv[2]});

var forwardport = process.argv[3];
var listenport = process.argv[4]

require('net').createServer(function(socket) {

  var remote = adb.createStream(forwardport);
  remote.pipe(socket);
  socket.pipe(remote);

}).listen(listenport);