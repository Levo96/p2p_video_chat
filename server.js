require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const http = require("http").createServer(app);
const io = require('socket.io')(http);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.route('/').get((req, res)=> {
  res.sendFile(__dirname + '/views/index.html');
});

let users = 0;
let roomLog = {};


io.on('connection', socket => {

  socket.on('createRoom', (data) => {
    let roomName = data["roomName"];
    socket.rooms = roomName;
    socket.join(roomName);
    let socketUserID_ojb = {"user1" : socket.id};
    roomLog[roomName] = {userCount: 1, userIDs: [data["userID"]], socketIDs: [socketUserID_ojb]};
    io.in(roomName).emit("userJoined", {name: roomName, roomUserInfo: roomLog[roomName], user: 1});
  });

  socket.on('enterRoom', data => {
    let roomName = data["roomName"];
    let room = io.sockets.adapter.rooms.get(roomName);
    let clients = 0;
    if(room)
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
        socket.join(roomName);
        //roomLog[roomName] = {userCount: 1, userIDs: [socket.id]};
        roomLog[roomName]["userCount"] += 1;
        roomLog[roomName]["socketIDs"][0]["user2"] = socket.id;
        roomLog[roomName]["userIDs"].push(data["userID"]);
        io.in(roomName).emit("userJoined",{name: roomName, roomUserInfo: roomLog[roomName]});
        io.in(roomName).emit("userTwoConnected", roomLog[roomName]["userIDs"][0]);
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

  socket.on("leaving", (data)=> {
    console.log(roomLog);
    let roomName = data;
    io.in(roomName).emit("user_left");
    roomLog[roomName]["userCount"] -= 1;
    socket.emit('cleanUpPage');
    socket.leave(roomName);
  });
});//end of connection

let port = process.env.PORT || 5000;

http.listen(port, ()=> {
  console.log('Listening on port: ' + port);
});
