var five = require('johnny-five');
var pixel = require('node-pixel');

var stdin = process.openStdin();
//process.stdin.setRawMode(true);
require('tty').setRawMode(true);

var board = new five.Board({
  port: '/dev/tty.Makeblock-ELETSPP'
});

var minSpeed = 25,
  maxSpeed = 275,
  currentSpeed = 0,
  step = 20,
  left = null,
  right = null;

board.on('ready', function (err) {
  if (err) {
    console.log(err);
    return;
  }

  left = new five.Motor({
    pins: {
      pwm: 6,
      dir: 7
    }
  });

  right = new five.Motor({
    pins: {
      pwm: 5,
      dir: 4
    }
  });
});

setInterval(function () {
  console.log('current', currentSpeed);
}, 1000);

stdin.on('keypress', function (chunk, key) {
  // process the keypresses
  //console.log('pressed', key.name);

  if (key) {
    switch (key.name) {
    case 'up':
      if (currentSpeed < minSpeed)
        currentSpeed = minSpeed;

      if (currentSpeed + step > maxSpeed) break;

      currentSpeed += step;

      console.log('left', left);

      left.reverse(currentSpeed);
      right.forward(currentSpeed);

      break;

    case 'down':
      currentSpeed -= step;

      left.reverse(currentSpeed);
      right.forward(currentSpeed);

      if (currentSpeed < minSpeed) {
        currentSpeed = 0;
        left.stop();
        right.stop();
      }

      break;

    case 'left':
      left.reverse(currentSpeed * 1.25);
      setTimeout(function () {
        left.reverse(currentSpeed);
      }, 200);

      break;

    case 'right':
      right.forward(currentSpeed * 1.25);
      setTimeout(function () {
        left.forward(currentSpeed);
      }, 200);

      break;
    }
  }
});
