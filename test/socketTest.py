import socket
#import random
from threading import Thread
import time

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

# Setup for loops
def my_range(start, end, step):
    while start <= end:
        yield start
        start += step

def firstFunction():
    while True:             
        for y in my_range(0, 640, 40):
                for x in my_range(0, 1280, 40):
                    msg = ('@ping:0:0|')
                    sock.sendall(msg.encode('utf-8;'))
                    time.sleep(sleep_time)        

def secondFunction():
    global sleep_time
    while True:
        data = str(sock.recv(16))
        print ('receiving %s' % data)
        if data == "b'@KD:189|'":
            sleep_time = sleep_time - 0.01
            if sleep_time < 0.01:
                sleep_time = 0.01
        if data == "b'@KD:187|'":
            sleep_time = sleep_time + 0.01            
        if data == "b'@KD:173|'":
            sleep_time = sleep_time - 0.01
            if sleep_time < 0.01:
                sleep_time = 0.01
        if data == "b'@KD:61|'":
            sleep_time = sleep_time + 0.01   
        time.sleep(0.01)
        

t1 = Thread(target = firstFunction)
t2 = Thread(target = secondFunction)

t1.start()
t2.start()
t1.join()
t2.join()

    
