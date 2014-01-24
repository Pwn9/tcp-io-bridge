/*** 

    tcp-io-bridge "Canvas Client" : By Matthew Sudol aka tREMor(admin@pwn9.com) 
    
    Notice: This code is free to test, modify and use as long as this notice 
    remains intact. This code may not be used for commercial purposes without 
    the authors express, written consent.
    
***/

/*** FUNCTIONS ***/

var drawImg = function(format, xy, img) {                         // draw image to canvas
    var coords = xy.split(','); 
    var image = new Image();
    switch(format) {
        case "png":
            image.src = "data:image/png;base64," + img;
            break;
        case "jpg":
            image.src = "data:image/jpg;base64," + img;
            break;                     
        case "gif":
            image.src = "data:image/gif;base64," + img;
            break;            
    }

    image.onload = function() {                                     // required for IE, maybe can dump for others - but image needs to be loaded before it can be drawn
        if ((coords[2] > 0) && (coords[3] > 0)) {
            context.drawImage(image, coords[0], coords[1], coords[2], coords[3]); 
        }
        else {
            context.drawImage(image, coords[0], coords[1]);
        }
        //removed for now....  
        //if (debug(2)) { console.log("[DEBUG] Image drawn at: " + coords[0] + "," + coords[1]);   } 
        //image = null;
        //img = null
        //coords = null;
    }; 
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
        switch(opcode) {
            case "draw":
                drawImg.call(null, "png", parsed[1], parsed[2]);
                break;
            case "drawJpg":
                drawImg.call(null, "jpg", parsed[1], parsed[2]);
                break;
            case "drawGif":
                drawImg.call(null, "gif", parsed[1], parsed[2]);
                break;                  
            case "cursor":
                setCursor(parsed[1]);
                break;
            case "eval":
                doEval(parsed[1]);
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
    }
});

    /*** 
        POTENTIALLY CLEANUP BUFFER OVERRUN? 
        
        Or is socket.io leaking memory somewhere as well?
        
        How large should the buffer be?
        
        Does the protocol between socket.io - node server - tcp socket need to be blocking?
        
        Perhaps parsing the buffer asynchronously in it's own function in a setInterval like 
        earlier versions might work better?
        
        ughhh.. shoot me, I'm actually considering setInterval.
        
        Why is IE8 and IE9 dropping out at times? Probably the XHR polling, but flash sockets
        wont work in firewalls or load balancing scenarios...  decisions, decisions.
        
    ***/