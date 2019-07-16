import tello
import threading
import time
from PIL import Image
import io

def videoLoop(drone):
  count = 0
  while True:
    frame = drone.read()
    if frame is None or frame.size == 0:
      continue

    output = io.BytesIO()

    image = Image.fromarray(frame)
    image.save(output, format='JPEG')
    print(output.getvalue())
    #print("-----fin-----")

    count += 1
    #image.save('img/back/' + str(count) + '-back.jpg', format='JPEG')

"""     file = open("img/testfile" + str(count) +".jpg", "w");
    file.write(output.getvalue())
    file.close()
    count += 1 """

"""     image.save('img/img' + str(count) + '.png')
    count += 1 """

def main():
    drone = tello.Tello('', 9999)
    videoLoop(drone)

if __name__ == "__main__":
    main()
