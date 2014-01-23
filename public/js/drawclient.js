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
        context.drawImage(image, coords[0], coords[1]); 
        //removed for now....  
        //debug("[DEBUG] Image drawn at: " + coords[0] + "," + coords[1], 3);    
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
    debug("[INFO] Received cursor change: " + cursorStyle, 1);
};

function doEval(code) {                                             // straight eval (remove for production, dangerous)
    eval(code);
    debug("[INFO] Received eval: " + code, 1);
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
    if (safeBrowser) {                                                  // IE < 10 doesn't support Uint16Array
        var xdata = new Uint16Array(data);
        data = String.fromCharCode.apply(null, xdata);
        buffer = buffer + data;                                         // Update the buffer with most recent ioSend data  
    }
    else {                                                              // So we have to kludge this in ^ 
        var xdata = '';
        for (var i = 0; i < data.length; i++) {
            xdata += String.fromCharCode(data[i]);
        }
        buffer = buffer + xdata;                                         // Update the buffer with most recent ioSend data   
    }                                   
    //data = null;
    var splitA = [];
    var splitB = [];
    
    /*** REALLY NEED TO THINK ABOUT THIS... ARE WE GETTING BUFFER OVERRUN? ***/
    
    while(buffer.indexOf(d1) != -1 && buffer.indexOf(d2) != -1)         // While loop reads buffer until there are no commands left to issue
    //if(buffer.indexOf(d1) != -1 && buffer.indexOf(d2) != -1)         // While loop reads buffer until there are no commands left to issue    
    {
        splitA = buffer.split(d2);                  // Array with rear delimiter
        splitB = splitA[0].split(d1);           
        doParse.call(null, splitB[1]);              // This should be an @command
        //splitB = null;
        splitA.shift();                             // Shift array
        buffer = splitA.join(d2);                   // Update buffer from shifted array with rear delimiter
    } 
    
    //splitA = null;  
}); 

var doParse = function(parse) {
    var parsed = parse.split(pd); 
    //debug("[DEBUG] Parsing data: " + parsed[0] + "," + parsed[1], 3);
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
                debug("[DEBUG] Ping received.", 1);
                break;                   
            case "clear":
                clearCanvas();
                break;     
            case "queryScreenSize":
                resizeCanvas();
                break;                  
        }       
    }
    
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
    
    //parsed = null;   
    /*if (buffer.length > 512000) {
        buffer = "";
        debug("[BUFFER] Clearing buffer overrun.", 1);
    }*/
};  