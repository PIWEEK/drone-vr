function send(ws, command) {
  // console.log(command);
  ws.send(command);
}

const FlightControl = {
  ws: null,
  x: () => {
    send(FlightControl.ws, 'takeoff');
  },
  y: () => {
    send(FlightControl.ws, 'land');
  },
  a: () => {
    send(FlightControl.ws, 'flip l');
  },
  b: () => {
    send(FlightControl.ws, 'flip r');
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
  }
};

export default FlightControl;
