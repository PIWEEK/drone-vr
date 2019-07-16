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

/* let x = false;
droneStream.on('message', (message) => {
  console.log(`drone stream : ${message}`);

  if (!x) {
    x = true;
    fs.writeFile('image.png', message, function (err) {
      if (err) throw err;
      console.log('It\'s saved!');
    });
  }
}); */

async function init() {
  // init flight test
  await droneRun('command');
  droneRun('battery?');
  await droneRun('streamon');

  const frames = spawnPython(() => {
    console.log('fin')
  });

  var count = 0;
  var bufferImages = [];
  const separator = '-----fin-----';

  frames.stdout.on('data', (x) => {
/*     fs.writeFile('img/front/' + count + '-front.jpg', x, () => {});
    count++; */

    bufferImages.push(message);

    if (bufferImages.indexOf(separator) !== -1) {
      count++;

      const images = bufferImages.split(separator);

      if (images.length > 1) {
        fs.writeFile('img/front/' + count + '-front.jpg', images.shift(), () => {});
        bufferImages = images.join(separator);
      }

    }
/*     if (count === 2) {
      console.log('image 1')
      console.log(list[0].slice(0, 10));
      console.log('image 2')
      console.log(list[1].slice(0, 10));
      setTimeout(() => {

        this['sdfdsfd']();
      }, 1000);
    } */
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
  await init();

  app.get('/client', (req, res) => res.sendFile(path.resolve(__dirname, './index.html')));
/*
  const WS_PORT = 3001;
  const connectedClients = [];
  const wsServer = new WebSocket.Server({ port: WS_PORT }, () => console.log(`WS server is listening at ws://localhost:${WS_PORT}`));

  wsServer.on('connection', (ws, req) => {
    console.log('Connected');
    // add new connected client
    connectedClients.push(ws);
    // listen for messages from the streamer, the clients will not send anything so we don't need to filter

    vlcStream.on('message', (message) => {
      console.log(`video stream : ${message}`);
        // send the base64 encoded frame to each connected ws
      connectedClients.forEach((ws, i) => {
        if (ws.readyState === ws.OPEN) { // check if it is still connected
            ws.send(message); // send
        } else { // if it's not connected remove from the array of connected ws
            connectedClients.splice(i, 1);
        }
      });
    });
  }); */
}

videoByImage();
app.use(express.static('public'));
app.listen(HTTP_PORT, () => console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`));
