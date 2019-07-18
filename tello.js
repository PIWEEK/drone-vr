const express = require('express');
const dgram = require('dgram');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');
const PORT = 8889;
const HOST = '192.168.10.1';
const drone = dgram.createSocket('udp4');
const app = express();
const spawn = require('child_process').spawn;
const WS_PORT = 3001;
const HTTP_PORT = 3000;

drone.bind(PORT);

function spawnPython(exitCallback) {
  const args = ['Tello_Video/api.py'];
	const python = spawn('python', args);

	python.on('exit', exitCallback);

	python.stderr.on('data', function (data) {
    console.log('grep stderr: ' + data);
  });

  return python;
}

let currentPromiseResolver = null;
let actionInProgress = false;

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
  console.log('droneRun-----------_>', command);
  actionInProgress = true;
  drone.send(command, 0, command.length, PORT, HOST, handleError);

  return new Promise((resolve) => {
    currentPromiseResolver = resolve;
  });
}

drone.on('message', (message) => {
  console.log(`drone : ${message}`);
  /* if (String(message) !== 'ok') {
  } */

  //if (String(message) === 'ok') {
  actionInProgress = false;
  currentPromiseResolver(message);
});

const zerorpc = require('zerorpc');

async function flight () {
  await droneRun('takeoff');
  await droneRun('forward 300');
  await droneRun('up 50');
  await sleep(2000);
  await droneRun('flip f');
  await droneRun('down 50');
  await droneRun('back 300');
  await droneRun('land');
}

async function init() {
  await droneRun('command');
  await droneRun('speed 100');
  await droneRun('streamon');

  spawnPython(() => {
    console.log('closing python spawn')
  });
}

const messageRecived = (data) => {
  console.log('mensaje = ', data);
  if (data === 'photo') {
    photoCount++;
    fs.writeFile(`photo${photoCount}.jpg`, lastImg, function(err) {});
    return Promise.resolve();
  }
  return droneRun(data);
}
var lastImg;
var photoCount = 0;


async function getStats(ws) {
  const battery = await droneRun('battery?');
  const tof = await droneRun('tof?');
  const wifi = await droneRun('wifi?');

  ws.send(JSON.stringify({
    battery: String(battery).replace('\r\n', ''),
    tof: String(tof).replace('\r\n', ''),
    wifi: String(wifi).replace('\r\n', '')
  })); // send
}

async function videoByImage() {
  const connectedClients = [];
  const wsServer = new WebSocket.Server({ port: WS_PORT }, () => console.log(`WS server is listening at ws://localhost:${WS_PORT}`));
  var count = 0;

  const server = new zerorpc.Server({
    sendFrame: function(img, reply) {
      connectedClients.forEach((ws, i) => {
        lastImg = img;
        if (ws.readyState === ws.OPEN) { // check if it is still connected
          ws.send('data:image/jpg;base64,' + img.toString('base64')); // send
        } else { // if it's not connected remove from the array of connected ws
            connectedClients.splice(i, 1);
        }
      });

      reply(null);
    }
  });

  server.bind('tcp://0.0.0.0:4242');

  app.get('/client', (req, res) => res.sendFile(path.resolve(__dirname, './index.html')));
  app.get('/video', (req, res) => res.sendFile(path.resolve(__dirname, './video.html')));

  wsServer.on('connection', (ws) => {
    console.log('connection');
    connectedClients.push(ws);

    setInterval(() => {
      getStats(ws);
    }, 3000);

    ws.on('message', messageRecived);
  });

  await init();

  // flight();
  // flight2();
  // flight3();
}

videoByImage();

app.use(express.static('.'));
app.listen(HTTP_PORT, () => console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`));

// forward +
// back -

// up +
// down -

// left +
// right -

// a b c d

// a left/right
// b forward/backward
// c up/down
// d yaw

async function flight3() {
  await droneRun('takeoff');
  droneRun('rc 0 20 20 0');

  setTimeout(async () => {
    droneRun('rc 0 -20 -20 0');

    setTimeout(async () => {
      await droneRun('land');
    }, 8000);
  }, 8000);
}

/* setTimeout(() => {
  console.log('force end');
  droneRun('land');
}, 30000); */

/* async function flight2 () {
  console.log('klkkk111');
  messageRecived('takeoff');
  messageRecived('forward 10');
  messageRecived('forward 10');
  messageRecived('forward 10');
  messageRecived('forward 10');

  messageRecived('left 10');
  messageRecived('left 10');
  messageRecived('left 10');
  messageRecived('left 10');

  messageRecived('right 10');
  messageRecived('right 10');
  messageRecived('right 10');
  messageRecived('right 10');

  setTimeout(() => {
    messageRecived('left 50');

    setTimeout(() => {
      droneRun('land');
    }, 2000);
  }, 8000)

}
 */
