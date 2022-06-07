import "./App.css";
/* eslint-disable eqeqeq */
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./styles/theme";
import React from "react";
import { Routes, Route } from "react-router-dom";
import AntMedia from "./pages/AntMedia";
import Home from "./pages/Home";
import { WebRTCAdaptor } from "./antmedia/webrtc_adaptor.js";
import { getUrlParameter } from "./antmedia/fetch.stream.js";
import { SnackbarProvider } from "notistack";
import AntSnackBar from "Components/AntSnackBar";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import i18n from "i18next";
import translationEN from "i18n/en.json";
import translationTR from "i18n/tr.json";
import LeftTheRoom from "pages/LeftTheRoom";

const resources = {
  en: {
    translation: translationEN,
  },
  tr: {
    translation: translationTR,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },

    keySeperator: false,
    resources,
  });

if (i18n.language !== "en" || i18n.language !== "tr") {
  if (i18n.language.slice(0, 2) === "tr") {
    localStorage.setItem("i18nextLng", "tr");
    i18n.changeLanguage("tr");
  } else {
    localStorage.setItem("i18nextLng", "en");
    i18n.changeLanguage("en");
  }
}

/**
 * This page accepts 7 arguments through url parameter
 * 1. "streamId": the stream id to publish stream. It's optional. ?streamId=stream1
 * 2. "playOnly": If it's true, user does not publish stream. It only play streams in the room.
 * 3. "token": It's experimental.
 * 4. "roomName": The id of the conference room which requested streams belongs to
 * 5. "streamName": Stream name of stream
 * 6. "subscriberId": It's experimental.
 * 7. "subscriberCode": It's experimental.
 */

var token = getUrlParameter("token");
var publishStreamId = getUrlParameter("streamId");
var playOnly = getUrlParameter("playOnly");
var subscriberId = getUrlParameter("subscriberId");
var subscriberCode = getUrlParameter("subscriberCode");
var isPlaying = false;
var fullScreenId = -1;

if (playOnly == null) {
  playOnly = false;
}

var roomOfStream = [];
var streamIdList = [];
// var streamDetailsList = [];

// var isDataChannelOpen = false;
// var isMicMuted = false;
var isCameraOff = false;
var isScreenSharing = false;
var roomTimerId = -1;

function stopScreenShare() {
  console.log("app stopScreenShare: ", stopScreenShare);
  if (isScreenSharing) {
    isScreenSharing = false;
  }

  if (!isCameraOff) {
    webRTCAdaptor.switchVideoCameraCapture(publishStreamId);
  } else {
    webRTCAdaptor.turnOffLocalCamera(publishStreamId);
    isCameraOff = true;
  }
}

// function formatAMPM(date) {
//   var hours = date.getHours();
//   var minutes = date.getMinutes();
//   var ampm = hours >= 12 ? "pm" : "am";
//   hours = hours % 12;
//   hours = hours ? hours : 12; // the hour '0' should be '12'
//   minutes = minutes < 10 ? "0" + minutes : minutes;
//   var strTime = hours + ":" + minutes + " " + ampm;
//   return strTime;
// }

// function getStreamName(streamId) {
//   var remoteStreamName = "Guest";

//   streamDetailsList.forEach((item) => {
//     if (item.streamId == streamId && item.streamName != null) {
//       remoteStreamName = item.streamName;
//     }
//   });
//   return remoteStreamName;
// }

// function turnOffLocalCamera() {
//   isCameraOff = true;
//   if (!isScreenSharing) {
//     webRTCAdaptor.turnOffLocalCamera(publishStreamId);
//     sendNotificationEvent("CAM_TURNED_OFF");
//   }
// }

// function turnOnLocalCamera() {
//   webRTCAdaptor.turnOnLocalCamera(publishStreamId);
//   isCameraOff = false;
//   sendNotificationEvent("CAM_TURNED_ON");
// }

// function muteLocalMic() {
//   webRTCAdaptor.muteLocalMic();
//   isMicMuted = true;
//   sendNotificationEvent("MIC_MUTED");
// }

// function unmuteLocalMic() {
//   webRTCAdaptor.unmuteLocalMic();
//   isMicMuted = false;
//   sendNotificationEvent("MIC_UNMUTED");
// }

// function sendNotificationEvent(eventType) {
//   if (isDataChannelOpen) {
//     var notEvent = { streamId: publishStreamId, eventType: eventType };
//     webRTCAdaptor.sendData(publishStreamId, JSON.stringify(notEvent));
//   } else {
//     console.log(
//       "Could not send the notification because data channel is not open."
//     );
//   }
// }

// function handleNotificationEvent(obj) {
//   console.log("Received data : ", obj.data);
//   var notificationEvent = JSON.parse(obj.data);
//   if (notificationEvent != null && typeof notificationEvent == "object") {
//     var eventStreamId = notificationEvent.streamId;
//     var eventType = notificationEvent.eventType;

