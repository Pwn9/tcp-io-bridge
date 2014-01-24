import socket
from threading import Thread
import time
from PIL import Image
import numpy
from numpy import *
import base64
import io

output = io.StringIO()

# Create a TCP/IP socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Connect the socket to the port where the server is listening
server_address = ('127.0.0.1', 4001)

# Just print a little connecting message
print ('connecting to %s port %s' % server_address)

# Connect the socket
sock.connect(server_address)
 
# Set sleep time, allow for some network latency and slow browser rendering
sleep_time = .50


def firstFunction():
    msg = ('@clear:0:0|@queryScreenSize:0:0|@cursor:wait:0|')
    sock.sendall(msg.encode('utf-8;'))    
    time.sleep(sleep_time)  
    while True:  
        temp = ""        
        imarray = numpy.random.rand(360,360,3) * 255
        im = Image.fromarray(imarray.astype('uint8')).convert('RGBA')
        im.save('bigtemp.png')
        with open("bigtemp.png", "rb") as temp_file:
            temp = base64.b64encode(temp_file.read())
        msg = ('@draw:0,0:%s|' % (temp.decode('utf-8;')))  
        sock.sendall(msg.encode('utf-8;'))
        time.sleep(sleep_time)        

def secondFunction():
    global sleep_time
    while True:
        data = str(sock.recv(16))
        print ('receiving %s' % data)
        if data == "b'@KD:189|'":
            sleep_time = sleep_time - 0.05
            if sleep_time < 0.05:
                sleep_time = 0.05
        if data == "b'@KD:187|'":
            sleep_time = sleep_time + 0.05            
        if data == "b'@KD:173|'":
            sleep_time = sleep_time - 0.05
            if sleep_time < 0.05:
                sleep_time = 0.05
        if data == "b'@KD:61|'":
            sleep_time = sleep_time + 0.05   
        time.sleep(0.01)
        

t1 = Thread(target = firstFunction)
t2 = Thread(target = secondFunction)

t1.start()
t2.start()
t1.join()
t2.join()

    
    