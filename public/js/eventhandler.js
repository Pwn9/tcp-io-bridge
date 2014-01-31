/*** 

    tcp-io-bridge "Event Handler" : By Matthew Sudol aka tREMor(admin@pwn9.com) 
    
    Notice: This code is free to test, modify and use as long as this notice 
    remains intact. This code may not be used for commercial purposes without 
    the authors express, written consent.
    
***/

"use strict";

/*** EVENT HANDLING FUNCTIONS ***/

/* CANVAS RESIZED */
function resizeCanvas() {                                           // always keep canvas full size (for now)
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var message = canvasSize + canvas.width + ',' + canvas.height;
    socket.emit('canvasEvent', message);    
    if (debug(1)) { console.log("[INFO] Canvas size: " + canvas.width + " x " + canvas.height);  }
    message = null;
}

/* MOUSE MOVED */
function mouseMoved(e) {                                             // run when mouse mouse event fires
    mousePos = getMousePos(canvas, e);
    var message = mouseMove + mousePos.x + ',' + mousePos.y;
    socket.emit('canvasEvent', message);
    message = null;
}

/* MOUSE DOWN */
function mouseClickDown(e) {
    e.preventDefault(); 
    var message;
    if (e.button === 2) {                                               // right click
        message = mouseRightDown + mousePos.x + ',' + mousePos.y;
        socket.emit('canvasEvent', message);    
    }
    else {                                                              // left click 
        if (captureDouble) {                                            // capture doubles if true 
            if (downclickTimer) {                                       // is double                                  
                clearTimeout(downclickTimer);
                downclickTimer = null;
                message = mouseDoubleDown + mousePos.x + ',' + mousePos.y;   
                socket.emit('canvasEvent', message);            
            }
            else {                                                      // is single
                downclickTimer = setTimeout(function(e){
                    downclickTimer = null;
                    message = mouseDown + mousePos.x + ',' + mousePos.y;
                    socket.emit('canvasEvent', message);           
                }, doubleClickThreshold);
            }        
        }
        else {                                                          // capture double is false, send all clicks as singles (default)
            message = mouseDown + mousePos.x + ',' + mousePos.y;
            socket.emit('canvasEvent', message); 
        }
    }
    message = null;
}

/* MOUSE UP */
function mouseClickUp(e) {
    e.preventDefault(); 
    var message;
    if (e.button === 2) {                                               // right click
        message = mouseRightUp + mousePos.x + ',' + mousePos.y;
        socket.emit('canvasEvent', message);    
    }   
    else {                                                              // left click        
        if (captureDouble) {                                            // capture doubles if true         
            if (downclickTimer) {                                       // is double                                  
                clearTimeout(downclickTimer);
                downclickTimer = null;
                message = mouseDoubleUp + mousePos.x + ',' + mousePos.y;   
                socket.emit('canvasEvent', message);            
            }          
            else {                                                      // is single
                downclickTimer = setTimeout(function(e){
                    downclickTimer = null;
                    message = mouseUp + mousePos.x + ',' + mousePos.y;
                    socket.emit('canvasEvent', message);           
                }, doubleClickThreshold);
            }        
        }    
        else {                                                          // capture double is false, send all clicks as singles (default)
            message = mouseUp + mousePos.x + ',' + mousePos.y;
            socket.emit('canvasEvent', message); 
        }
    }
    message = null;
}

/* GET MOUSE POSITION */
function getMousePos(canvas, evt) {                                  // canvas mouse positioning.
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

/*** WINDOW HANDLING ***/                                                           
window.addEventListener('resize', resizeCanvas, false); 

/*** MOUSE EVENT HANDLING ***/
canvas.addEventListener('mousemove', mouseMoved, false); 

canvas.addEventListener('mousedown', mouseClickDown, false);         // mouse down  
  
canvas.addEventListener('mouseup', mouseClickUp, false);             // mouse up

canvas.addEventListener('contextmenu', function(e) {                 // cancel the right click context menu
    if (e.button === 2) {
        e.preventDefault();     
        return false;
    }
}, false);

/*** KEY EVENT HANDLING ***/
if (IEVer == 11) {                                                          // Seriously? fuck microsoft, IE11 requires listener on document for keydown
    document.addEventListener('keydown', function(e) {                      // keydown event
        e.preventDefault();
        //e = e || window.event;
        var code = e.charCode;
        if (code == undefined || code === 0) {
            code = e.keyCode || e.which;
        }
        if (keyRepeat[code] && !heldDown[code]) {                           // add this key to the heldDown mapping
            heldDown[code] = true;
            var message = keyDown + code;
            socket.emit('canvasEvent', message);
        }
        if (!keyRepeat[code]) {                                             // repeating key allowed, send it
            var message = keyDown + code;
            socket.emit('canvasEvent', message);    
        }
        code = null;
        message = null;        
    }, false);

    document.addEventListener('keyup', function(e) {                        // keyup event
        e.preventDefault();
        //e = e || window.event;
        var code = e.charCode;
        if (code == undefined || code === 0) {
            code = e.keyCode || e.which;
        }   
        if (keyRepeat[code]) {                                              // release key if its a non repeating key
            heldDown[code] = false;
        }
        var message = keyUp + code;
        socket.emit('canvasEvent', message);
        code = null;
        message = null;        
    }, false);    
}
else {                                                                      // Intelligently designed browsers, which amazingly inclue IE10
    window.addEventListener('keydown', function(e) {                        // keydown event
        e.preventDefault();
        e = e || window.event;
        var code = e.charCode;
        if (code == undefined || code === 0) {
            code = e.keyCode || e.which;
        }
        if (keyRepeat[code] && !heldDown[code]) {                           // add this key to the heldDown mapping
            heldDown[code] = true;
            var message = keyDown + code;
            socket.emit('canvasEvent', message);
        }
        if (!keyRepeat[code]) {                                             // repeating key allowed, send it
            var message = keyDown + code;
            socket.emit('canvasEvent', message);    
        }
        code = null;
        message = null;        
    }, false);

    window.addEventListener('keyup', function(e) {                          // keyup event
        e.preventDefault();
        e = e || window.event;
        var code = e.charCode;
        if (code == undefined || code === 0) {
            code = e.keyCode || e.which;
        }   
        if (keyRepeat[code]) {                                              // release key if its a non repeating key
            heldDown[code] = false;
        }
        var message = keyUp + code;
        socket.emit('canvasEvent', message);
        code = null;
        message = null;
    }, false);

    window.addEventListener('keypress', function(e) {                        // keyup event
        e.preventDefault();
        // consider keypress handling in the future, for now just prevent default
    }, false);
}
