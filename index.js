const express = require('express');
const dgram = require('dgram');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');
const PORT = 8889;
const HOST = '192.168.10.1';
const drone = dgram.createSocket('udp4');
const app = express();
const frameX = 960;
const frameY = 720;
const spawn = require('child_process').spawn;
const frameSize = frameX * frameY * 3;
const Decoder = require('./decoder');
const ffmpeg = require('ffmpeg-binaries');

console.log(Decoder);


drone.bind(PORT);

const droneState = dgram.createSocket('udp4');
droneState.bind(8890);

const droneStream = dgram.createSocket('udp4');
droneStream.bind(11111);
/*
const vlcStream = dgram.createSocket('udp4');
vlcStream.bind(1234); */

/*
ffmpeg := exec.Command('ffmpeg', '-hwaccel', 'auto', '-hwaccel_device', 'opencl', '-i', 'pipe:0',
		'-pix_fmt', 'bgr24', '-s', strconv.Itoa(frameX)+'x'+strconv.Itoa(frameY), '-f', 'rawvideo', 'pipe:1')
	ffmpegIn, _ := ffmpeg.StdinPipe()
ffmpegOut, _ := ffmpeg.StdoutPipe()
*/

function spawnFfmpeg(exitCallback) {
  var args = ['-i', 'pipe:0',
  '-pix_fmt', 'bgr24', '-s', frameX +'x'+ frameY, '-f', 'rawvideo', 'pipe:1'];

	var ffmpeg = spawn('ffmpeg', args);

	console.log('Spawning ffmpeg ' + args.join(' '));

	ffmpeg.on('exit', exitCallback);

	ffmpeg.stderr.on('data', function (data) {
    console.log('grep stderr: ' + data);
  });

  return ffmpeg;
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
  // console.log(`drone : ${message}`);

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
  // droneRun('sdk?');
  await droneRun('takeoff');
  await droneRun('forward 100');
  await droneRun('up 50');
  await sleep(2000);
  await droneRun('flip f');
  await droneRun('down 50');
  await droneRun('back 100');
  await droneRun('land');
}

async function init2() {
  await droneRun('command');
  await droneRun('streamon');
}

setTimeout(() => {
  console.log('force end');
  droneRun('land');
}, 30000);

const HTTP_PORT = 3000;

function videoByImage() {
  app.get('/client', (req, res) => res.sendFile(path.resolve(__dirname, './index.html')));

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
  });
}

function videoByVideo() {
  init2();
  let lastFrame = '';


  // var data = require('fs').readFileSync('img.png');

  const Readable = require('stream').Readable;
  const s = new Readable({
    read(size) {
      // s.push(lastFrame);

      // console.log('lastFrame', lastFrame);
        // s.push(lastFrame);
      // if (lastFrame) {
      // console.log('push');
        // s.push(lastFrame);
        // lastFrame = null;
      //}

      return true;
    }
  });

  app.get('/client', (req, res) => res.sendFile(path.resolve(__dirname, './video.html')));

  let count = 0;

  app.get('/video', function(req, res) {
    const head = {
      'Content-Type': 'video/mp4',
    }

    res.writeHead(200, head)
    s.pipe(res)


/*
      let image = '';
      droneStream.on('message', (message) => {
      console.log(`video stream : ${message.length}`);
      image += message;

      if (message.length !== 1460) {
        decoder.onPictureDecoded = (result) => {
          lastFrame = result;
        };

        decoder.decode(image);


        // lastFrame = message;
        count++;
        image= '';
      }

      // ffmpeg -f h264 -i image.h264
    }); */

    /*
    const ffmpeg = spawnFfmpeg(
      (code) => {
      	console.log('child process exited with code ' + code);
      	res.end();
      });

    const headers = {
      'h264_baseline': Buffer([0, 0, 0, 1]) // h264 NAL unit
    };
    const h264chunks = []

    let image = '';
    ffmpeg.stdout.on('data', (data) => {
      // console.log('---------------data---------------');
      // console.log(data);

      image += data;
      if (data.length !== 1460) {
        s.push(data);
        image = '';
      }
   var idx = data.indexOf(headers['h264_baseline'])
      if (idx > -1 && h264chunks.length > 0) {
        h264chunks.push(data.slice(0, idx))
        h264_player.decode(Uint8Array.from(Buffer.concat(h264chunks)))
        h264chunks = []
        h264chunks.push(data.slice(idx))
      } else {
        h264chunks.push(data)
      }
    })

    droneStream.on('message', (message) => {
      // console.log(`video stream : ${message.length}`);
      ffmpeg.stdin.write(message);
      // ffmpeg -f h264 -i image.h264
    });*/

    const h264encoder_spawn = {
      'command': 'ffmpeg',
      'args': [ '-fflags', 'nobuffer', '-f', 'h264', '-i', '-', '-r', '30', '-c:v', 'libx264', '-b:v', '2M', '-profile', 'baseline', '-preset', 'ultrafast', '-tune', 'zerolatency', '-vsync', '0', '-async', '0', '-bsf:v', 'h264_mp4toannexb', '-x264-params', 'keyint=5:scenecut=0', '-an', '-f', 'h264', '-analyzeduration', '10000', '-probesize', '32', '-']
    };

    const headers = {
      'h264_baseline': Buffer([0, 0, 0, 1]) // h264 NAL unit
    };

    let h264chunks = []
    const h264encoder = spawn(h264encoder_spawn.command, h264encoder_spawn.args)

    const parseMsg = function (data) {
      h264encoder.stdin.write(data)
    };

    h264encoder.stdout.on('data', function (data) {
      console.log(data);
      var idx = data.indexOf(headers['h264_baseline'])
      if (idx > -1 && h264chunks.length > 0) {
        h264chunks.push(data.slice(0, idx))
        console.log(Decoder(Uint8Array.from(Buffer.concat(h264chunks))));
        h264chunks = []
        h264chunks.push(data.slice(idx))
      } else {
        h264chunks.push(data)
      }
    });

    droneStream.on('message', (message) => {
      parseMsg(message);
    });
  });
}

app.use(express.static('public'));

videoByVideo();

app.listen(HTTP_PORT, () => console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`));


/*
app.get('/video', function(req, res) {
  const path = 'assets/sample.mp4';
  const stat = fs.statSync(path);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1]
      ? parseInt(parts[1], 10)
      : fileSize-1;

    const chunksize = (end-start) + 1;
    const file = fs.createReadStream(path, {start, end});
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res);
  }
});
*/
