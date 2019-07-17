function send(command) {
  console.log(command);
  send(command):
}

var FlightContol = {
  x: () => {
    send('takeoff');
  },
  y: () => {
    send('land');
  },
  axismove: (event) => {
    const distance = 10;
    const horizontal = event.detail.axis[0];
    const vertical = event.detail.axis[1];
    const noMoveMargin = 0.5;

    if (event.target.getAttribute('id') === 'left-control') {
      if (horizontal > noMoveMargin) {
        send(`cw 5`);
      } else if (horizontal < -noMoveMargin) {
        send(`ccw 5`);
      } else if (vertical < -noMoveMargin) {
        send(`up ${distance}`);
      } else if (vertical > noMoveMargin) {
        send(`down ${distance}`);
      }
    } else {
      if (horizontal > noMoveMargin) {
        send(`right ${distance}`);
      } else if (horizontal < -noMoveMargin) {
        send(`left ${distance}`);
      } else if (vertical < -noMoveMargin) {
        send(`forward ${distance}`);
      } else if (vertical > noMoveMargin) {
        send(`back ${distance}`);
      }
    }

   //  console.log(event.detail.axis);
//     send('forward 1');
  }
};
