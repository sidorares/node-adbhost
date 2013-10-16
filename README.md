# node-adbhost
[Android Debug Bridge host protocol](https://github.com/android/platform_system_core/blob/master/adb/protocol.txt) client for [node.js](http://nodejs.org)
Currently only tcp transport is supported (usb transport in TODO). You don't need to have local adb server running on your computer.

[![NPM](https://nodei.co/npm/adbhost.png?downloads=true&stars=true)](https://nodei.co/npm/adbhost/)

## Install

	npm install adbhost

[Enable tcp transport in adb on your device](http://stackoverflow.com/questions/2604727/how-can-i-connect-to-android-with-adb-over-tcp)


## Example

simple shell (pass your device IP address as a command line parameter):

```js
var adbhost = require('adbhost');
var adb   = adbhost.createConnection({host: process.argv[2]});
var shell = adb.createStream('shell:');
process.stdin.pipe(shell);
shell.pipe(process.stdout);
```

## API

```js
  conn = adbhost.createConnection(opts);
```
- create connection to device. `ops.port, opts.host, opts.stream`


```js
  s = conn.createStream(path);
```
- returns duplex stream. Path is a string with [service name](https://github.com/android/platform_system_core/blob/master/adb/SERVICES.TXT).

## LINKS
  - [Adb host and local protocol documentation](https://github.com/android/platform_system_core/blob/master/adb/protocol.txt)
  - [List of host services](https://github.com/android/platform_system_core/blob/master/adb/SERVICES.TXT)
  - [Local protocol node.js client](https://github.com/flier/adb.js)
