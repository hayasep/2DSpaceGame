const port = 3000;
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app)
const io = require('socket.io')(server, {
    cors: {
      origin: "http://localhost:${port}}",
      credentials: true
    }
  });

let players = [];


// Log user connection/ disconnection
io.on('connection', function (socket){
    console.log('User connected: ' + socket.id);

    // Add socket id to players list
    players.push(socket.id);

    // If player is first to connect, establish them as player 1
    if (players.length === 1) {
        io.emit('isPlayer1')
    }
    // If player is second to connect, establish them as player 2
    else if (players.length === 2) {
        io.emit('isPlayer2')
    }
    
    console.log(players)

    socket.on('disconnect', function () {
        console.log('User disconnected: ' + socket.id);
        players = players.filter(player => player !== socket.id); // Remove socket id from players list
    })
});

// Log server has started
server.listen(port, function () 
{
    console.log('Listening on port ' + port)
})