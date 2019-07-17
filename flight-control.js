var FlightContol = {
  x: () => {
    console.log('takeoff');
    ws.send('takeoff');
  },
  y: () => {
    ws.send('land');
  },
  axismove: (axis) => {
    console.log(axis);
//     ws.send('forward 1');
  }
};
