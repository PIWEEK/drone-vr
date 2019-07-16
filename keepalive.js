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
  if (String(message) !== 'ok') {
    console.log(`drone : ${message}`);
  }

  if (String(message) === 'ok') {
    currentPromiseResolver();
  }
});

async function init() {
  await droneRun('command');

  setInterval(() => {
    droneRun('battery?');
  }, 10000);
}

init();


const HTTP_PORT = 3000;

app.use(express.static('public'));
app.listen(HTTP_PORT, () => console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`));
