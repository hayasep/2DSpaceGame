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

    var index = players.indexOf(socket.id)

    // If player is first to connect, establish them as player 1
    if (index === 0) {
        io.emit('isPlayer1')
    }
    // If player is second to connect, establish them as player 2
    else if (index === 1) {
        io.emit('isPlayer2')
    }
    
    console.log(players)

    socket.on('disconnect', function () {
        console.log('User disconnected: ' + socket.id);
        players = players.filter(player => player !== socket.id); // Remove socket id from players list
    })

    // socket.on('player1Movement', function (movementData) {
    //     // players[socket.id].x = movementData.p1X;
    //     // players[socket.id].y = movementData.p1Y;
    //     // players[socket.id].rotation = movementData.p1R;
    //     // emit a message to all players about the player that moved
    //     socket.broadcast.emit('player1Moved', movementData);
    //   });



});

// Log server has started
server.listen(port, function () 
{
    console.log('Listening on port ' + port)
})