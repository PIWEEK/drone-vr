import tello
import threading
import time
from PIL import Image
import io
import zerorpc

c = zerorpc.Client()
c.connect("tcp://127.0.0.1:4242")

def videoLoop(drone):
  count = 0
  while True:
    frame = drone.read()
    if frame is None or frame.size == 0:
      continue

    output = io.BytesIO()

    image = Image.fromarray(frame)
    image.save(output, format='JPEG')
    c.hello(output.getvalue())
    count += 1
    #image.save('img/back/' + str(count) + '-back.jpg', format='JPEG')"

def main():
    drone = tello.Tello('', 9999)
    videoLoop(drone)

if __name__ == "__main__":
    main()