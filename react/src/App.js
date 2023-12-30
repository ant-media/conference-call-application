import "./App.css";
/* eslint-disable eqeqeq */
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./styles/theme";
import React, { useContext } from "react";
import { WebRTCAdaptor } from "./antmedia/webrtc_adaptor.js";
import { getUrlParameter } from "./antmedia/fetch.stream";
import { SnackbarProvider } from "notistack";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import i18n from "i18next";
import translationEN from "i18n/en.json";
import translationTR from "i18n/tr.json";
import CustomRoutes from "CustomRoutes";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import AntMedia from "pages/AntMedia";
import AntSnackBar from "Components/AntSnackBar";
import { getRootAttribute, getWebSocketURLAttribute } from "utils";

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

var tokenPublishAdmin = getRootAttribute("token-publish-admin");
if (!tokenPublishAdmin) {
  tokenPublishAdmin = getUrlParameter("tokenPublishAdmin");
}

var tokenPlay = getRootAttribute("token-play");
if (!tokenPlay) {
  tokenPlay = getUrlParameter("tokenPlay");
}

var tokenPublish = getRootAttribute("token-publish");
if (!tokenPublish) {
  tokenPublish = getUrlParameter("tokenPublish");
}

var mcuEnabled = getUrlParameter("mcuEnabled");

var publishStreamId = getRootAttribute("publish-stream-id");
if (!publishStreamId) {
  publishStreamId = getUrlParameter("streamId");
}

var playOnly = getRootAttribute("play-only");
if (!playOnly) {
  playOnly = getUrlParameter("playOnly");
}
if (playOnly == "true") {
  playOnly = true;
}

var onlyDataChannel = getRootAttribute("only-data-channel");
if (!onlyDataChannel) {
  onlyDataChannel = getUrlParameter("onlyDataChannel");
}
if (onlyDataChannel == "true") {
  onlyDataChannel = true;
}



var subscriberId = getUrlParameter("subscriberId");
var subscriberCode = getUrlParameter("subscriberCode");

var admin = getRootAttribute("admin");
if (!admin) {
  admin = getUrlParameter("admin");
}

var observerMode = getUrlParameter("observerMode");
var isPlaying = false;
var fullScreenId = -1;

if (mcuEnabled == null) {
    mcuEnabled = false;
}

if (playOnly == null) {
  playOnly = false;
}

if (onlyDataChannel == null) {
    onlyDataChannel = false;
} else if (onlyDataChannel === "true") {
  onlyDataChannel = true;
}

if (admin == null) {
  admin = false;
}

if (observerMode == null) {
  observerMode = false;
}

var roomOfStream = [];

var roomTimerId = -1;

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

function checkAndUpdateVideoAudioSources() {
  let isVideoDeviceAvailable = false;
  let isAudioDeviceAvailable = false;
  let selectedDevices = {} //webRTCAdaptor.getSelectedDevices();
  let currentCameraDeviceId = null; // selectedDevices.videoDeviceId;
  let currentAudioDeviceId = null; //selectedDevices.audioDeviceId;

  // check if the selected devices are still available
  for(let index = 0; index < webRTCAdaptor.devices.length; index++) {
    if (webRTCAdaptor.devices[index].kind == "videoinput" && webRTCAdaptor.devices[index].deviceId == currentCameraDeviceId) {
      isVideoDeviceAvailable = true;
    }
    if (webRTCAdaptor.devices[index].kind == "audioinput" && webRTCAdaptor.devices[index].deviceId == currentAudioDeviceId) {
      isAudioDeviceAvailable = true;
    }
  }

  // if the selected devices are not available, select the first available device
  if (currentCameraDeviceId == '' || isVideoDeviceAvailable == false) {
    const camera = webRTCAdaptor.devices.find(d => d.kind === 'videoinput');
    if (camera) {
      selectedDevices.videoDeviceId = camera.deviceId;
    }
  }
  if (currentAudioDeviceId == '' || isAudioDeviceAvailable == false) {
    const audio = webRTCAdaptor.devices.find(d => d.kind === 'audioinput');
    if (audio) {
      selectedDevices.audioDeviceId = audio.deviceId;
    }
  }
  console.log("webRTCAdaptor:", webRTCAdaptor);
  //webRTCAdaptor.setSelectedDevices(selectedDevices);

  //if (currentCameraDeviceId !== selectedDevices.videoDeviceId) {
  //  webRTCAdaptor.switchVideoCameraCapture(publishStreamId, selectedDevices.videoDeviceId);
  //}
  if (currentAudioDeviceId !== selectedDevices.audioDeviceId || selectedDevices.audioDeviceId == 'default') {
    webRTCAdaptor.switchAudioInputSource(publishStreamId, selectedDevices.audioDeviceId);
  }
}

