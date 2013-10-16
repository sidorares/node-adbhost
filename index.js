var AdbHostClient = require('./lib/client.js');

function createConnection(opts) {
  return new AdbHostClient(opts);
}

module.exports.createConnection = createConnection;