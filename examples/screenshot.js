// capture framebuffer and save to file
// TODO: decode header, encode to png/gif/jpeg

var src = require('../index.js')
   .createConnection({host: process.argv[2]});
   .createStream('framebuffer:')
var dst = require('fs').createWriteStream(process.argv[3]);

src.pipe(dst);