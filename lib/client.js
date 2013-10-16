var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var net          = require('net');
var stream       = require('stream');
var AdbStream    = require('./stream.js');
var AdbPacket    = require('./packet');
var commands = AdbPacket.commands;

function streamFromOpts(opts) {
  var stream;
  if (opts && opts.stream)
    return stream;
  if (opts && (opts.path || opts.host || opts.port)) {
    if (opts.path) 
      stream = net.connect(opts.path);
    else {
      if (opts.host && !opts.port)
         opts.port = 5555;
      stream = net.connect(opts.port, opts.host);
    }
    return stream;
  }
  // TODO: throw exception
  return null;
}

function AdbHostClient(opts) {
  if (!(this instanceof AdbHostClient)) return new AdbHostClient(opts);
  EventEmitter.call(this);
  this._stream = streamFromOpts(opts);
  this._packet = null;
  this._waitHeader = true;
  this._nextStreamId = 12345;
  this._userStreams = {};
  this._state = 0;
  var self = this;
  this._stream.on('readable', function() {
    while(1) {
      if (self._waitHeader) {
        var header = self._stream.read(24);
        if (header) {
          self._packet = AdbPacket.fromBuffer(header);
          if (self._packet.dataLength == 0) {
            self._onPacket(self.packet);
          } else {
            self._waitHeader = false;
          }
        } else break;
      } else {
        var data = self._stream.read(self._packet.dataLength);
        if (data) {
          self._packet.data = data;
          // TODO verify crc integrity here
          // self._packet.checkCRC();
          self._onPacket();
          self._waitHeader = true;
        } else break;
      }
    }
  });
  this._stream.on('connect', function() {
    self._state = 1;
    self._connected = true;
    // TODO: move version, maxdata, system-identity-string to options + set defaults
    self._writePacket(commands.CNXN, 0x01000000, 4096, 'host::');
  });
}
util.inherits(AdbHostClient, EventEmitter);

AdbHostClient.prototype._writePacket = function(type, arg1, arg2, data) {
  if (!this._connected)
    this._stream.once('connect', this._writePacket.bind(this, type, arg1, arg2, data));
  else {
    var cmd = Buffer(4); cmd.writeUInt32LE(type, 0);
    //console.log('WRITE:', cmd.toString(), arg1, arg2, data);
    this._stream.write(new AdbPacket(type, arg1, arg2, data).toBuffer());
  }
}

// dispatch incoming packets
AdbHostClient.prototype._onPacket = function() {
  packet = this._packet;
  //console.log('PACKET:', packet.toString());
  switch(packet.command) {
  case commands.WRTE:
    var localId = packet.arg2;
    var userStream = this._userStreams[localId];
    // TODO if (!stream)
    userStream.push(packet.data);
    // TODO handle user stream backpressure.
    this._writePacket(commands.OKAY, userStream.localId(), userStream.remoteId());
    break;
  case commands.OKAY:
    //console.log('OKAY: ', packet.arg1, packet.arg2);
    var localId = packet.arg2;
    var userStream = this._userStreams[localId];
    if (userStream._remoteId == -1) { // this is OK reply to OPEN
      userStream._remoteId = packet.arg1;
      this.emit('_CNXN'); // TODO: is there 'open' event in Stream2 ?
    }
    // TODO: handle backpressure
    break;
  case commands.CNXN:
    this._hostVersion = packet.arg1;
    this._hostMaxData = packet.arg2;
    this._banner = packet.data.toString().split(':');
    this._state = 2;
    this.emit('connect');
    break;
  case commands.CLSE:
    var localId = packet.arg2;
    var userStream = this._userStreams[localId];
    userStream.end();
    delete this._userStreams[localId]; 
    break;
  // TODO: handle AUTH
  } 
}

AdbHostClient.prototype._open = function(path, id) {
  this._writePacket(commands.OPEN, id, 0, path);
}

AdbHostClient.prototype.createStream = function(path) {
  var userStream = new AdbStream(this);
  this._userStreams[userStream.localId()] = userStream;
  var self = this;
  if (this._state != 2) {
    this.once('connect', function() {
      self._open(path, userStream.localId());
    });
  } else
      self._open(path, userStream.localId());
  return userStream;
}

module.exports = AdbHostClient;