//     if (eventType == "CAM_TURNED_OFF") {
//       console.log("Camera turned off for : ", eventStreamId);
//     } else if (eventType == "CAM_TURNED_ON") {
//       console.log("Camera turned on for : ", eventStreamId);
//     } else if (eventType == "MIC_MUTED") {
//       console.log("Microphone muted for : ", eventStreamId);
//     } else if (eventType == "MIC_UNMUTED") {
//       console.log("Microphone unmuted for : ", eventStreamId);
//     }
//   }
// }

// function playVideo(obj) {
//   var index = obj.trackId.substring("ARDAMSx".length);
//   if (index === publishStreamId) {
//     return;
//   }
//   webRTCAdaptor.handlePlayVideo(obj, index);
// }

function makeFullScreen(divId) {
  if (fullScreenId == divId) {
    document.getElementById(divId).classList.remove("selected");
    document.getElementById(divId).classList.add("unselected");
    fullScreenId = -1;
  } else {
    document.getElementsByClassName("publisher-content")[0].className =
      "publisher-content chat-active fullscreen-layout";
    if (fullScreenId != -1) {
      document.getElementById(fullScreenId).classList.remove("selected");
      document.getElementById(fullScreenId).classList.add("unselected");
    }
    document.getElementById(divId).classList.remove("unselected");
    document.getElementById(divId).classList.add("selected");
    fullScreenId = divId;
  }
}

var pc_config = {
  iceServers: [
    {
      urls: "stun:stun1.l.google.com:19302",
    },
  ],
};

var sdpConstraints = {
  OfferToReceiveAudio: false,
  OfferToReceiveVideo: false,
};

var mediaConstraints = {
  video: {
    width: { max: 320 },
    height: { max: 240 },
  },
  audio: true,
};

function checkTrackStatus(streamIdList, publishStreamId) {
  streamIdList.forEach(function (item) {
    var video = document.getElementById(item);
    if (video != null && !video.srcObject?.active) {
      webRTCAdaptor.handlePlayVideo(item, publishStreamId);
    }
  });
}
let websocketURL = process.env.REACT_APP_WEBSOCKET_URL;

if (!websocketURL) {
  const appName = window.location.pathname.substring(
    0,
    window.location.pathname.lastIndexOf("/") + 1
  );
  const path =
    window.location.hostname +
    ":" +
    window.location.port +
    appName +
    "websocket";
  websocketURL = "ws://" + path;

  if (window.location.protocol.startsWith("https")) {
    websocketURL = "wss://" + path;
  }
}
// let streamsList;

