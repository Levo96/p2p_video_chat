require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const http = require("http").createServer(app);
const io = require('socket.io')(http);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.route('*').get((req, res)=> {
  res.sendFile(__dirname + '/views/index.html');
});

let roomLog = {};

io.on('connection', socket => {

  socket.on('createRoom', (data) => {
    let roomName = data["roomName"];

    if(roomLog[roomName])
    {
      socket.emit("roomExists", roomName);
      return;
    }

    let peerID = data["peerID"];
    let socketID = socket.id;

    roomLog[roomName] = {peerIDs:[peerID], socketIDs: [socketID]};
    socket.join(roomName);
    io.in(roomName).emit("userJoined", {roomName: roomName, roomLog: roomLog[roomName]});
    io.in(roomName).emit("readyForCall");
  });

  socket.on('enterRoom', data => {
    let roomName = data["roomName"];
    let peerID = data["peerID"];
    let socketID = socket.id;
    let socket_room_obj = io.sockets.adapter.rooms.get(roomName);
    let clients = 0;
    if(socket_room_obj)
    {
      clients = io.sockets.adapter.rooms.get(roomName).size;
      if(clients == 0)
      {
          socket.emit('room empty');
          return;
      }
      else if(clients > 1)
      {
        socket.emit('room is full');
        return;
      }
      else
      {
        roomLog[roomName]["peerIDs"].push(peerID);
        roomLog[roomName]["socketIDs"].push(socketID);
        socket.join(roomName);
        io.in(roomName).emit("userJoined", {roomName: roomName, roomLog: roomLog[roomName]});
        io.in(roomName).emit("callUserOne", roomLog[roomName]["peerIDs"][0]);
      }
    }
    else
    {
      socket.emit('room not found');
      return;
    }
  });

  socket.on("textMessage", data => {
    let roomName = data["roomName"];
    let message = data["message"];
    io.in(roomName).emit("message", message);
  });

  socket.on("leaving", data => {
    let roomName = data;
    let currentSocket = socket.id;
    let indexOfCurrentSocket = roomLog[roomName]["socketIDs"].indexOf(currentSocket);
    if(indexOfCurrentSocket == 0)
    {
      roomLog[roomName]["socketIDs"].shift();
      roomLog[roomName]["peerIDs"].shift();
    }
    if(indexOfCurrentSocket == 1)
    {
      roomLog[roomName]["socketIDs"].pop();
      roomLog[roomName]["peerIDs"].pop();
    }
    socket.emit("cleanUpPage");
    socket.leave(roomName);
    io.in(roomName).emit("userLeftRoom",{roomName: roomName, roomLog: roomLog[roomName]});
  });

  socket.on("reDirectUser", (data)=> {
    let roomName = data;
    io.in(roomName).emit("readyForCall");
  });

});//end of connection

let port = process.env.PORT || 5000;

http.listen(port, ()=> {
  console.log('Listening on port: ' + port);
});
