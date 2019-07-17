const express = require('express');
const dgram = require('dgram');
const path = require('path');
const WebSocket = require('ws');
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
  drone.send(command, 0, command.length, PORT, HOST, handleError);

  return new Promise((resolve) => {
    currentPromiseResolver = resolve;
  });
}

drone.on('message', (message) => {
  if (String(message) !== 'ok') {
    console.log(`drone : ${message}`);
  }

  if (String(message) === 'ok') {
    currentPromiseResolver();
  }
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
  droneRun('battery?');
  await droneRun('streamon');

  spawnPython(() => {
    console.log('closing python spawn')
  });
}

async function videoByImage() {
  const connectedClients = [];
  const wsServer = new WebSocket.Server({ port: WS_PORT }, () => console.log(`WS server is listening at ws://localhost:${WS_PORT}`));
  var count = 0;

  const server = new zerorpc.Server({
    sendFrame: function(name, reply) {
      connectedClients.forEach((ws, i) => {
        if (ws.readyState === ws.OPEN) { // check if it is still connected
          ws.send('data:image/jpg;base64,' + name.toString('base64')); // send
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

    ws.on('message', (data) => {
      console.log('mensaje', data)
      droneRun(data);
    });
  });

  await init();

  // flight();
}

videoByImage();

app.use(express.static('.'));
app.listen(HTTP_PORT, () => console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`));

setTimeout(() => {
  console.log('force end');
  droneRun('land');
}, 30000);
