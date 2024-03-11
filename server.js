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

var asteroidCount = 0; // track the number of active asteroids
var asteroidPoints = 10; // Points gained by hitting asteroid
var asteroidDamage = 5; // HP lost in asteroid collision
var asteroidID = 1; // Create a unique to track asteroids
var bulletId = 1; // Create unique id to track bullets
var bulletDamage = 10; // Amoung of damage taken from being hit by bullet
var healthPackCount = 0; // Track number of health packs
var healthPackId = 1; // Create unique id for health packs
var healthPackHealing = 20; // Amount of HP a health pack restores

// Log user connection/ disconnection
io.on('connection', function (socket){
    console.log('User connected: ' + socket.id);

    // Add socket id to players list

    players[socket.id] = {
        rotation: 0,
        x: 600,
        y: 600,
        playerId: socket.id,
        score: 0,
        health: 100
    }
    // console.log(players);

    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', players[socket.id]);


    socket.on('disconnect', function () {
        console.log('User disconnected: ' + socket.id);
        delete players[socket.id];
        socket.disconnect(socket.id);
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
        io.emit('updateScore',players[socket.id].score)
    })

    if (Object.keys(players).length > 1) {
        // Wait until second player has joined to create asteroids and health packs. 
        // This ensures that asteroids positions arecommon between the two players
        const intervalId = setInterval(() =>{
            if (asteroidCount < 4) { // Set limit for number of asteroids in play at time
                var asteroid = {
                    x: Math.floor(Math.random()*1200),
                    y: -50,
                    velocityX: Math.floor(Math.random()*100) - 50,
                    velocityY: Math.floor(Math.random()*100) + 50,
                    id: asteroidID
                };
                io.emit('createAsteroid', asteroid); // Emits create asteriod event to client
                asteroidCount ++;
                asteroidID ++;
            }
            else {clearInterval(intervalId)};


        },1000) // 1s between asteroid creation


        const intervalId2 = setInterval(() =>{
            if (healthPackCount < 2) { // Set limit for number of health packs in play at time
                var healthPack = {
                    x: Math.floor(Math.random()*1200),
                    y: Math.floor(Math.random()*900),
                    id: healthPackId
                };
                io.emit('createHealthPack', healthPack, healthPackId); // Emits create health pack event to client
                healthPackCount ++;
                healthPackId ++;
            }
            else {clearInterval(intervalId2)};


        },10000) // 10s between health pack creation
    }


    socket.on('shipAsteroidCollision', function (playerId, asteroidId) {

        players[playerId].health -= asteroidDamage
        var health = players[playerId].health
        // console.log('Removing asteroid ' + asteroidId)
        io.emit('removeAsteroid', asteroidId)
        // console.log('Player hit: ' + playerId)
        io.emit('updateHealth', playerId, health)

        // Create new asteroid
        var asteroid = {
            x: Math.floor(Math.random()*1200),
            y: -50,
            velocityX: Math.floor(Math.random()*100) - 50,
            velocityY: Math.floor(Math.random()*100) + 50,
            id: asteroidID
        };
        io.emit('createAsteroid', asteroid); // Emits create asteriod event to client
        asteroidID ++;
    })

    socket.on('shootBullet', function (bulletInfo){
        io.emit('createBullet', bulletInfo, bulletId);
        bulletId ++;
    })

    socket.on('bulletAsteroidCollision', function (playerId, bulletId, asteroidId)
    {
        players[playerId].score += asteroidPoints; // Update player score
        var score = players[playerId].score
        io.emit('removeAsteroid', asteroidId);
        io.emit('removeBullet', bulletId);
        io.emit('updateScore', playerId, score)

        // Create new asteroid
        var asteroid = {
            x: Math.floor(Math.random()*1200),
            y: -50,
            velocityX: Math.floor(Math.random()*100) - 50,
            velocityY: Math.floor(Math.random()*100) + 50,
            id: asteroidID
        };
        io.emit('createAsteroid', asteroid); // Emits create asteriod event to client
        asteroidID ++;

    })

    socket.on('bulletPlayerCollision', function (shooterId, bulletId, opponentId){
        if (shooterId !== opponentId) { // Don't damage health if collision if from user's own bullet
            players[opponentId].health -= bulletDamage;
        }
        health = players[opponentId].health;
        io.emit('removeBullet', bulletId);
        io.emit('updateHealth', opponentId, health) 
    });

    socket.on('playerHealthPackOverlap', function (playerId, healthPackId){
        players[playerId].health = Math.min(players[playerId].health + healthPackHealing, 100); // Add health pack to HP up to max of 100
        health = players[playerId].health;
        io.emit('updateHealth', playerId, health);
        io.emit('removeHealthPack', healthPackId);
        healthPackCount -= 1;
    });

    socket.on('gameOverScore', function(winnerId){
        io.emit('endGameScore', winnerId)
    })


    socket.on('gameOverHealth', function(loserId){
        io.emit('endGameHealth', loserId)
    })


    })
    

    





// Log server has started
server.listen(port, function () 
{
    console.log('Listening on port ' + port)
})