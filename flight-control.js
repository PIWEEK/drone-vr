function send(ws, command) {
  // console.log(command);
  ws.send(command);
}

var FlightControl = {
  ws: null,
  x: () => {
    send(FlightControl.ws, 'takeoff');
  },
  y: () => {
    send(FlightControl.ws, 'land');
  },
  a: () => {
    send(FlightControl.ws, 'flip left');
  },
  b: () => {
    send(FlightControl.ws, 'flip right');
  },
  flip: (where) => {
    send(FlightControl.ws, `flip ${where}`);
  },
  photo: () => {
    send(FlightControl.ws, `photo`);
  },
  axismove: (left, right) => {
    const horizontalLeft = left[0];
    const verticalLeft = left[1];

    const horizontalRight = right[0];
    const verticalRight = right[1];

    send(FlightControl.ws, `rc ${horizontalRight} ${verticalRight} ${verticalLeft} ${horizontalLeft}`);
/*

    if (event.target.getAttribute('id') === 'left-control') {
      if (horizontal > noMoveMargin) {
        send(`cw 15`);
      } else if (horizontal < -noMoveMargin) {
        send(`ccw 15`);
      } else if (vertical < -noMoveMargin) {
        send(`up ${distance}`);
      } else if (vertical > noMoveMargin) {
        send(`down ${distance}`);
      }
    } else {
    }
*/
   //  console.log(event.detail.axis);
//     send('forward 1');
  }
};
