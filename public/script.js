
  let constraints = {video: true, audio: true};
  let roomLog = {};
  // -------------------- HOME PAGE --------------------
  let socket = io("/");
  //https://videoroomp2p.herokuapp.com/
  let localPeer = new Peer();

  localPeer.on('open', (id)=> {
    peerID = id;
  });

  let to_createRoomBtn = document.getElementById("to_createRoomBtn");
  let to_joinRoomBtn = document.getElementById("to_joinRoomBtn");
  let createRoomBtn = document.getElementById('createRoomBtn');
  let joinRoomBtn = document.getElementById('joinRoomBtn');
  let backBtn_crc = document.getElementById('cr_back_btn');
  let backBtn_jrc = document.getElementById('jr_back_btn');
  let message_input_element = document.getElementById("chat_input");
  let sendBtn = document.getElementById("sendBtn");

  let homePageContainer = document.getElementById("home_page_container");
  let optionBtnsContainer = document.getElementById("to_optionBtn_container");
  let createRoomContainer = document.getElementById("to_createRoom_container");
  let joinRoomContainer = document.getElementById("to_joinRoom_container");
  let exitBtn = document.getElementById("exit_btn");

  let video_container = document.getElementById("video_page_container");
  let video_element = document.createElement("video");
  video_element.muted = true;

/* -------------------- FUNCS --------------- -------*/

  let addVideo = (video, stream) =>
  {
      video.srcObject = stream;
      video.addEventListener('loadedmetadata', ()=> {
        video.play();
      });
      $('#left_side_vp').prepend($(video));
  }

  let hasGetUserMedia = () =>
  {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

/* -------------------------------------------------*/

  //--------navigation -------------------
  $(createRoomContainer).hide();
  $(joinRoomContainer).hide();
  $(video_container).hide();

  $(to_createRoomBtn).on('click', ()=> {
    $(optionBtnsContainer).hide();
    $(createRoomContainer).fadeIn();
  });

  $(to_joinRoomBtn).on('click', ()=> {
    $(optionBtnsContainer).hide();
    $(joinRoomContainer).fadeIn();
  });

  $(backBtn_crc).on('click', ()=> {
    $(createRoomContainer).hide();
    $(optionBtnsContainer).fadeIn();
  });

  $(backBtn_jrc).on('click', ()=> {
    $(joinRoomContainer).hide();
    $(optionBtnsContainer).fadeIn();
  });
  /* ------------------Sending Input-------------------------- */
  $(createRoomBtn).on('click', ()=> {
    if($('#createRoom_roomname').val() != "")
    {
      let roomName =  $('#createRoom_roomname').val();
      roomName = String(roomName);
      if(peerID == ""){peerID=""}
      socket.emit('createRoom',{roomName: roomName, peerID: peerID});
      $('#createRoom_roomname').val("");
    }
  });

  $(joinRoomBtn).on('click', ()=> {
    if($("#joinRoom_roomname").val() != "")
    {
      let roomName = $("#joinRoom_roomname").val();
      roomName = String(roomName);
      if(peerID == ""){peerID = ""}
      socket.emit('enterRoom', {roomName: roomName, peerID: peerID});
      $("#joinRoom_roomname").val("");
    }
  });
  /*------------------ Handling Input ------------------------------ */
  socket.on("userJoined", data => {
    $(homePageContainer).hide();
    $(video_container).fadeIn();
    let roomName = data["roomName"];
    roomLog["roomName"] = roomName;
    roomLog["usersOBJ"] = data["roomLog"];
    $("#room_info").text(`room: ${roomName}`);
    $("#chat_box").append(`<div><p>user joined room</p></div>`);
  });

  $(sendBtn).on('click', ()=> {
    if($(message_input_element).val() != "")
    {
      let message = $(message_input_element).val();
      message = String(message);
      socket.emit("textMessage", {roomName: roomLog["roomName"], message: message});
      $(message_input_element).val("");
    }
  });

  socket.on("message", data => {
    $("#chat_box").append(`<div><p>${data}</p></div>`);
  });

  /* Errors when joining a room */
  socket.on("room not found", ()=> {
    alert("room not found");
  });

  socket.on("room empty", ()=> {
    alert("room empty");
  });

  socket.on("room is full", ()=> {
    alert("room full");
  });

  //----------Exit and Error -------------------------------
  $(exitBtn).on('click', ()=> {
    console.log("exiting User Stats");
    console.log(roomLog["roomName"], roomLog["usersOBJ"]);
    socket.emit('leaving', roomLog["roomName"]);
    localPeer.close();
  });

  socket.on("user_left", ()=> {
    $("#chat_box").append(`<div><p>user left room</p></div>`);
  });

  socket.on('cleanUpPage', ()=> {
    $("#chat_box").empty();
    $(video_page_container).hide();
    $(homePageContainer).fadeIn();
  });

  // ------------------------ video ---------------------------
  socket.on("readyForCall", ()=> {
    $('#left_side_vp').empty();
    if(hasGetUserMedia())
    {
      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        addVideo(video_element, stream);

        localPeer.on('call', call => {
          call.answer(stream);
          const video = document.createElement('video');
          call.on('stream', remoteStream => {
            addVideo(video, remoteStream);
          });
          call.on('close' , ()=> {
            video.remove();
          });
        });
      });
    }
  });



  socket.on("callUserOne", data => {
    if(hasGetUserMedia())
    {
      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        addVideo(video_element, stream);
        const call = localPeer.call(data, stream);
        const video = document.createElement('video');
        call.on('stream', remoteStream => {
          addVideo(video, remoteStream);
        });
        call.on('close' , ()=> {
          video.remove();
        });
      });
    }
  });


  socket.on("userLeftRoom", data => {
    roomLog["roomName"] = data["roomName"];
    roomLog["usersOBJ"] = data["roomLog"];
    $("#chat_box").append(`<div><p>user left room</p></div>`);
    socket.emit("reDirectUser", roomLog["roomName"]);
  });
