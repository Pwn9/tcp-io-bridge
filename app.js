/*** 

    tcp-io-bridge "NodeJS App" : By Matthew Sudol aka tREMor(admin@pwn9.com) 
    
    Notice: This code is free to test, modify and use as long as this notice 
    remains intact. This code may not be used for commercial purposes without 
    the authors express, written consent.
    
***/

/*** GLOBAL CONFIG ***/
var config = require('./config');                           // get configurations from /config.js

/*** GRAPHICS MAGIC - Maybe someday ***/
//var gm = require('gm');

/*** FILE SYSTEM ***/
var fs = require('fs');                                     // File system

/*** TCP SERVER ***/
var net = require('net');                                   // TCP only needs net

/*** IO SERVER ***/
if (config.io.express) {

    if (config.logging.level > 0) {
        console.log('Running node socket.io application with Express web server');
    }
    
    var express = require('express');                       // Gets the express prereq
    
    var app = express();                                    // Create instance of express as "app"
    
    if (config.io.ssl) {                                    // For SSL
        var options = {
                key: fs.readFileSync('key.pem'),
                cert: fs.readFileSync('cert.pem'),
                requestCert: true
            };
        var https = require('https');
        var ioserver = https.createServer(options, app);
    }
    else {                                                  // For plain http
        var http = require('http');
        var ioserver = http.createServer(app);        
    } 
    
    var io = require('socket.io').listen(ioserver);         // Binds socket.io as an express web server  
    
    app.get('/', function (req, res) {                      // routing for index and public folders
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        res.sendfile(__dirname + '/index.html');
    });
    
    app.use(express.static(__dirname + '/public'));         // Public directory for client side 
  
}
else {

    if (config.logging.level > 0) {
        console.log('Running node socket.io application on native web server');
    }
 
    if (config.io.ssl) {                                    // For SSL
        var options = {
                key: fs.readFileSync('key.pem'),
                cert: fs.readFileSync('cert.pem'),
                requestCert: true
            };
        var https = require('https');
        var ioserver = https.createServer(options, handler);
    }
    else {                                                  // For plain http
        var http = require('http');
        var ioserver = http.createServer(handler);        
    } 
    
    function handler (req, res) {                           // this will handle serving the index.html
      fs.readFile(__dirname + '/index.html',
      function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading index.html');
        }
        res.writeHead(200);
        res.end(data);
      });
    }    

    var io = require('socket.io').listen(ioserver);         // Binds socket.io that should be capable of running on Apache/Nginx/Xammp/etc  NOT WORKING YET
}

/*** Deployment Configuration variables for socket.io ***/  
io.disable('browser client cache');
io.enable('browser client minification');               // send minified client
io.disable('browser client etag');                       // apply etag caching logic based on version number - testing disable temporarily
//io.enable('browser client gzip');                       // suggested deployment setting but causes a crash
/*** User Configuration variables for socket.io ***/  
io.set('log level', config.io.loglevel);                // log level configurable from ./config.js
io.set('authorization', config.io.authorization);
io.set('close timeout', config.io.closetimeout);
io.set('heartbeat timeout', config.io.heartbeattimeout);
io.set('heartbeat interval', config.io.heartbeatinterval);
io.set('polling duration', config.io.pollingduration);
io.set('transports', config.io.transports);

/*** CLIENT STACK ***/
var tcpclients = [];                                        // Keep track of tcp connections
var ioclients = [];                                         // Keep track of socket.io connections

/*** INTERIM BUFFER ***/
var d1 = "@";                   // Front delimiter
var d2 = "|";                   // Rear delimiter
var pd = ":";                   // Command parse delimiter

