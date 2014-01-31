/*** 

    tcp-io-bridge "Canvas Client" : By Matthew Sudol aka tREMor(admin@pwn9.com) 
    
    Notice: This code is free to test, modify and use as long as this notice 
    remains intact. This code may not be used for commercial purposes without 
    the authors express, written consent.
    
***/

"use strict";

/*** FUNCTIONS ***/

function drawImg(xy, img) {                         // draw image to canvas
    var coords = xy.split(','); 
    image.onload = function() {                                     
        if ((coords[2] > 0) && (coords[3] > 0)) {
            context.drawImage(image, coords[0], coords[1], coords[2], coords[3]); 
        }
        else {
            context.drawImage(image, coords[0], coords[1]);
        }
        coords = null;
        img = null;
    }; 
    image.src = img;   
}; 

function clearCanvas() {                                            // clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    //canvas.width = canvas.width;             // see http://simonsarris.com/blog/346-how-you-clear-your-canvas-matters
};

function setCursor(cursorStyle) {                                   // change mouse cursor 
    canvas.style.cursor=cursorStyle;
    if (debug(1)) { console.log("[INFO] Received cursor change: " + cursorStyle); }
};

function doEval(code) {                                             // straight eval (remove for production, dangerous)
    eval(code);
    if (debug(1)) { console.log("[INFO] Received eval: " + code); }
};

/*** SOCKET RECEIVE ***/   

socket.on('ioLost', function(data) {                                    // Receive lost connection message
   alert(data);
   socket.disconnect();
});

socket.on('syncTcp', function (data) {                                  // sycnTcp received from tcpclient and forward to socket.io for handshake
    socket.emit('syncTcp', data);
    resizeCanvas();
});

socket.on('ioSend', function(data) {                                    // receive command from socket.io 
    
    var parsed = data.split(pd); 

    if (parsed.length == 3) {                       // make sure parse is legit; Opcode:args:data; otherwise something will be null   
        var opcode = parsed[0];
        var args1 = parsed[1];
        var args2 = parsed[2]
        
        switch(opcode) {
            case "draw":
                drawImg(args1, "data:image/png;base64," + args2);
                break;
            case "drawJpg":
                drawImg(args1, "data:image/jpg;base64," + args2);
                break;
            case "drawGif":
                drawImg(args1, "data:image/gif;base64," + args2);
                break;                  
            case "cursor":
                setCursor(args1);
                break;
            case "eval":
                doEval(args1);
                break;  
            case "ping":
                if (debug(1)) { console.log("[DEBUG] Ping received."); }
                break;                   
            case "clear":
                clearCanvas();
                break;     
            case "queryScreenSize":
                resizeCanvas();
                break;                  
        }

        opcode = null;
        args1 = null;
        args2 = null;
        parsed = null;
    }
    else {
        parsed = null;
    }
    
});