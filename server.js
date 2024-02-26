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

// Log user connection/ disconnection
io.on('connection', function (socket){
    console.log('User connected: ' + socket.id);
    
    socket.on('disconnect', function () {
        console.log('User disconnected: ' + socket.id);
    })
});
// Log server has started
server.listen(port, function () 
{
    console.log('Listening on port ' + port)
})