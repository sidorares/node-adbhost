var commands = {};
// convert 4-byte ascii strings to 32bit integer constants
"SYNC OPEN CNXN AUTH OKAY CLSE WRTE".split(' ').forEach(function(command) {
   module.exports[command] = commands[command] = Buffer(command).readUInt32LE(0);
});

// note that it's not crc32
var crc = function(buff) {
  if (!buff)
    return 0;
  var res = 0;
  for (var i=0; i < buff.length; ++i) {
    res = (res + buff[i]) & 0xFFFFFFFF;
  }
  return res;
}

function AdbPacket(command, arg1, arg2, data)
{
  if (typeof data == 'string')
  {
    var buf = new Buffer(data.length + 1);
    buf.write(data);
    buf[data.length] = 0;
    data = buf;
  }

  if (this.constructor !== AdbPacket)
    return new AdbPacket(command, arg1, arg2, data);
    
  if (typeof command == 'string')
    this.command = commands[command];
  else
    this.command = command;
  this.arg1 = arg1;
  this.arg2 = arg2;
  this.magic = 0xFFFFFFFF - this.command;
  this.data = data;
}

AdbPacket.prototype.toBuffer = function() {
  var dataLength = 0;
  if (this.data)
     dataLength = this.data.length;
  var buffer = new Buffer(24 + dataLength);
  buffer.writeUInt32LE(this.command, 0);
  buffer.writeUInt32LE(this.arg1, 4);
  buffer.writeUInt32LE(this.arg2, 8);
  buffer.writeUInt32LE(dataLength, 12);
  buffer.writeUInt32LE(crc(this.data), 16);
  buffer.writeUInt32LE(this.magic, 20);
  if (dataLength > 0)
    this.data.copy(buffer, 24);
  return buffer;
}

AdbPacket.fromBuffer = function(buffer) {
  var command = buffer.readUInt32LE(0);
  var arg1 = buffer.readUInt32LE(4);
  var arg2 = buffer.readUInt32LE(8);
  var dataLength = buffer.readUInt32LE(12);
  var dataCRC = buffer.readUInt32LE(16);
  var magic = buffer.readUInt32LE(20);
  var packet = new AdbPacket(command, arg1, arg2);
  packet.dataLength = dataLength;
  packet.dataCRC = dataCRC;
  var c = Buffer(4);
  c.writeUInt32LE(command, 0);
  packet.cmd = c.toString();
  return packet;
}

module.exports = AdbPacket;
module.exports.commands = commands;