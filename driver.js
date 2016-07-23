var five = require('johnny-five');
var pixel = require('node-pixel');

var stdin = process.openStdin();
//process.stdin.setRawMode(true);

var board = new five.Board({
  port: '/dev/tty.Makeblock-ELETSPP'
});

var DEBUG = false;
var normalSpeed = 150;

function debugLog(msg) {
  if (DEBUG) console.info(msg);
}

board.isRunning = false;
board.isDriving = false;

board.driving = function (bool) {
  if (arguments.length == 0)
    return board.isDriving;

  debugLog('board->driving(' + bool.toString() + ')');
  board.isDriving = bool;

  if (board.isDriving) {
    board.getControl('strip').color('#0000ff');
    board.getControl('strip').show();

    board.getControl('left').reverse(normalSpeed);
    board.getControl('right').forward(normalSpeed);
  } else {
    board.getControl('left').stop();
    board.getControl('right').stop();
  }
};

board.backUp = function (cb) {
  board.getControl('left').forward(normalSpeed);
  board.getControl('right').reverse(normalSpeed * 2);

  setTimeout(function () {
    board.getControl('left').stop();
    board.getControl('right').stop();

    cb();
  }, 1000);
};

board.running = function (bool) {
  if (arguments.length == 0)
    return board.isRunning;

  debugLog('board->running(' + bool.toString() + ')');
  board.isRunning = bool;

  if (board.isRunning) {
    board.getControl('strip').color('#00ff00');
  } else {
    board.getControl('strip').color('#000');
  }
};

board.addControl = function (name, obj) {
  if (!board.controls) board.controls = {};

  board.controls[name] = obj;
  return board;
};

board.getControl = function (name) {
  if (board.controls[name])
    return board.controls[name];

  return;
};

board.on('ready', function (err) {
  if (err) {
    console.log(err);
    return;
  }

  board.addControl('left', new five.Motor({
    pins: {
      pwm: 6,
      dir: 7
    }
  }));

  board.addControl('right', new five.Motor({
    pins: {
      pwm: 5,
      dir: 4
    }
  }));

  board.addControl('proximity', new five.Proximity({
    freq: 1000,
    controller: 'HCSR04',
    pin: 10
  }));

  board.addControl('button', new five.Button({
    pin: 'A7',
    controller: 'TINKERKIT',
    invert: true
  }));

  board.addControl('eyes', new five.IR.Reflect.Array({
    emitter: 13,
    pins: ["A3", "A2"], // any number of pins
    freq: 100,
    autoCalibrate: true,
  }));

  board.addControl('strip', new pixel.Strip({
    data: 13,
    length: 2,
    board: board,
    controller: "FIRMATA",
  }));

  board.getControl('button').on('press', function () {
    if (board.running()) {
      console.log('stop');
      board.running(false);
      board.driving(false);

      board.getControl('proximity').removeAllListeners('data');
    } else {
      console.log('start');
      board.running(true);
      board.driving(true);

      board.getControl('proximity').on('data', function () {
        console.info('Distance: ' + this.cm + 'cm');

        if (this.cm < 10.0) {
          console.info('SOMETHING CLOSE! Redirecting');
          board.driving(false);
          board.backUp(function () {
            board.driving(true);
          });
        }
      });

      board.getControl('eyes').on('data', function () {
        if (!board.driving()) return;

        if (this.raw[0] < 10 || this.raw[1] < 10) {
          board.driving(false);
          board.backUp(function () {
            board.driving(true);
          });
        }
      })
    }
  });
});
