var FlightContol = {
  x: () => {
    console.log('takeoff');
    ws.send('takeoff');
  },
  y: () => {
    ws.send('land');
  },
  axismove: (event) => {
    console.log(event);
    console.log(event.target.getAttribute('id'));
    const distance = 1;
    const horizontal = event.detail.axis[0];
    const vertical = event.detail.axis[1];

    if (event.target.getAttribute('id') === 'left-control') {
      if (horizontal > 0.2) {
        ws.send(`cw 5`);
      } else if (horizontal < -0.2) {
        ws.send(`ccw 5`);
      } else if (vertical < -0.2) {
        ws.send(`up ${distance}`);
      } else if (vertical > 0.2) {
        ws.send(`down ${distance}`);
      }
    } else {
      if (horizontal > 0.2) {
        ws.send(`right ${distance}`);
      } else if (horizontal < -0.2) {
        ws.send(`left ${distance}`);
      } else if (vertical < -0.2) {
        ws.send(`forward ${distance}`);
      } else if (vertical > 0.2) {
        ws.send(`back ${distance}`);
      }
    }

    console.log(event.detail.axis);
//     ws.send('forward 1');
  }
};
