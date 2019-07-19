import FlightControl from './flight-control';
import * as AFRAME from './aframe';
import { combineLatest, Subject } from 'rxjs';
import { map, filter, skip, startWith } from 'rxjs/operators';

const leftControllerSubject = new Subject();
const rightControllerSubject = new Subject();
const WS_URL = 'ws://10.8.1.137:3001';
const ws = new WebSocket(WS_URL);
const domNodes = {
  leftHand: null,
  rightHand: null,
  battery: null,
  altitude: null
};

var gripdown;
var lastFrame;
FlightControl.ws = ws;

function updateStats(stats) {
  domNodes.battery.setAttribute('value', stats.battery);
  domNodes.altitude.setAttribute('value', stats.tof);
}

function adjustSensibility([x, y]) {
  let returnedX = x;
  let returnedY = -y;
  const sensibility = 0.15;

  if (returnedX > 0 && returnedX < sensibility) {
    returnedX = 0;
  } else if (returnedX < 0 && returnedX > -sensibility) {
    returnedX = 0;
  }

  if (returnedY > 0 && returnedY < sensibility) {
    returnedY = 0;
  } else if (returnedY < 0 && returnedY > -sensibility) {
    returnedY = 0;
  }

  returnedX = (returnedX * 100);
  returnedY = (returnedY * 100);

  return [Math.round(returnedX), Math.round(returnedY)];
}

function startWsEvents() {
  ws.onopen = () => console.log(`Connected to ${WS_URL}`);
  ws.onmessage = (message) => {
    if (message.data.indexOf('data:image/jpg;base64') !== -1) {
      lastFrame = message.data;
    } else {
      updateStats(JSON.parse(message.data));
    }
  };
}

combineLatest(
  leftControllerSubject.pipe(startWith(null)),
  rightControllerSubject.pipe(startWith(null))
)
.pipe(
  skip(1),
  filter(() => {
    return !!FlightControl.ws;
  }),
  map(([left, right]) => {
    let returnedLeft = [0 , 0];
    let returnedRight = [0, 0];

    if (left) {
      returnedLeft = adjustSensibility(left.detail.axis);
    }

    if (right) {
      returnedRight = adjustSensibility(right.detail.axis);
    }

    return [returnedLeft, returnedRight];
  })
)
.subscribe(([left, right]) => {
  FlightControl.axismove(left, right);
});

AFRAME.registerComponent('video-component', {
  tick: function() {
    if (lastFrame) {
      this.el.setAttribute('material', 'src', lastFrame);
      lastFrame = null;
    }
  }
});

AFRAME.registerComponent('vr-controls', {
  init: function () {
    var el = this.el;
    el.addEventListener('xbuttondown', function (evt) {
      FlightControl.x();
    });

    el.addEventListener('ybuttondown', function (evt) {
      FlightControl.y();
    });

    el.addEventListener('triggerdown', function (evt) {
      FlightControl.photo();
    });

    el.addEventListener('abuttondown', function (evt) {
      FlightControl.a();
    });

    el.addEventListener('bbuttondown', function (evt) {
      FlightControl.b();
    });

    el.addEventListener('gripdown', function (evt) {
      if (evt.target.getAttribute('id') === 'left-control') {
        gripdown = {
          ...leftHand.getAttribute('position')
        };
      } else {
        gripdown = {
          ...rightHand.getAttribute('position')
        };
      }
    });

    el.addEventListener('gripup', function (evt) {
      var gripup = null;
      const flipPreccision = 0.12;

      if (evt.target.getAttribute('id') === 'left-control') {
        gripup = {
          ...leftHand.getAttribute('position')
        };
      } else {
        gripup = {
          ...rightHand.getAttribute('position')
        };
      }
      if (gripdown) {
        var diffHorizontal = -Infinity;
        var diffVertical = -Infinity;
        var actionHorizontal;
        var actionVertical;

        if (gripup.y > gripdown.y && gripup.y - gripdown.y > flipPreccision){
          diffHorizontal = gripup.y - gripdown.y;
          actionHorizontal = 'b';
        } else if (gripup.y < gripdown.y && gripdown.y - gripup.y > flipPreccision){
          diffHorizontal = gripdown.y - gripup.y;
          actionHorizontal = 'f';
        }

        if (actionVertical || actionHorizontal) {
          if (diffVertical > diffHorizontal) {
            FlightControl.flip(actionVertical);
          } else {
            FlightControl.flip(actionHorizontal);
          }
        }

        gripdown = null;
      }
    });

    el.addEventListener('axismove', function (evt) {
      if (evt.target.getAttribute('id') === 'left-control') {
        leftControllerSubject.next(evt);
      } else {
        rightControllerSubject.next(evt);
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const videoPlane = document.querySelector('#video-plane');
  domNodes.leftHand = document.querySelector('#left-control');
  domNodes.rightHand = document.querySelector('#right-control');
  domNodes.battery = document.querySelector('#battery-value');
  domNodes.altitude = document.querySelector('#altitude-value');

  const width = 1; // meters
  const height = width * 760 / 960;

  videoPlane.setAttribute('width', width);
  videoPlane.setAttribute('height', height);
  videoPlane.setAttribute('material', '');

  startWsEvents();
});
