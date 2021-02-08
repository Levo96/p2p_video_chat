window.onload = () =>
{
  let constraints = {video: true, audio: true};
  let peerID = "";
  let roomLog = {};
  // -------------------- home page --------------------
  let socket = io("https://videoroomp2p.herokuapp.com/");

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
  let vid_div = document.getElementById("first_user");
  let vid_div2 = document.getElementById("second_user");

  const addVideo = (video, stream) =>
    {
      video.srcObject = stream;
      video.addEventListener('loadedmetadata', ()=> {
        video.play();
      });
      $(vid_div).append($(video));
  }

  const addRemoteVideo = (video, stream) =>
  {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', ()=> {
      video.play();
    });
    $(vid_div2).append($(video));
  }

  let hasGetUserMedia = () =>
  {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  //navigation -------------------
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
  /* -------------------------------------------- */
  $(createRoomBtn).on('click', ()=> {
    let roomName;
    if($('#createRoom_roomname').val() != "")
    {
      roomName =  $('#createRoom_roomname').val();
      if(peerID == ""){peerID=""}
      socket.emit('createRoom',{roomName: roomName, userID: peerID});
      $('#createRoom_roomname').val("");
    }
  });

  $(joinRoomBtn).on('click', ()=> {
    let roomName;
    if($("#joinRoom_roomname").val() != "")
    {
      roomName = $("#joinRoom_roomname").val();
      if(peerID == ""){peerID = ""}
      socket.emit('enterRoom', {roomName: roomName, userID: peerID});
      $("#joinRoom_roomname").val("");
    }
  });
  /*------------------------------------------------- */
  socket.on("userJoined", data => {
    $(homePageContainer).hide();
    $(video_container).fadeIn();
    roomLog["name"] = data["name"];
    roomLog["roomUserInfo"] = data["roomUserInfo"];
    $("#room_info").text(`room: ${roomLog["name"]}`);
    $("#chat_box").append(`<div><p>user joined room</p></div>`);

    if(data["user"] == 1)
    {
      if(hasGetUserMedia())
      {
        navigator.mediaDevices.getUserMedia(constraints).then((stream)=>{
          addVideo(video_element, stream);
          localPeer.on('call', call => {
            call.answer(stream);
            let video = document.createElement("video");
            call.on('stream', remoteStream => {
              addRemoteVideo(video, remoteStream);
            })
          })
        });
      }
    }

  });

  socket.on('userTwoConnected', (userID) => {
    let tmp_id = userID;
    console.log(tmp_id);
    if(hasGetUserMedia())
    {
      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        addVideo(video_element, stream);
        let video = document.createElement("video");
        let call = localPeer.call(tmp_id, stream);
        call.on('stream', remoteStream => {
          addRemoteVideo(video, remoteStream);
        })
        call.on('close', () => {
          video.remove();
        });
        peers[tmp_id] = call;
      });
    }
  });

  $(sendBtn).on('click', ()=> {
    if($(message_input_element).val() != "")
    {
      let message = $(message_input_element).val();
      socket.emit("textMessage", {roomName: roomLog["name"], message: message});
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
  //---------------------------------------------------------
  $(exitBtn).on('click', ()=> {
    socket.emit('leaving', roomLog["name"]);
  });

  socket.on("user_left", ()=> {
    $("#chat_box").append(`<div><p>user left room</p></div>`);
  });

  socket.on('cleanUpPage', ()=> {
    $("#chat_box").empty();
    $(video_page_container).hide();
    $(homePageContainer).fadeIn();
  });

}//---end