const webRTCAdaptor = new WebRTCAdaptor({
  websocket_url: websocketURL,
  mediaConstraints: mediaConstraints,
  peerconnection_config: pc_config,
  sdp_constraints: sdpConstraints,
  isPlayMode: playOnly,
  debug: true,
  callback: (info, obj) => {
    if (info == "initialized") {
      console.log("initialized");
    } else if (info == "joinedTheRoom") {
      var room = obj.ATTR_ROOM_NAME;
      roomOfStream[obj.streamId] = room;
      console.log("joined the room: " + roomOfStream[obj.streamId]);
      console.debug(obj);

      publishStreamId = obj.streamId;

      webRTCAdaptor.handleSetMyObj(obj);
      streamIdList = obj.streams;
      // streamDetailsList = obj.streamList;
      console.debug(streamIdList);

      webRTCAdaptor.handlePublish(
        obj.streamId,
        token,
        subscriberId,
        subscriberCode
      );

      roomTimerId = setInterval(() => {
        webRTCAdaptor.handleRoomInfo(publishStreamId);
      }, 5000);
    } else if (info == "newStreamAvailable") {
      webRTCAdaptor.handlePlayVideo(obj, publishStreamId);
    } else if (info == "publish_started") {
      //stream is being published
      console.debug("publish started to room: " + roomOfStream[obj.streamId]);
      webRTCAdaptor.handleRoomInfo(publishStreamId);
    } else if (info == "publish_finished") {
      //stream is being finished
      console.debug("publish finished");
    } else if (info == "screen_share_stopped") {
      console.log("screen share stopped");
    } else if (info == "browser_screen_share_supported") {
      console.log("browser screen share supported");
    } else if (info == "leavedFromRoom") {
      room = obj.ATTR_ROOM_NAME;
      console.debug("leaved from the room:" + room);
      if (roomTimerId != null) {
        clearInterval(roomTimerId);
      }
      // we need to reset streams list
      // streamsList = [];
      // streamDetailsList = [];
      // isPlaying = false;
      // publishStreamId = null;
    } else if (info == "closed") {
      if (typeof obj != "undefined") {
        console.log("Connecton closed: " + JSON.stringify(obj));
      }
    } else if (info == "play_finished") {
      console.log("play_finished");
      isPlaying = false;
    } else if (info == "streamInformation") {
      webRTCAdaptor.handleStreamInformation(obj);
    } else if (info == "roomInformation") {
      // console.log("roomInformationroomInformationroomInformationroomInformationroomInformation", obj)

      var tempList = [...obj.streams];
      tempList.push("!" + publishStreamId);
      webRTCAdaptor.handleRoomEvents(obj);
      if (!isPlaying) {
        webRTCAdaptor.handlePlay(token, tempList);
        isPlaying = true;
      }
      //Lastly updates the current streamlist with the fetched one.
      streamIdList = obj.streams;
      // streamDetailsList = obj.streamList;
      //console.log("objobjobjobjobjobjobjobjobjobjobjobjxx", obj);
      //Check video tracks active/inactive status
      checkTrackStatus(streamIdList, publishStreamId);
    } else if (info == "data_channel_opened") {
      console.log("Data Channel open for stream id", obj);
      setInterval(() => {
        webRTCAdaptor.updateStatus(obj);
      }, 2000);

      // isDataChannelOpen = true;
    } else if (info == "data_channel_closed") {
      console.log("Data Channel closed for stream id", obj);
      // isDataChannelOpen = false;
    } else if (info == "data_received") {
      try {
        webRTCAdaptor.handleNotificationEvent(obj);
      } catch (e) {
        // var remoteStreamName = getStreamName(obj.streamId);
        // console.log("remoteStreamName: ", remoteStreamName);
      }
    } else if (info == "available_devices") {
      if (webRTCAdaptor && webRTCAdaptor.handleDevices) {
        webRTCAdaptor.handleDevices(obj);
      }
    }
  },
  callbackError: function (error, message) {
    //some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
    if (error.indexOf("publishTimeoutError") != -1 && roomTimerId != null) {
      clearInterval(roomTimerId);
    }

    console.log("error callback: " + JSON.stringify(error));
    var errorMessage = JSON.stringify(error);
    if (typeof message != "undefined") {
      errorMessage = message;
    }
    errorMessage = JSON.stringify(error);
    if (error.indexOf("NotFoundError") != -1) {
      errorMessage =
        "Camera or Mic are not found or not allowed in your device.";
    } else if (
      error.indexOf("NotReadableError") != -1 ||
      error.indexOf("TrackStartError") != -1
    ) {
      errorMessage =
        "Camera or Mic is being used by some other process that does not not allow these devices to be read.";
    } else if (
      error.indexOf("OverconstrainedError") != -1 ||
      error.indexOf("ConstraintNotSatisfiedError") != -1
    ) {
      errorMessage =
        "There is no device found that fits your video and audio constraints. You may change video and audio constraints.";
    } else if (
      error.indexOf("NotAllowedError") != -1 ||
      error.indexOf("PermissionDeniedError") != -1
    ) {
      errorMessage = "You are not allowed to access camera and mic.";
      stopScreenShare();
    } else if (error.indexOf("TypeError") != -1) {
      errorMessage = "Video/Audio is required.";
    } else if (error.indexOf("UnsecureContext") != -1) {
      errorMessage =
        "Fatal Error: Browser cannot access camera and mic because of unsecure context. Please install SSL and access via https";
    } else if (error.indexOf("WebSocketNotSupported") != -1) {
      errorMessage = "Fatal Error: WebSocket not supported in this browser";
    } else if (error.indexOf("no_stream_exist") != -1) {
      //TODO: removeRemoteVideo(error.streamId);
    } else if (error.indexOf("data_channel_error") != -1) {
      errorMessage = "There was a error during data channel communication";
    } else if (error.indexOf("ScreenSharePermissionDenied") != -1) {
      errorMessage = "You are not allowed to access screen share";
      stopScreenShare();
    }

    alert(errorMessage);
  },
});

function getWindowLocation() {
  document.getElementById("locationHref").value = window.location.href;
}

function copyWindowLocation() {
  var copyText = document.getElementById("locationHref");

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /* For mobile devices */

  /* Copy the text inside the text field */
  document.execCommand("copy");
}

window.getWindowLocation = getWindowLocation;
window.copyWindowLocation = copyWindowLocation;
window.makeFullScreen = makeFullScreen;

export const AntmediaContext = React.createContext(webRTCAdaptor);

function App() {
  const handleFullScreen = (e) => {
    if (e.target?.id === "meeting-gallery") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  React.useEffect(() => {
    window.addEventListener("dblclick", handleFullScreen);

    // cleanup this component
    return () => {
      window.removeEventListener("dblclick", handleFullScreen);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        maxSnack={3}
        content={(key, notificationData) => (
          <AntSnackBar id={key} notificationData={notificationData} />
        )}
      >
        <AntmediaContext.Provider value={webRTCAdaptor}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/:id" element={<AntMedia />} />
            <Route path="/:id/left-the-room" element={<LeftTheRoom />} />
          </Routes>
        </AntmediaContext.Provider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
