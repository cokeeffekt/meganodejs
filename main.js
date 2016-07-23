var five = require("johnny-five");

var opts = {};
opts.port = process.argv[2] || "";

var board = new five.Board(opts);

board.on("ready", function () {
  var led = new five.Led(13);
  led.blink(500);
});
