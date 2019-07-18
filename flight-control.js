function send(command) {
  console.log(command);
  //ws.send(command);
}

var FlightControl = {
  x: () => {
    send('takeoff');
  },
  y: () => {
    send('land');
  },
  axismove: (left, right) => {
    const distance = 40;
    const horizontalLeft = left[0];
    const verticalLeft = left[1];

    const horizontalRight = right[0];
    const verticalRight = right[1];

    send(`rc ${horizontalRight} ${verticalRight} ${verticalLeft} ${horizontalLeft}`);
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