/*** TCP SERVER ***/
var tcpserver = net.createServer(function (tcpsock) {
    
    tcpsock.name = tcpsock.remoteAddress + ':' + tcpsock.remotePort;        // give this connection a unique name using ip and port
    if (config.logging.level > 0) {    
        console.log(config.msg.tcp.header + config.msg.tcp.connected + tcpsock.name);   
    }
    tcpsock.connection = '';                                                // create empty sock argument for socket.io connection
    var webclient = {};                                                     // create an empty object for the web client that will be synced to this tcpclient for easier access
    var findclient = false;                                                 // For error checking
    
    // iterate the connected web clients to see if one is waiting
    for (i = 0; i < ioclients.length; i++) {
        if (ioclients[i].connection == '') {
            ioclients[i].connection = tcpsock.name;                         // give the web client a connection to this sock
            ioclients[i].iobuffer = '';
            tcpsock.connection = ioclients[i].id;                           // give this sock a connection to the web client
            ioclients[i].emit('syncTcp', tcpsock.name);                     // tell the socket.io to connect up to this tcp sock for this client
            webclient = ioclients[i];                                       // make this client this sockets webclient
            findclient = true;                                              // we found an open client, so set to true and break this loop, no need to search for more
            break;
        }
    }    
    
    // if no client was found, kill
    if (!findclient) {
        tcpsock.write(config.msg.begin + config.msg.tcp.header + config.msg.tcp.noIO + config.msg.end);
        if (config.logging.level > 0) {
            console.log(config.msg.tcp.header + tcpsock.name + config.msg.tcp.noIO);
        }
        tcpsock.destroy();                                                              // No web client available for this tcpsock, die.
    }
    
    // Put this new tcp client in the tcpclients object list
    tcpclients.push(tcpsock);

    // Add a 'data' event handler to this instance of socket and send to webclient if exists, otherwise kill tcpsock
    tcpsock.on('data', function(data) { 
        if (ioclients.indexOf(webclient) != -1) {
            var xdata = new Uint16Array(data);
            data = String.fromCharCode.apply(null, xdata);
            webclient.iobuffer = webclient.iobuffer + data;            
            var splitA = [];
            var splitB = [];
            while(webclient.iobuffer.indexOf(d1) != -1 && webclient.iobuffer.indexOf(d2) != -1)         // While loop reads buffer until there are no commands left to issue
            {
                splitA = webclient.iobuffer.split(d2);                  // Array with rear delimiter
                splitB = splitA[0].split(d1);           
                webclient.volatile.emit('ioSend', splitB[1]);           // This should be an @command
                splitA.shift();                                         // Shift array
                webclient.iobuffer = splitA.join(d2);                   // Update buffer from shifted array with rear delimiter
            } 
        }
        else {
            tcpsock.write(config.msg.begin + config.msg.tcp.noIO + config.msg.end);     
            if (config.logging.level > 0) {
                console.log(config.msg.tcp.header + tcpsock.name + config.msg.tcp.noIO);
            }
            tcpsock.destroy();                                                          // No web client available for this tcpsock, die.
        }
    });
    
    // Add a 'close' event handler to this instance of socket
    tcpsock.on('close', function(data) {
        tcpclients.splice(tcpclients.indexOf(tcpsock), 1);                               // remove this tcp client from the client list 
        if (config.logging.level > 0) {
            console.log(config.msg.tcp.header + config.msg.tcp.disconnected + tcpsock.name);
        }
        if (findclient) {
            webclient.emit('ioLost', 'Connection lost');
        }
    });
    
    // Handle abrupt TCP quit and other errors.
    tcpsock.on('error', function (err) {
        if (config.logging.level > 0) {
            console.error(err.stack);
        }
        tcpsock.destroy();                                                           // Destroy the sock
    });    
    
    // Handle abrupt TCP quit and other errors.  Which of these are needed?  
    tcpsock.on('uncaughtException', function(err) {
        if (config.logging.level > 0) {        
            console.log(err.stack);
        }
        tcpsock.destroy();                                                           // Destroy the sock
    });    
       
});

/*** IO SERVER ***/ 
io.sockets.on('connection', function (socket) {
    // identify
    socket.name = socket.id;
    socket.connection = '';
    
    // Put this new client in the list
    ioclients.push(socket);
    
    // Local client connects, send them a message and log it.
    if (config.logging.level > 0) {
        console.log(config.msg.io.header + config.msg.io.connected + socket.name);    
    }
    
    var tcpclient = {};
    // We need to abstract a TCP client for this web client when they sync
    socket.on('syncTcp', function (data) {
        var sync = false;
        if (config.logging.level > 0) {
            console.log('BEGIN SYNC FROM: ' + data); 
        }
        
        for (i = 0; i < tcpclients.length; i++) {                             // iterate through all the tcpclients
            if (tcpclients[i].connection == socket.name) {
                tcpclient = tcpclients[i];  
                sync = true;
                if (config.logging.level > 0) {
                    console.log('SYNC COMPLETED FROM: ' + socket.name + ' TO: ' + data);  
                }
                break;
            }
        }
        // this should almost never occur, it is very well handled elsewhere
        if (!sync) {
            if (config.logging.level > 0) {
                console.log('SYNC FAILED FROM: ' + socket.name + ' TO: ' + data);
            }
            socket.emit('ioLost', 'Failed to sync to backend');
        }
    });
    
    // Receives a message from client of the type 'ioClient'
    socket.on('ioClient', function (data) {
        if (tcpclients.indexOf(tcpclient) != -1) {                             // pass this on to the tcp client if one exists for this socket)     
            tcpclient.write(config.msg.begin + data + config.msg.end);
        } 
    });
    
    // Receives a message from client of the type 'canvasEvent'
    socket.on('canvasEvent', function (data) {
        if (tcpclients.indexOf(tcpclient) != -1) {                              // pass this on to the tcp client if one exists for this socket)
            tcpclient.write(config.msg.begin + data + config.msg.end);
        } 
    });
    
    // Receives a message from client of the type 'rcpt'
    socket.on('rcpt', function (data) {
        if (tcpclients.indexOf(tcpclient) != -1) {                              // pass this on to the tcp client if one exists for this socket)
            tcpclient.write(config.msg.begin + data + config.msg.end);
        } 
    });
    
    // Client disconnects and sends server 'disconnect' 
    socket.on('disconnect', function () {
        ioclients.splice(ioclients.indexOf(socket), 1);                         // Remove this socket/client from the user list
        if (config.logging.level > 0) {
            console.log(config.msg.io.header + config.msg.io.disconnected + socket.name);  
        }
    });
    
});    
     
/*** RUN THE SERVERS ***/ 
ioserver.listen(config.io.port);                                      // Run the IO Server
tcpserver.listen(config.tcp.port, config.tcp.host);                   // Run the TCP Server, Listen on our port and host.