/*** 

    tcp-io-bridge "App Config" : By Matthew Sudol aka tREMor(admin@pwn9.com) 
    
    Notice: This code is free to test, modify and use as long as this notice 
    remains intact. This code may not be used for commercial purposes without 
    the authors express, written consent.
    
***/

var config = {};

config.tcp = {};
config.tcp.host = "0.0.0.0";         // 0.0.0.0 will listen on all available 
config.tcp.port = 4001;

config.io = {};
config.io.port = 4000;
config.io.ssl = false;               // set to false to use plain http
config.io.express = true;            // only working with express right now, bugs in normal mode
config.io.loglevel = 1;              // set io logging level (default 1) - depecrated in socket.io 2?
config.io.transports = ["websocket", "flashsocket", "xhr-polling"];
config.io.authorization = false;    // deprecated in 2.0?
config.io.closetimeout = 60;
config.io.heartbeattimeout = 60;
config.io.heartbeatinterval = 25;
config.io.pollingduration = 20;

config.msg = {};
config.msg.begin = "@";              // Front delimiter for messages
config.msg.end = "|";                // Rear delimiter for messages

config.msg.tcp = {};
config.msg.tcp.header = "TCP CLIENT "
config.msg.tcp.connected = "CONNECTED: ";
config.msg.tcp.disconnected = "DISCONNECTED: ";
config.msg.tcp.noIO = " No IO Client found for this connection, closing. ";

config.msg.io = {};
config.msg.io.header = "WEB CLIENT "
config.msg.io.connected = "CONNECTED: ";
config.msg.io.disconnected = "DISCONNECTED: ";

config.logging = {};
config.logging.enabled = true;
config.logging.level = 1;           // set apps log level 0 = off, 1 = info, 2 = warn, 3 = debug

module.exports = config;