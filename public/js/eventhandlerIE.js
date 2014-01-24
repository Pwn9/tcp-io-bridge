/*** 

    tcp-io-bridge "Event Handler" : By Matthew Sudol aka tREMor(admin@pwn9.com) 
    
    Notice: This code is free to test, modify and use as long as this notice 
    remains intact. This code may not be used for commercial purposes without 
    the authors express, written consent.
    
***/

/*** EVENT HANDLING FUNCTIONS ***/

/* CANVAS RESIZED */
function resizeCanvas() {                                           // always keep canvas full size (for now)
    var B = document.body;
    var D = document.documentElement;
    var windowWidth = Math.max(D.clientWidth, B.clientWidth);
    var windowHeight = Math.max(D.clientHeight, B.clientHeight);  
    canvas.width = windowWidth;
    canvas.height = windowHeight;
    var message = canvasSize + canvas.width + ',' + canvas.height;
    socket.emit('canvasEvent', message);    
    if (debug(1)) { console.log("[INFO] Canvas size: " + canvas.width + " x " + canvas.height);  } 
}

/* MOUSE MOVED */
function mouseMoved(e) {                                             // run when mouse mouse event fires
    mousePos = getMousePos(canvas, e);
    var message = mouseMove + mousePos.x + ',' + mousePos.y;
    socket.emit('canvasEvent', message);
}

/* MOUSE DOWN */
function mouseClickDown(e) {
    if (e.button === 2) {                                               // right click
        var message = mouseRightDown + mousePos.x + ',' + mousePos.y;
        socket.emit('canvasEvent', message);    
    }
    else {                                                              // left click 
        if (captureDouble) {                                            // capture doubles if true 
            if (downclickTimer) {                                       // is double                                  
                clearTimeout(downclickTimer);
                downclickTimer = null;
                var message = mouseDoubleDown + mousePos.x + ',' + mousePos.y;   
                socket.emit('canvasEvent', message);            
            }
            else {                                                      // is single
                downclickTimer = setTimeout(function(e){
                    downclickTimer = null;
                    var message = mouseDown + mousePos.x + ',' + mousePos.y;
                    socket.emit('canvasEvent', message);           
                }, doubleClickThreshold);
            }        
        }
        else {                                                          // capture double is false, send all clicks as singles (default)
            var message = mouseDown + mousePos.x + ',' + mousePos.y;
            socket.emit('canvasEvent', message); 
        }
    }
}

/* MOUSE UP */
function mouseClickUp(e) {
    if (e.button === 2) {                                               // right click
        var message = mouseRightUp + mousePos.x + ',' + mousePos.y;
        socket.emit('canvasEvent', message);    
    }   
    else {                                                              // left click        
        if (captureDouble) {                                            // capture doubles if true         
            if (downclickTimer) {                                       // is double                                  
                clearTimeout(downclickTimer);
                downclickTimer = null;
                var message = mouseDoubleUp + mousePos.x + ',' + mousePos.y;   
                socket.emit('canvasEvent', message);            
            }          
            else {                                                      // is single
                downclickTimer = setTimeout(function(e){
                    downclickTimer = null;
                    var message = mouseUp + mousePos.x + ',' + mousePos.y;
                    socket.emit('canvasEvent', message);           
                }, doubleClickThreshold);
            }        
        }    
        else {                                                          // capture double is false, send all clicks as singles (default)
            var message = mouseUp + mousePos.x + ',' + mousePos.y;
            socket.emit('canvasEvent', message); 
        }
    }
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

                                                   
    window.attachEvent('onresize', resizeCanvas);                       // resize window

/*** MOUSE EVENT HANDLING ***/

    canvas.attachEvent('onmousemove', mouseMoved);                      // mouse move

    canvas.attachEvent('onmousedown', mouseClickDown);                  // mouse down

    canvas.attachEvent('onmouseup', mouseClickUp);                      // mouse up

    canvas.attachEvent('oncontextmenu', function(e) {                  // cancel the right click context menu
        if (e.button === 2) {
            return false;
        }
    });   

/*** KEY EVENT HANDLING ***/

pagebody.attachEvent('onkeydown', function(e) {                      // keydown event
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
}, false);

pagebody.attachEvent('onkeyup', function(e) {                          // keyup event
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
}, false);