var videoQualityConstraints = {
  video: {
    width: { max: 320 },
    height: { max: 240 },
  }
}

var audioQualityConstraints = {
  audio:{
    noiseSuppression: true,
    echoCancellation: true
  }
}

var mediaConstraints = {
  // setting constraints here breaks source switching on firefox.
  video: videoQualityConstraints.video,
  audio: audioQualityConstraints.audio,
};

var websocketURL = process.env.REACT_APP_WEBSOCKET_URL;
var restURL = process.env.REACT_APP_REST_BASE_URL;

if (!websocketURL) {

  websocketURL = getWebSocketURLAttribute();
  if (!websocketURL)
  {
    const appName = window.location.pathname.substring(
      0,
      window.location.pathname.lastIndexOf("/") + 1
    );
    const path =
      window.location.hostname +
      ":" +
      window.location.port +
      appName;

    websocketURL = "ws://" + path;

    if (window.location.protocol.startsWith("https")) {
      websocketURL = "wss://" + path;
    }

    websocketURL += "websocket";
    restURL = window.location.protocol + "//" + path;

  }
  else {

    restURL = websocketURL.replace("ws", "http");
    //if it's wss, then it becomes https
    restURL = restURL.replace("websocket", "");
  }
   //remove last slash
   restURL = restURL.substring(0, restURL.length - 1);


}
console.log("websocket url: " + websocketURL + " rest base url: " + restURL);

export const restBaseUrl = restURL;

let makeOnlyDataChannelPublisher = false;
let makePublisherOnlyDataChannel = false;
let roomName;

