const express = require('express');
const dgram = require('dgram');
const path = require('path');
const WebSocket = require('ws');
const zerorpc = require('zerorpc');
const fs = require('fs');
const spawn = require('child_process').spawn;

const PORT = 8889;
const HOST = '192.168.10.1';
const WS_PORT = 3001;
const HTTP_PORT = 3000;
const STATE_PORT = 8890;

const app = express();

const drone = dgram.createSocket('udp4');
drone.bind(PORT);

const droneState = dgram.createSocket('udp4');
droneState.bind(STATE_PORT);

var currentPromiseResolver = null;
var lastImg;
var photoCount = 0;

function spawnPython(exitCallback) {
  const args = ['src/Tello_Video/api.py'];
	const python = spawn('python', args);

	python.on('exit', exitCallback);

	python.stderr.on('data', function (data) {
    console.log('grep stderr: ' + data);
  });

  return python;
}

function handleError(err)  {
  if (err) {
    console.log('error');
    console.log(err);
  }
}

function droneRun(command) {
  console.log('drone command:', command);
  drone.send(command, 0, command.length, PORT, HOST, handleError);

  return new Promise((resolve) => {
    currentPromiseResolver = resolve;
  });
}

drone.on('message', (message) => {
  console.log(`drone : ${message}`);
  currentPromiseResolver(message);
});

var stats = {};

droneState.on('message', (message) => {
  let state = message
  .toString()
  .replace('\r\n', '')
  .split(';')
  .reduce((obj, it) => {
    const stat = it.split(':');

    obj[stat[0]] = stat[1];

    return obj;
  }, {});

  stats = state;
});

async function initDrone() {
  await droneRun('command');
  await droneRun('speed 100');
  await droneRun('streamon');

  spawnPython(() => {
    console.log('closing python spawn')
  });
}

const messageRecived = (data) => {
  console.log('front message:', data);
  if (data === 'photo') {
    photoCount++;
    fs.writeFile(`photo${photoCount}.jpg`, lastImg, (err) => {});
    return Promise.resolve();
  }

  return droneRun(data);
};

function getStats(ws) {
  ws.send(JSON.stringify({
    battery: String(stats.bat || 0).replace('\r\n', ''),
    tof: String(stats.tof || 0).replace('\r\n', ''),
  }));
}

async function init() {
  const connectedClients = [];
  const wsServer = new WebSocket.Server({ port: WS_PORT }, () => console.log(`WS server is listening at ws://localhost:${WS_PORT}`));
  const server = new zerorpc.Server({
    sendFrame: function(img, reply) {
      connectedClients.forEach((ws, i) => {
        lastImg = img;

        if (ws.readyState === ws.OPEN) {
          ws.send('data:image/jpg;base64,' + img.toString('base64')); // send
        } else {
          connectedClients.splice(i, 1);
        }
      });

      reply(null);
    }
  });

  server.bind('tcp://0.0.0.0:4242');

  app.get('/', (req, res) => res.sendFile(path.resolve(__dirname, './index.html')));

  wsServer.on('connection', (ws) => {
    console.log('connection');
    connectedClients.push(ws);

    setInterval(() => {
      getStats(ws);
    }, 300);

    ws.on('message', messageRecived);
  });

  await initDrone();
}

app.use(express.static('.'));
app.listen(HTTP_PORT, () => console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`));

init();
