const dgram = require('dgram');
const fs = require('fs');
const PORT = 8889;
const HOST = '192.168.10.1';
const drone = dgram.createSocket('udp4');
drone.bind(PORT);

const droneState = dgram.createSocket('udp4');
droneState.bind(8890);

const droneStream = dgram.createSocket('udp4');
droneStream.bind(11111);

let currentPromiseResolver = null;

function sleep(ms){
  return new Promise((resolve) => {
    setTimeout(resolve,ms)
  });
}

function handleError(err)  {
  if (err) {
    console.log('error');
    console.log(err);
  }
}

function droneRun(command) {
  console.log('command', command);
  drone.send(command, 0, command.length, PORT, HOST, handleError);

  return new Promise((resolve) => {
    currentPromiseResolver = resolve;
  });
}

drone.on('message', (message) => {
  console.log(`drone : ${message}`);

  if (String(message) === 'ok') {
    currentPromiseResolver();
  }
});

droneState.on('message', (message) => {
  // console.log(`drone state : ${message}`);
});

droneStream.on('message', (message) => {
  console.log(`drone stream : ${message}`);

  fs.writeFile('image.png', chunk, function (err) {
    if (err) throw err;
    console.log('It\'s saved!');
});
});

/* async function init() {
  // init flight test
  await droneRun('command');
  droneRun('battery?');
  // droneRun('sdk?');
  await droneRun('takeoff');
  await droneRun('forward 100');
  await droneRun('up 50');
  await sleep(2000);
  await droneRun('flip f');
  await droneRun('down 50');
  await droneRun('back 100');
  await droneRun('land');
} */

async function init() {
  await droneRun('command');
  await droneRun('streamon');
}

setTimeout(() => {
  console.log('force end');
  droneRun('land');
}, 20000);

setTimeout(() => {
  console.log('force end');
  droneRun('land');
}, 25000);

init();
