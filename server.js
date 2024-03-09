const port = 3000;
const http = require('http');
const express = require('express');
const app = express();
// const server = http.createServer(app)
const server = http.Server(app)
const io = require('socket.io')(server, {
    cors: {
      origin: "http://localhost:${port}}",
      credentials: true
    }
  });


var players = {};

// Log user connection/ disconnection
io.on('connection', function (socket){
    console.log('User connected: ' + socket.id);

    // Add socket id to players list

    players[socket.id] = {
        rotation: 0,
        x: 400,
        y: 400,
        playerId: socket.id,
        score: 0
    }
    // players.push(socket.id);
    console.log(players);

    socket.emit('currentPlayers', players);
    socket.emit('updateScore',players[socket.id].score);
    socket.broadcast.emit('newPlayer', players[socket.id]);



    socket.on('disconnect', function () {
        console.log('User disconnected: ' + socket.id);
        delete players[socket.id];
        socket.disconnect(socket.id);
        // players = players.filter(player => player !== socket.id); // Remove socket id from players list
    })

    socket.on('playerMovement', function (movementData) {
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].rotation = movementData.rotation;
        // emit a message to all players about the player that moved
        socket.broadcast.emit('playerMoved', players[socket.id]);
      });

    socket.on('asteroidHit', function () {
        players[socket.id].score +=10;
        io.emnit('updateScore',players[socket.id].score)
    })


});

// Log server has started
server.listen(port, function () 
{
    console.log('Listening on port ' + port)
})