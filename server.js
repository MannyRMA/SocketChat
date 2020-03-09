/* 
Server side js for the chat application assignment
Manuel Rodriguez
SENG 513 Assignment 3
*/

let express = require('express');
let app = express();
let server = require('http').createServer(app);
let io = require('socket.io').listen(server);

let cookie = require('cookies');
let cookieParser = require('cookie-parser');

let users = [];
let connections = [];
let allMessages = [];
let colors = [];

server.listen(process.env.port || 3000);
console.log("server running on local host 3000......");

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.use(cookieParser());

io.sockets.on('connection', function(socket){
    connections.push(socket);
    console.log("Connected a socket: %s sockets connected", connections.length);
    
    socket.on('new user', function(name){
        socket.username = name;
        users.push(name);
        colors.push('black');
        updateUsername();
        socket.emit('change name', name);
    });
    

    socket.emit('load messages', allMessages);


    let time = getCurrentTime();

    // DISCONNECT
    socket.on('disconnect', function(data){
        let index = users.indexOf(socket.username);
        users.splice(index, 1);
        updateUsername();
        connections.splice(connections.indexOf(socket), 1);
        console.log("disconnected a socket: %s sockets connected", connections.length);
    });

    // POSTING A NEW MESSAGE
    socket.on('send message', function(data){
        let msgWords = data.split(" ");
        let codeWord = msgWords[0];
        let index = users.indexOf(socket.username);
        let newColour = "blue";
        // Checking to see if user wants to change name
        if(codeWord === "/nick")
        {
            let newName = msgWords[1];
            if(!users.includes(newName))
            {
                socket.emit('change name', newName);
                users[index] = newName;
                socket.username = newName;
                updateUsername();
            }
            else
            {
                console.log("name exists");
                data = "tried to change to a name that already exists :(";
            }
        }

        // checking to see if user wants to change colour
        else if(codeWord === "/nickcolor")
        {
            let redVal = parseInt(msgWords[1]);
            let greenVal = parseInt(msgWords[2]);
            let blueVal =  parseInt(msgWords[3]); 
            if((redVal < 0) || (greenVal < 0) || (blueVal < 0) || (redVal > 255) || (greenVal > 255) || (blueVal > 255))
            {
                console.log("illegal value for changing the colour");
                data = "error in attempt to change colour";
            }
            else
            {
                newColour = "rgb(" + redVal + ", " + greenVal + ", " + blueVal + ")";
                colors[index] = newColour;
            }
        }

        let messageContent = '<div class="well">(' + time +') ' + socket.username + ': ' + data +'</div>';
        allMessages.push(messageContent);

        io.sockets.emit('send message', data, time, users[index], colors[index]);

    });

    
});

// update the username list
function updateUsername()
{
    io.sockets.emit('get users', users);
}


// function to get current time, code taken from:
// https://github.com/oscarvelez/seng513/blob/master/assignment3/index.js
function getCurrentTime() {
    let displayTime = "";
    let date = new Date();
    let hour = date.getHours();
    let minute = date.getMinutes();

    if(minute < 10)
    {
        minute = "0" + minute;
    }
    if (hour > 12){
        hour = hour -12;
        displayTime = hour + ":" + minute + "pm";
    }
    else{
        displayTime = hour + ":" + minute + "am";
    }
    return displayTime;
}
