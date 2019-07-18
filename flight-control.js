function send(command) {
  console.log(command);
  ws.send(command);
}

var FlightControl = {
  x: () => {
    send('takeoff');
  },
  y: () => {
    send('land');
  },
  axismove: (event) => {
    const distance = 40;
    const originalHorizontal = event.detail.axis[0];
    const originalVertical = event.detail.axis[1];

    const horizontal = (originalHorizontal * 100) / 2;
    const vertical = (originalVertical * 100) / 2;
    const noMoveMargin = 0.5;

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
      send(`rc ${horizontal} ${vertical} 0 0`);
    }

   //  console.log(event.detail.axis);
//     send('forward 1');
  }
};