const webRTCAdaptor = new WebRTCAdaptor({
  websocket_url: websocketURL,
  mediaConstraints: mediaConstraints,
  onlyDataChannel: onlyDataChannel,
  debug: true,
  callback: (info, obj) => {
    if (info === "initialized") {
      //webRTCAdaptor.enableDisableMCU(mcuEnabled);
      if (observerMode) {
        webRTCAdaptor.turnObserverModeOn();
      }
    } else if (info === "joinedTheRoom") {
      roomName = obj.ATTR_ROOM_NAME;
      var room = obj.ATTR_ROOM_NAME;
      roomOfStream[obj.streamId] = room;

      publishStreamId = obj.streamId;

      if (admin) {
        webRTCAdaptor.admin = true;
        webRTCAdaptorForAdmin.joinRoom(room + "listener", publishStreamId+"admin", "legacy");
      } else if (onlyDataChannel) {
        webRTCAdaptor.onlyDataChannel = true;
      }

      webRTCAdaptor.handleSetMyObj(obj);
      //let streamDetailsList = obj.streamList;

      webRTCAdaptor.handlePublish(
            obj.streamId,
            tokenPublish,
            subscriberId,
            subscriberCode
        );

      roomTimerId = setInterval(() => {
        webRTCAdaptor.handleRoomInfo(publishStreamId);
      }, 5000);
    } else if (info === "newStreamAvailable")
    {
      console.log("newStreamAvailable at " + new Date().getTime().toString());
      //setTimeout(() => {
      webRTCAdaptor.handlePlayVideo(obj, publishStreamId);
        //console.error("Now playing: " + obj.streamId);
      //}, 10000);
    } else if (info === "publish_started")
    {
      //stream is being published
      if (!onlyDataChannel) {
        webRTCAdaptor.enableStats(publishStreamId);
      }
      webRTCAdaptor.handleRoomInfo(publishStreamId);
      if (webRTCAdaptor.mediaManager.localStream != null) {
        webRTCAdaptor.mediaManager.localVideo = document.getElementById("localVideo");
        webRTCAdaptor.mediaManager.localVideo.srcObject =
            webRTCAdaptor.mediaManager.localStream;
      }
    } else if (info === "publish_finished") {
      //stream is being finished
    } else if (info === "screen_share_stopped") {
      webRTCAdaptor.handleScreenshareNotFromPlatform();
    } else if (info === "browser_screen_share_supported") {
    } else if (info === "leavedFromRoom") {
      room = obj.ATTR_ROOM_NAME;
      if (roomTimerId !== null) {
        clearInterval(roomTimerId);
      }
      if (makeOnlyDataChannelPublisher)
      {
        makeOnlyDataChannelPublisher = false;
        webRTCAdaptor.resetAllParticipants();
        webRTCAdaptor.resetPartipants();
        onlyDataChannel = false;
        webRTCAdaptor.onlyDataChannel = false;
        let newRoom = room.replace("listener", "");
        webRTCAdaptor.changeRoomName(newRoom);
        webRTCAdaptor.joinRoom(newRoom, publishStreamId, "legacy");
      } else if (makePublisherOnlyDataChannel) {
        makePublisherOnlyDataChannel = false;
        webRTCAdaptor.resetAllParticipants();
        webRTCAdaptor.resetPartipants();
        onlyDataChannel = true;
        webRTCAdaptor.onlyDataChannel = true;
        let newRoom = room + "listener";
        webRTCAdaptor.changeRoomName(newRoom);
        webRTCAdaptor.joinRoom(newRoom, publishStreamId, "legacy");
      }
      else if (admin) {
        console.log("admin left the room");
        webRTCAdaptorForAdmin.leaveFromRoom(room + "listener");
      }

    } else if (info === "closed") {
    } else if (info === "play_finished") {
      isPlaying = false;
    } else if (info === "streamInformation") {
      webRTCAdaptor.handleStreamInformation(tokenPlay, obj);
    } else if (info === "screen_share_started") {
      webRTCAdaptor.screenShareOnNotification();
    } else if (info === "roomInformation") {
      var tempList = [...obj.streams];
      tempList.push("!" + publishStreamId);
      webRTCAdaptor.handleRoomEvents(obj);
      if (!isPlaying) {
        webRTCAdaptor.handlePlay(tokenPlay, tempList);
        isPlaying = true;
      }
      //Lastly updates the current streamlist with the fetched one.
    } else if (info === "data_channel_opened") {
      setInterval(() => {
        webRTCAdaptor.updateStatus(obj);
      }, 2000);

      // isDataChannelOpen = true;
    } else if (info === "data_channel_closed") {
      // isDataChannelOpen = false;
    } else if (info === "data_received") {
      try {
        let notificationEvent = JSON.parse(obj.data);
        if (notificationEvent != null && typeof notificationEvent == "object") {
          let eventStreamId = notificationEvent.streamId;
          let eventType = notificationEvent.eventType;

          if (eventType === "BROADCAST_ON" && !webRTCAdaptor.onlyDataChannel && eventStreamId === publishStreamId) {
            webRTCAdaptor.setIsBroadcasting(true);
            console.log("BROADCAST_ON");
          } else if (eventType === "BROADCAST_OFF" && !webRTCAdaptor.onlyDataChannel && eventStreamId === publishStreamId) {
            webRTCAdaptor.setIsBroadcasting(false);
          } else if (eventType === "REQUEST_PUBLISH") {
            if (webRTCAdaptor.admin) {
              webRTCAdaptor.addBecomingPublisherRequest(eventStreamId);
            }
            return;
          }
          else if (eventType === "GRANT_BECOME_PUBLISHER" && webRTCAdaptor.onlyDataChannel && eventStreamId === publishStreamId)
          {
              navigator.mediaDevices
                .enumerateDevices()
                .then((devices) => {
                  let audioInputDevices = [];
                  let videoInputDevices = [];
                  devices.forEach((device) => {
                    if (device.kind === "audioinput") {
                        audioInputDevices.push(device);
                    } else if (device.kind === "videoinput") {
                        videoInputDevices.push(device);
                    }
                    console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`);
                  });
                  if (audioInputDevices.length > 0 && videoInputDevices.length > 0)
                  {
                    makeOnlyDataChannelPublisher = true;
                    makePublisherOnlyDataChannel = false;
                    publishStreamId = publishStreamId + "tempPublisher";
                    webRTCAdaptor.leaveFromRoom(roomName);
                  } else {
                    webRTCAdaptor.displayNoVideoAudioDeviceFoundWarning();
                  }
                })
                .catch((err) => {
                  console.error(`${err.name}: ${err.message}`);
                });
          }
          else if (eventType == "REJECT_SPEAKER_REQUEST" && webRTCAdaptor.onlyDataChannel && eventStreamId === publishStreamId)
          {
            window.showNotification(
              'Your request to join the room is rejected by the host'
            );
          }
          else if (eventType === "MAKE_LISTENER_AGAIN" && !webRTCAdaptor.onlyDataChannel && eventStreamId === publishStreamId) {
            makePublisherOnlyDataChannel = true;
            makeOnlyDataChannelPublisher = false;
            webRTCAdaptor.setIsBroadcasting(false);
            publishStreamId = publishStreamId.replace('tempPublisher', '');
            webRTCAdaptor.leaveFromRoom(roomName);
          } else if (eventType === "CLOSE_YOUR_CAMERA" && !webRTCAdaptor.onlyDataChannel && eventStreamId === publishStreamId) {
            webRTCAdaptor.toggleSetCam({
              eventStreamId: "localVideo",
              isCameraOn: false,
            });
            webRTCAdaptor.turnOffLocalCamera(publishStreamId);
            webRTCAdaptor.handleSendNotificationEvent(
                "CAM_TURNED_OFF",
                publishStreamId
            );
          } else if (eventType === "STOP_PLAYING" && !webRTCAdaptor.onlyDataChannel) {
            //webRTCAdaptor.stop(eventStreamId);
          } else if (eventType === "CLOSE_YOUR_MICROPHONE" && !webRTCAdaptor.onlyDataChannel && eventStreamId === publishStreamId) {
            webRTCAdaptor.toggleSetMic({
              eventStreamId: 'localVideo',
              isMicMuted: true,
            });
            webRTCAdaptor.muteLocalMic();
            webRTCAdaptor.handleSendNotificationEvent(
                "MIC_MUTED",
                publishStreamId
            );
          } else if (eventType === "OPEN_YOUR_MICROPHONE" && !webRTCAdaptor.onlyDataChannel && eventStreamId === publishStreamId) {
            webRTCAdaptor.toggleSetMic({
              eventStreamId: 'localVideo',
              isMicMuted: false,
            });
            webRTCAdaptor.unmuteLocalMic();
            webRTCAdaptor.handleSendNotificationEvent('MIC_UNMUTED', publishStreamId);
          }
        }
        webRTCAdaptor.handleNotificationEvent(obj);
      } catch (e) {}
    } else if (info === "available_devices") {
      webRTCAdaptor.devices = obj;
      checkAndUpdateVideoAudioSources();
    } else if (info === "updated_stats") {
      let rtt = ((parseFloat(obj.videoRoundTripTime) + parseFloat(obj.audioRoundTripTime)) / 2).toPrecision(3);
      let jitter = ((parseFloat(obj.videoJitter) + parseInt(obj.audioJitter)) / 2).toPrecision(3);
      let outgoingBitrate = parseInt(obj.currentOutgoingBitrate);
      let bandwidth = parseInt(webRTCAdaptor.mediaManager.bandwidth);

      let packageLost = parseInt(obj.videoPacketsLost) + parseInt(obj.audioPacketsLost);
      let packageSent = parseInt(obj.totalVideoPacketsSent) + parseInt(obj.totalAudioPacketsSent);
      let packageLostPercentage = 0;
      if (packageLost !== 0) {
        packageLostPercentage = ((packageLost / parseInt(packageSent)) * 100).toPrecision(3);
      }

      if (rtt >= 150 || packageLostPercentage >= 2.5 || jitter >= 80 || ((outgoingBitrate/100) * 80) >= bandwidth) {
        webRTCAdaptor.displayPoorNetworkConnectionWarning();
      }

    } else if (info == "debugInfo") {
      webRTCAdaptor.handleDebugInfo(obj.debugInfo);
    }
    else if (info == "ice_connection_state_changed") {
      console.log("iceConnectionState Changed: ",JSON.stringify(obj))
      var iceState = obj.state;
      if (iceState == null || iceState == "failed" || iceState == "disconnected"){
        alert("!! Connection closed. Please rejoin the meeting");
      }
    }
  },
  callbackError: function (error, message) {
    //some possible errors, NotFoundError, SecurityError,PermissionDeniedError
    if (error.indexOf("publishTimeoutError") !== -1 && roomTimerId != null) {
      clearInterval(roomTimerId);
    }

    var errorMessage = JSON.stringify(error);

    if (typeof message != "undefined") {
      errorMessage = message;
    }
    errorMessage = JSON.stringify(error);
    if (error.indexOf("no_active_streams_in_room") !== -1) {

      webRTCAdaptor.handleRoomEvents({ streams:[], streamList: []});
    }
    else
    if (error.indexOf("NotFoundError") !== -1) {
      errorMessage =
        "Camera or Mic are not found or not allowed in your device.";
      alert(errorMessage);
    } else if (
      error.indexOf("NotReadableError") !== -1 ||
      error.indexOf("TrackStartError") !== -1
    ) {
      errorMessage =
        "Camera or Mic is being used by some other process that does not not allow these devices to be read.";
      alert(errorMessage);
    } else if (
      error.indexOf("OverconstrainedError") != -1 ||
      error.indexOf("ConstraintNotSatisfiedError") != -1
    ) {
      errorMessage =
        "There is no device found that fits your video and audio constraints. You may change video and audio constraints.";
      alert(errorMessage);
    } else if (
      error.indexOf("NotAllowedError") != -1 ||
      error.indexOf("PermissionDeniedError") != -1
    ) {
      errorMessage = "You are not allowed to access camera and mic.";
      console.log(errorMessage);
      //webRTCAdaptor.handleScreenshareNotFromPlatform();
    } else if (error.indexOf("TypeError") != -1) {
      errorMessage = "Video/Audio is required.";
      webRTCAdaptor.mediaManager.getDevices();
    } else if (error.indexOf("UnsecureContext") != -1) {
      errorMessage =
        "Fatal Error: Browser cannot access camera and mic because of unsecure context. Please install SSL and access via https";
    } else if (error.indexOf("WebSocketNotSupported") != -1) {
      errorMessage = "Fatal Error: WebSocket not supported in this browser";
    } else if (error.indexOf("no_stream_exist") != -1) {
      //TODO: removeRemoteVideo(error.streamId);
      console.log("no_stream_exist");
      isPlaying = false;
      return;
    } else if (error.indexOf("already_playing") != -1) {
      console.log("already_playing");
      isPlaying = false;
      return;
    } else if (error.indexOf("data_channel_error") != -1) {
      errorMessage = "There was a error during data channel communication";
    } else if (error.indexOf("ScreenSharePermissionDenied") != -1) {
      errorMessage = "You are not allowed to access screen share";
      webRTCAdaptor.handleScreenshareNotFromPlatform();
    } else if (error.indexOf("WebSocketNotConnected") != -1) {
      errorMessage = "WebSocket Connection is disconnected.";
    }

    //alert(errorMessage);
  },
});

var speedTestObject = {
  message: "Please wait while we are testing your connection speed",
  isfinished: false
};

let speedTestCounter = 0;
const webRTCAdaptorSpeedTest = new WebRTCAdaptor({
  websocket_url: websocketURL,
  mediaConstraints: {video: !onlyDataChannel, audio: !onlyDataChannel},
  isPlayMode: true,
  debug: true,
  callback : (info, obj) => {
    if (info !== "pong") {
      console.log(info, obj);
    }
    if (info == "initialized") {
      console.log("initialized");
    } else if (info == "play_started") {
      //joined the stream
      console.log("play started", obj.streamId);

      webRTCAdaptorSpeedTest.getStreamInfo(obj.streamId);
      webRTCAdaptorSpeedTest.enableStats(obj.streamId);
    } else if (info == "play_finished") {
      //leaved the stream
      console.log("play finished");
      webRTCAdaptorSpeedTest.disableStats(obj.streamId);
    } else if (info == "publish_started") {
      //stream is being published
      console.log("publish started");
      speedTestCounter = 0;
      webRTCAdaptorSpeedTest.turnOnLocalCamera(obj.streamId);
      webRTCAdaptorSpeedTest.unmuteLocalMic();
      webRTCAdaptorSpeedTest.enableStats(obj.streamId);

    } else if (info == "publish_finished") {
      //stream is being finished
      console.log("publish finished");
      webRTCAdaptorSpeedTest.turnOffLocalCamera(obj.streamId);
      webRTCAdaptorSpeedTest.muteLocalMic();
    }
    else if (info == "closed") {
      //console.log("Connection closed");
      if (typeof obj != "undefined") {
        console.log("Connecton closed: " + JSON.stringify(obj));
      }
    }
    else if (info == "pong") {
      //ping/pong message are sent to and received from server to make the connection alive all the time
      //It's especially useful when load balancer or firewalls close the websocket connection due to inactivity
    }
    else if (info == "ice_connection_state_changed") {
      console.log("iceConnectionState Changed: ",JSON.stringify(obj));
    }
    else if (info == "updated_stats") {
      speedTestCounter++;
      if(speedTestCounter > 2 && onlyDataChannel === true) {
        webRTCAdaptorSpeedTest.stop(obj.streamId);

        if(isNaN(obj.videoJitterAverageDelay)){
          obj.videoJitterAverageDelay = 0;
        }
        if(isNaN(obj.audioJitterAverageDelay)){
          obj.audioJitterAverageDelay = 0;
        }

        let packetLost = parseInt(obj.videoPacketsLost) + parseInt(obj.audioPacketsLost);
        let jitter = ((parseFloat(obj.videoJitterAverageDelay) + parseFloat(obj.audioJitterAverageDelay)) / 2).toPrecision(3);

        console.log("* packetLost: " + packetLost);
        console.log("* jitter: " + jitter);

        if (packetLost >= 2.5 || jitter >= 80) {
          console.log("-> Your Connection is bad");
          speedTestObject.message = "Your Connection is bad";
        } else if (packetLost >= 1 || jitter >= 30) {
          console.log("-> Your connection is fair");
          speedTestObject.message = "Your connection is fair";
        } else {
          console.log("-> Your connection is good");
          speedTestObject.message = "Your connection is good";
        }
        speedTestObject.isfinished = true;
      } else if (speedTestCounter > 2 && onlyDataChannel !== true) {
        webRTCAdaptorSpeedTest.stop(obj.streamId);

        let rtt = ((parseFloat(obj.videoRoundTripTime) + parseFloat(obj.audioRoundTripTime)) / 2).toPrecision(3);
        let packetLost = parseInt(obj.videoPacketsLost) + parseInt(obj.audioPacketsLost);
        let jitter = ((parseFloat(obj.videoJitter) + parseInt(obj.audioJitter)) / 2).toPrecision(3);
        let outgoingBitrate = parseInt(obj.currentOutgoingBitrate);
        let bandwidth = parseInt(webRTCAdaptor.mediaManager.bandwidth);

        console.log("* rtt: " + rtt);
        console.log("* packetLost: " + packetLost);
        console.log("* jitter: " + jitter);
        console.log("* outgoingBitrate: " + outgoingBitrate);
        console.log("* bandwidth: " + bandwidth);

        if (rtt >= 150 || packetLost >= 2.5 || jitter >= 80 || ((outgoingBitrate / 100) * 80) >= bandwidth) {
          console.log("-> Your Connection is bad");
          speedTestObject.message = "Your Connection is bad";
        } else if (rtt >= 50 || packetLost >= 1 || jitter >= 30 || outgoingBitrate >= bandwidth) {
          console.log("-> Your connection is fair");
          speedTestObject.message = "Your connection is fair";
        } else {
          console.log("-> Your connection is good");
          speedTestObject.message = "Your connection is good";
        }
        speedTestObject.isfinished = true;
      }
    }
    else {
      console.log( info + " notification received");
    }
  },
  callbackError : function(error) {
    setTimeout(() => {
      speedTestObject.message = "Your connection is fair";
      speedTestObject.isfinished = true;
    }, 3000);
  }
});

const webRTCAdaptorForAdmin = new WebRTCAdaptor({
  websocket_url: websocketURL,
  mediaConstraints: mediaConstraints,
  onlyDataChannel: true,
  debug: true,
  callback: (info, obj) => {
    if (info === "initialized") {
    } else if (info === "pong") {
    }else if (info === "joinedTheRoom") {
      var room = obj.ATTR_ROOM_NAME;

      webRTCAdaptorForAdmin.publish(
          obj.streamId,
          tokenPublishAdmin,
          subscriberId,
          subscriberCode,
          "Host",
          room,
          "{someKey:somveValue}"
      );
    } else if (info === "newStreamAvailable") {
    } else if (info === "publish_started") {
      //stream is being published
    } else if (info === "publish_finished") {
      //stream is being finished
    } else if (info === "screen_share_stopped") {
      //webRTCAdaptor.handleScreenshareNotFromPlatform();
    } else if (info === "browser_screen_share_supported") {
    } else if (info === "leavedFromRoom") {
    } else if (info === "closed") {
    } else if (info === "play_finished") {
      isPlaying = false;
    } else if (info === "streamInformation") {
    } else if (info === "screen_share_started") {
    } else if (info === "roomInformation") {
      //Lastly updates the current streamlist with the fetched one.
    } else if (info === "data_channel_opened") {
      // isDataChannelOpen = true;
    } else if (info === "data_channel_closed") {
      // isDataChannelOpen = false;
    } else if (info === "data_received") {
      try {
        let notificationEvent = JSON.parse(obj.data);
        if (notificationEvent != null && typeof notificationEvent == "object") {
          let eventStreamId = notificationEvent.streamId;
          let eventType = notificationEvent.eventType;
          if (eventType === "REQUEST_PUBLISH" && webRTCAdaptor.admin === true) {
            console.log("webrtc publish request is received from attendee with streamId: " + eventStreamId);
            webRTCAdaptor.handleSendMessage("admin*listener_room*"+eventStreamId+"*GRANT_BECOME_PUBLISHER");
          }
        }
      } catch (e) {}
    } else if (info === "available_devices") {
    } else if (info === "updated_stats") {
    } else if (info == "debugInfo") {
    }
    else if (info == "ice_connection_state_changed") {
      console.log("iceConnectionState Changed: ",JSON.stringify(obj))
    }
  },
  callbackError: function (error, message) {
    //some possible errors, NotFoundError, SecurityError,PermissionDeniedError
    if (error.indexOf("publishTimeoutError") !== -1 && roomTimerId != null) {
      clearInterval(roomTimerId);
    }

    var errorMessage = JSON.stringify(error);
    if (typeof message != "undefined") {
      errorMessage = message;
    }
    errorMessage = JSON.stringify(error);
    if (error.indexOf("NotFoundError") !== -1) {
      errorMessage =
          "Camera or Mic are not found or not allowed in your device.";
      alert(errorMessage);
    } else if (
        error.indexOf("NotReadableError") !== -1 ||
        error.indexOf("TrackStartError") !== -1
    ) {
      errorMessage =
          "Camera or Mic is being used by some other process that does not not allow these devices to be read.";
      alert(errorMessage);
    } else if (
        error.indexOf("OverconstrainedError") != -1 ||
        error.indexOf("ConstraintNotSatisfiedError") != -1
    ) {
      errorMessage =
          "There is no device found that fits your video and audio constraints. You may change video and audio constraints.";
      alert(errorMessage);
    } else if (
        error.indexOf("NotAllowedError") != -1 ||
        error.indexOf("PermissionDeniedError") != -1
    ) {
      errorMessage = "You are not allowed to access camera and mic.";
    } else if (error.indexOf("TypeError") != -1) {
      errorMessage = "Video/Audio is required.";
    } else if (error.indexOf("UnsecureContext") != -1) {
      errorMessage =
          "Fatal Error: Browser cannot access camera and mic because of unsecure context. Please install SSL and access via https";
    } else if (error.indexOf("WebSocketNotSupported") != -1) {
      errorMessage = "Fatal Error: WebSocket not supported in this browser";
    } else if (error.indexOf("no_stream_exist") != -1) {
      //TODO: removeRemoteVideo(error.streamId);
      console.log("no_stream_exist");
      isPlaying = false;
      return;
    } else if (error.indexOf("already_playing") != -1) {
      console.log("already_playing");
      isPlaying = false;
      return;
    } else if (error.indexOf("data_channel_error") != -1) {
      errorMessage = "There was a error during data channel communication";
    } else if (error.indexOf("ScreenSharePermissionDenied") != -1) {
      errorMessage = "You are not allowed to access screen share";
    } else if (error.indexOf("WebSocketNotConnected") != -1) {
      errorMessage = "WebSocket Connection is disconnected.";
    }
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
window.showNotification = null;
window.t = null; //translation

export const AntmediaContext = React.createContext(webRTCAdaptor);
export const AntmediaAdminContext = React.createContext(webRTCAdaptorForAdmin);
export const AntmediaSpeedTestContext = React.createContext(webRTCAdaptorSpeedTest);
export const SpeedTestObjectContext = React.createContext(speedTestObject);



function App() {

  const { t } = useTranslation();

  const handleFullScreen = (e) => {
    if (e.target?.id === "meeting-gallery") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  window.showNotification = (message) => {
    console.log("show notification for message: " + message);

  }

  React.useEffect(() => {
    window.addEventListener("dblclick", handleFullScreen);

    // cleanup this component
    return () => {
      window.removeEventListener("dblclick", handleFullScreen);
    };
  }, []);
  // "#d2c8f1", "#323135", "#000", "#1b1b1b", "white"
  return (
    <ThemeProvider theme={theme()}>
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
        <SpeedTestObjectContext.Provider value={speedTestObject}>
          <AntmediaSpeedTestContext.Provider value={webRTCAdaptorSpeedTest}>
            <AntmediaAdminContext.Provider value={webRTCAdaptorForAdmin}>
              <AntmediaContext.Provider value={webRTCAdaptor}>
                <CustomRoutes />
              </AntmediaContext.Provider>
            </AntmediaAdminContext.Provider>
          </AntmediaSpeedTestContext.Provider>
        </SpeedTestObjectContext.Provider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
