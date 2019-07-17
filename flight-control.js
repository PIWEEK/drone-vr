var FlightContol = {
  x: () => {
    ws.send('takeoff');
  },
  y: () => {
    ws.send('land');
  }
};
