import "./App.css";
/* eslint-disable eqeqeq */
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./styles/theme";
import React from "react";
import { WebRTCAdaptor } from "@antmedia/webrtc_adaptor";
import { getUrlParameter } from "@antmedia/webrtc_adaptor/dist/fetch.stream";
import { SnackbarProvider } from "notistack";
import AntSnackBar from "Components/AntSnackBar";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import i18n from "i18next";
import translationEN from "i18n/en.json";
import translationTR from "i18n/tr.json";
import CustomRoutes from "CustomRoutes";

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

var playToken = getUrlParameter("playToken");
var publishToken = getUrlParameter("publishToken");
var mcuEnabled = getUrlParameter("mcuEnabled");
var publishStreamId = getUrlParameter("streamId");
var playOnly = getUrlParameter("playOnly");
var subscriberId = getUrlParameter("subscriberId");
var subscriberCode = getUrlParameter("subscriberCode");
var isPlaying = false;
var fullScreenId = -1;

if (mcuEnabled == null) {
    mcuEnabled = false;
}

if (playToken == null) {
  playToken = "";
}

if (publishToken == null) {
  publishToken = "";
}

if (playOnly == null) {
  playOnly = false;
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
  let selectedDevices = webRTCAdaptor.getSelectedDevices();
  let currentCameraDeviceId = selectedDevices.videoDeviceId;
  let currentAudioDeviceId = selectedDevices.audioDeviceId;

  // check if the selected devices are still available
  for(let index = 0; index < webRTCAdaptor.devices.length; index++) {
    if (webRTCAdaptor.devices[index].kind == "videoinput" && webRTCAdaptor.devices[index].deviceId == selectedDevices.videoDeviceId) {
      isVideoDeviceAvailable = true;
    }
    if (webRTCAdaptor.devices[index].kind == "audioinput" && webRTCAdaptor.devices[index].deviceId == selectedDevices.audioDeviceId) {
      isAudioDeviceAvailable = true;
    }
  }

  // if the selected devices are not available, select the first available device
  if (selectedDevices.videoDeviceId == '' || isVideoDeviceAvailable == false) {
    const camera = webRTCAdaptor.devices.find(d => d.kind === 'videoinput');
    if (camera) {
      selectedDevices.videoDeviceId = camera.deviceId;
    }
  }
  if (selectedDevices.audioDeviceId == '' || isAudioDeviceAvailable == false) {
    const audio = webRTCAdaptor.devices.find(d => d.kind === 'audioinput');
    if (audio) {
      selectedDevices.audioDeviceId = audio.deviceId;
    }
  }

  webRTCAdaptor.setSelectedDevices(selectedDevices);

  if (currentCameraDeviceId !== selectedDevices.videoDeviceId) {
    webRTCAdaptor.switchVideoCameraCapture(publishStreamId, selectedDevices.videoDeviceId);
  }
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

const webRTCAdaptor = new WebRTCAdaptor({
  websocket_url: websocketURL,
  mediaConstraints: mediaConstraints,
  isPlayMode: playOnly,
  dataChannelEnabled: true,
  debug: true,
  callback: (info, obj) => {
    if (info === "initialized") {
      webRTCAdaptor.enableDisableMCU(mcuEnabled);
    } else if (info === "joinedTheRoom") {
      var room = obj.ATTR_ROOM_NAME;
      roomOfStream[obj.streamId] = room;

      publishStreamId = obj.streamId;

      webRTCAdaptor.handleSetMyObj(obj);
      let streamDetailsList = obj.streamList;

      if (playOnly)  {
        webRTCAdaptor.play(obj.ATTR_ROOM_NAME, playToken, obj.ATTR_ROOM_NAME, streamDetailsList, subscriberId, subscriberCode);
      } else {
        webRTCAdaptor.handlePublish(
            obj.streamId,
            publishToken,
            subscriberId,
            subscriberCode
        );
      }

      roomTimerId = setInterval(() => {
        webRTCAdaptor.handleRoomInfo(publishStreamId);
      }, 5000);
    } else if (info === "newStreamAvailable") {
      webRTCAdaptor.handlePlayVideo(obj, publishStreamId);
    } else if (info === "publish_started") {
      //stream is being published
      webRTCAdaptor.enableStats(publishStreamId);
      webRTCAdaptor.handleRoomInfo(publishStreamId);
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
    } else if (info === "closed") {
    } else if (info === "play_finished") {
      isPlaying = false;
    } else if (info === "streamInformation") {
      webRTCAdaptor.handleStreamInformation(obj);
    } else if (info === "screen_share_started") {
      webRTCAdaptor.screenShareOnNotification();
    } else if (info === "roomInformation") {
      var tempList = [...obj.streams];
      tempList.push("!" + publishStreamId);
      webRTCAdaptor.handleRoomEvents(obj);
      if (!isPlaying) {
        webRTCAdaptor.handlePlay(playToken, tempList);
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
      webRTCAdaptor.handleScreenshareNotFromPlatform();
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
    } else if (error.indexOf("data_channel_error") != -1) {
      errorMessage = "There was a error during data channel communication";
    } else if (error.indexOf("ScreenSharePermissionDenied") != -1) {
      errorMessage = "You are not allowed to access screen share";
      webRTCAdaptor.handleScreenshareNotFromPlatform();
    } else if (error.indexOf("WebSocketNotConnected") != -1) {
      errorMessage = "WebSocket Connection is disconnected.";
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
        <AntmediaContext.Provider value={webRTCAdaptor}>
          <CustomRoutes />
        </AntmediaContext.Provider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
