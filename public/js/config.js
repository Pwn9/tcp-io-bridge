/*** 

    tcp-io-bridge "Client Config" : By Matthew Sudol aka tREMor(admin@pwn9.com) 
    
    Notice: This code is free to test, modify and use as long as this notice 
    remains intact. This code may not be used for commercial purposes without 
    the authors express, written consent.
    
***/

"use strict";

/*** GLOBAL CONFIG ***/
var log = 3;                            // 0 = none, 1 = info, 2 = full, 3 = debug

/*** IO CLIENT ***/
var isSSL = false;                      // Use SSL?
var ip = "127.0.0.1";                // Server IP - Set this to the IP/DNS of the host machine so the client knows where to connect via socket.io
                                        // It would be really cool if we could serve this up dynamically somehow so it doesn't need to be configured
var port = "4000";                      // Server Port
if (isSSL) {
    var socket = io.connect('https://'+ ip +':'+ port, {
        'sync disconnect on unload' : true, 
        'reconnect': false,
        'secure': true
    });
}
else {
    var socket = io.connect('http://'+ ip +':'+ port, {
        'sync disconnect on unload' : true,
        'reconnect': false
    });
}
/*** MOUSE HANDLING CONFIG ***/
var captureDouble = false;              // By default just send mousedown and mouseup without double click handling
var doubleClickThreshold = 200;         // How fast for double click if true (the lower the better or else there will be single click delay)
var downclickTimer;                     // Dbl click timer for down
var upclickTimer;                       // Dbl click timer for up
var mousePos;                           // Keep track of mouse position at all times
var mouseCursor;                        // Handle mouse cursor style

/*** KEYBOARD HANDLING CONFIG ***/
var keyRepeat = [];                     // Map to handle key repeating on/off (set key to true to make it not repear)
keyRepeat[16] = true;   // shift
keyRepeat[17] = true;   // ctrl
keyRepeat[20] = true;   // capslock
var heldDown = [];                      // Map keys that are being held down 

/*** MOUSE EVENT MESSAGING CONFIG ***/
var mouseMove = "MM:";
var mouseRightDown = "RD:";
var mouseRightUp = "RU:";
var mouseDoubleDown = "DD:";
var mouseDoubleUp = "DU:";
var mouseDown = "MD:";
var mouseUp = "MU:";

/*** KEYBOARD EVENT MESSAGING CONFIG ***/
var keyDown = "KD:";
var keyUp = "KU:";

/*** CANVAS RESIZE EVENT MESSAGING CONFIG ***/
var canvasSize = "CS:";

/*** BUFFER FOR IO SEND - DO NOT EDIT ***/
var buffer = '';                // Buffer variable - no longer needed
var d1 = "@";                   // Front delimiter
var d2 = "|";                   // Rear delimiter
var pd = ":";                   // Command parse delimiter

/*** GLOBAL IMAGE OBJECT? ***/
var image = new Image();

/*** BROWSER STUFF DONT EDIT ***/
var userNav = navigator.userAgent.toLowerCase();

var IEVer = parseInt(userNav.split('msie')[1]);

if ((typeof IEVer === "undefined") || (IEVer == null) || (isNaN(IEVer))) {
    if (userNav.indexOf("firefox")) {
        IEVer = 9997;
    }
    else if (userNav.indexOf("chrome")){
        IEVer = 9998;
    }
    else  {
        IEVer = 9999;
    }  
}

if (debug(2)) {  console.log("User Agent: "+ userNav); }

if (IEVer < 10) {               // we can do this better in the future.
    var safeBrowser = false;
}
else {
    var safeBrowser = true;
}

/*** DEBUG LOGGING FUNCTION ***/
function debug(level) {                            // this is not as clean but it uses less memory
    if (log >= level) {
        if (window.console && window.console.log) {
           return true;
        } 
        else { 
            return false;
        }
    }
    else {
        return false;
    }
}