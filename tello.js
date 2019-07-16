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

drone.bind(PORT);

const droneState = dgram.createSocket('udp4');
droneState.bind(8890);

function spawnPython(exitCallback) {
  var args = ['Tello_Video/api.py'];

	var python = spawn('python', args);

	console.log('Spawning python ' + args.join(' '));

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

var zerorpc = require("zerorpc");

async function init() {
  await droneRun('command');
  droneRun('battery?');
  await droneRun('streamon');

  const frames = spawnPython(() => {
    console.log('fin')
  });

/*   await droneRun('takeoff');
  await droneRun('forward 100');
  await droneRun('up 50');
  await sleep(2000);
  await droneRun('flip f');
  await droneRun('down 50');
  await droneRun('back 100');
  await droneRun('land'); */
}

setTimeout(() => {
  console.log('force end');
  droneRun('land');
}, 30000);

const HTTP_PORT = 3000;

async function videoByImage() {
  const WS_PORT = 3001;
  const connectedClients = [];
  const wsServer = new WebSocket.Server({ port: WS_PORT }, () => console.log(`WS server is listening at ws://localhost:${WS_PORT}`));

  const server = new zerorpc.Server({
    hello: function(name, reply) {
      console.log(name);
      connectedClients.forEach((ws, i) => {
        if (ws.readyState === ws.OPEN) { // check if it is still connected
            ws.send('data:image/jpg;base64,' + name.toString('base64')); // send
        } else { // if it's not connected remove from the array of connected ws
            connectedClients.splice(i, 1);
        }
      });

      reply(null, "Hello, " + name);
    }
  });

  server.bind("tcp://0.0.0.0:4242");

  await init();

  app.get('/client', (req, res) => res.sendFile(path.resolve(__dirname, './index.html')));
  app.get('/video', (req, res) => res.sendFile(path.resolve(__dirname, './video.html')));

  wsServer.on('connection', (ws, req) => {
    console.log('Connected');
    connectedClients.push(ws);
  });
}

videoByImage();
app.use(express.static('public'));
app.listen(HTTP_PORT, () => console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`));
