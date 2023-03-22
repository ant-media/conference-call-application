import React, { useContext, useEffect, useState } from "react";
import {Button, DialogActions, DialogContentText, Grid, IconButton} from "@mui/material";
import { useParams } from "react-router-dom";
import { AntmediaContext, AntmediaAdminContext } from "App";
import _ from "lodash";
import WaitingRoom from "./WaitingRoom";
import MeetingRoom from "./MeetingRoom";
import MessageDrawer from "Components/MessageDrawer";
import { useSnackbar } from "notistack";
import { SnackbarProvider } from "notistack";
import AntSnackBar from "Components/AntSnackBar";
import LeftTheRoom from "./LeftTheRoom";
import {VideoEffect} from "@antmedia/webrtc_adaptor/dist/video-effect";
import {SvgIcon} from "../Components/SvgIcon";
import ParticipantListDrawer from "../Components/ParticipantListDrawer";
import DialogContent from "@mui/material/DialogContent";
import Dialog from "@mui/material/Dialog";

export const SettingsContext = React.createContext(null);
export const MediaSettingsContext = React.createContext(null);

const globals = {
  //this settings is to keep consistent with the sdk until backend for the app is setup
  // maxVideoTrackCount is the tracks i can see excluding my own local video.so the use is actually seeing 3 videos when their own local video is included.
  maxVideoTrackCount: 5,
  trackEvents:[],
};

const JoinModes = {
  MULTITRACK: "multitrack",
  MCU: "mcu"
}

function AntMedia() {
  const { id } = useParams();
  const roomName = id;
  const antmedia = useContext(AntmediaContext);
  antmedia.roomName = roomName;
  const antmediaadmin = useContext(AntmediaAdminContext);

  // drawerOpen for message components.
  const [messageDrawerOpen, setMessageDrawerOpen] = useState(false);

  // drawerOpen for participant list components.
  const [participantListDrawerOpen, setParticipantListDrawerOpen] = useState(false);


  // whenever i join the room, i will get my unique id and stream settings from webRTC.
  // So that whenever i did something i will inform other participants that this action belongs to me by sending my streamId.
  const [myLocalData, setMyLocalData] = useState(null);

  // this is my own name when i enter the room.
  const [streamName, setStreamName] = useState("");

  // this is for checking if i am sharing my screen with other participants.
  const [isScreenShared, setIsScreenShared] = useState(false);

  //we are going to store number of unread messages to display on screen if user has not opened message component.
  const [numberOfUnReadMessages, setNumberOfUnReadMessages] = useState(0);

  // pinned screen this could be by you or by shared screen.
  const [pinnedVideoId, setPinnedVideoId] = useState(null);

  const [roomJoinMode, setRoomJoinMode] = useState(JoinModes.MULTITRACK);

  const [screenSharedVideoId, setScreenSharedVideoId] = useState(null);
  const [waitingOrMeetingRoom, setWaitingOrMeetingRoom] = useState("waiting");
  const [leftTheRoom, setLeftTheRoom] = useState(false);
  // { id: "", track:{} },
  const [participants, setParticipants] = useState([]);
  const [allParticipants, setAllParticipants] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [mic, setMic] = useState([]);
  const [talkers, setTalkers] = useState([]);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedCamera, setSelectedCamera] = React.useState("");
  const [selectedMicrophone, setSelectedMicrophone] = React.useState("");
  const [selectedBackgroundMode, setSelectedBackgroundMode] = React.useState("");
  const [isVideoEffectRunning, setIsVideoEffectRunning] = React.useState(false);
  const [virtualBackground, setVirtualBackground] = React.useState(null);
  const timeoutRef = React.useRef(null);
  const [presenters, setPresenters] = useState([]);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [openRequestBecomeSpeakerDialog, setOpenRequestBecomeSpeakerDialog] = React.useState(false);
  const [requestingSpeakerName, setRequestingSpeakerName] = React.useState("");

  const [speedTestBeforeLogin, setSpeedTestBeforeLogin] = useState(true);
  const [speedTestBeforeLoginModal, setSpeedTestBeforeLoginModal] = useState(false);

  const [messages, setMessages] = useState([]);
  const [observerMode, setObserverMode] = useState(false);


  function makeParticipantPresenter(id) {
    if (id === 'localVideo') {
      return;
    }
    console.log("makeParticipantPresenter", id);
    const appName = window.location.pathname.substring(
        0,
        window.location.pathname.lastIndexOf("/") + 1
    ).replaceAll('/','');
    const baseUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/" + appName;
    //const baseUrl = "http://localhost:5080/Conference";
    const requestOptions0 = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    };
    const requestOptions1 = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };
    fetch( baseUrl+ "/rest/v2/broadcasts/conference-rooms/" + roomName + "listener/add?streamId=" + id, requestOptions0).then(
        () => {
          fetch(baseUrl + "/rest/v2/broadcasts/" + roomName + "listener/subtrack?id=" + id, requestOptions1).then(() => {
            presenters.push(id);
            setPresenters(presenters);
          });
        }
    )
  }
  function makeParticipantUndoPresenter(id) {
    if (id === 'localVideo') {
      return;
    }
    console.log("makeParticipantUndoPresenter", id);
    const appName = window.location.pathname.substring(
        0,
        window.location.pathname.lastIndexOf("/") + 1
    ).replaceAll('/','');
    const baseUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/" + appName;
    //const baseUrl = "http://localhost:5080/Conference";
    const requestOptions0 = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    };
    const requestOptions2 = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };
    fetch(baseUrl + "/rest/v2/broadcasts/" + roomName + "listener", requestOptions2).then((response) => response.json()).then((broadcast) => {
      const index = broadcast.subTrackStreamIds.indexOf(id);
      if (index > -1) {
        broadcast.subTrackStreamIds.splice(index, 1);
      }
      const requestOptions1 = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcast)
      };
      fetch(baseUrl + "/rest/v2/broadcasts/" + roomName + "listener", requestOptions1).then(() => {
        fetch( baseUrl+ "/rest/v2/broadcasts/conference-rooms/" + roomName + "listener/delete?streamId=" + id, requestOptions0).then( () => {
          presenters.splice(presenters.indexOf(id), 1);
          setPresenters(presenters);
          antmedia.handleSendMessage("admin*listener_room*"+id+"*STOP_PLAYING");
        });
      });
    });
  }

  function turnObserverModeOn() {
    setObserverMode(true);
  }

  const [cam, setCam] = useState([
    {
      eventStreamId: "localVideo",
      isCameraOn: true, //start with camera on
    },
  ]);
  function pinVideo(id, videoLabelProp = "") {
    // id is for pinning user.
    let videoLabel = videoLabelProp;
    if (videoLabel === "") {
      // if videoLabel is missing select the first videoLabel you find
      // 1 -2 -3 -4 -5 -6 -7 -8 -9
      videoLabel = participants.find((p) => p.videoLabel !== p.id).videoLabel;
    }
    // if we already pin the targeted user then we are going to remove it from pinned video.
    if (pinnedVideoId === id) {
      setPinnedVideoId(null);
      handleNotifyUnpinUser(id);
      antmedia.assignVideoTrack(videoLabel, id, false);
    }
    // if there is no pinned video we are gonna pin the targeted user.
    // and we need to inform pinned user.
    else {
      setPinnedVideoId(id);
      handleNotifyPinUser(id);
      antmedia.assignVideoTrack(videoLabel, id, true);
    }
  }

  function handleNotifyPinUser(id) {
    // If I PIN USER then i am going to inform pinned user.
    // Why? Because if i pin someone, pinned user's resolution has to change for better visibility.
    handleSendNotificationEvent("PIN_USER", myLocalData.streamId, {
      streamId: id,
    });
  }

  function handleNotifyUnpinUser(id) {
    // If I UNPIN USER then i am going to inform pinned user.
    // Why? We need to decrease resolution for pinned user's internet usage.
    handleSendNotificationEvent("UNPIN_USER", myLocalData.streamId, {
      streamId: id,
    });
  }

  function handleSetInitialMaxVideoTrackCount(maxTrackCount) {
    globals.maxVideoTrackCount = maxTrackCount;
    console.log("Initial max video track count:"+maxTrackCount);
  }

  function handleSetMaxVideoTrackCount(maxTrackCount) {
    // I am changing maximum participant number on the screen. Default is 3.
    if (myLocalData?.streamId) {
      antmedia.setMaxVideoTrackCount(myLocalData.streamId, maxTrackCount);
      globals.maxVideoTrackCount = maxTrackCount;
    }
  }

  function enableDisableMCU(isMCUEnabled) {
    if (isMCUEnabled) {
      setRoomJoinMode(JoinModes.MCU);
    } else {
      setRoomJoinMode(JoinModes.MULTITRACK);
    }
  }
  function handleStartScreenShare() {
    antmedia.switchDesktopCapture(myLocalData.streamId)
    .then(()=>{
      screenShareOnNotification();
    });
  }
  function screenShareOffNotification() {
    antmedia.handleSendNotificationEvent(
      "SCREEN_SHARED_OFF",
      myLocalData.streamId
    );
    //if i stop my screen share and if i have pin someone different from myself it just should not effect my pinned video.
    if (pinnedVideoId === "localVideo") {
      setPinnedVideoId(null);
    }
  }
  function screenShareOnNotification() {
    setIsScreenShared(true);
    antmedia.screenShareOffNotification();
    let requestedMediaConstraints = {
      width: 1920,
      height: 1080,
    };
    antmedia.applyConstraints(myLocalData.streamId, requestedMediaConstraints);
    antmedia.handleSendNotificationEvent(
      "SCREEN_SHARED_ON",
      myLocalData.streamId
    );

    setPinnedVideoId("localVideo");
    // send fake audio level to get screen sharing user on a videotrack
    // TODO: antmedia.updateAudioLevel(myLocalData.streamId, 10);
  }

  function askForBecomingPublisher(listenerName) {
    setRequestingSpeakerName(listenerName);
    setOpenRequestBecomeSpeakerDialog(true);
  }

  function displayPoorNetworkConnectionWarning() {
    enqueueSnackbar(
        {
          message: "Your connection is not stable. Please check your internet connection!",
          variant: "info",
          icon: <SvgIcon size={24} name={'report'} color="red" />
        },
        {
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
        }
    );
  }
  function handleScreenshareNotFromPlatform() {
    setIsScreenShared(false);
    if (
      cam.find(
        (c) => c.eventStreamId === "localVideo" && c.isCameraOn === false
      )
    ) {
      antmedia.turnOffLocalCamera(myLocalData.streamId);
    } else {
      antmedia.switchVideoCameraCapture(myLocalData.streamId);
    }
    antmedia.screenShareOffNotification();
    let requestedMediaConstraints = {
      width: 320,
      height: 240,
    };
    antmedia.applyConstraints(myLocalData.streamId, requestedMediaConstraints);
  }
  function handleStopScreenShare() {
    setIsScreenShared(false);
    if (
      cam.find(
        (c) => c.eventStreamId === "localVideo" && c.isCameraOn === false
      )
    ) {
      antmedia.turnOffLocalCamera(myLocalData.streamId);
    } else {
      antmedia.switchVideoCameraCapture(myLocalData.streamId);

      // isCameraOff = true;
    }
    antmedia.screenShareOffNotification();
  }
  function handleSetMessages(newMessage) {
    setMessages((oldMessages) => {
      let lastMessage = oldMessages[oldMessages.length - 1]; //this must remain mutable
      const isSameUser = lastMessage?.name === newMessage?.name;
      const sentInSameTime = lastMessage?.date === newMessage?.date;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      newMessage.date = new Date(newMessage?.date).toLocaleString(getLang(), { timeZone: timezone, hour: "2-digit", minute: "2-digit" });

      if (isSameUser && sentInSameTime) {
        //group the messages *sent back to back in the same timeframe by the same user* by joinig the new message text with new line
        lastMessage.message = lastMessage.message + "\n" + newMessage.message;
        return [...oldMessages]; // don't make this "return oldMessages;" this is to trigger the useEffect for scroll bottom and get over showing the last prev state do
      } else {
        return [...oldMessages, newMessage];
      }
    });
  }

  function getLang() {
    if (navigator.languages !== undefined)
      return navigator.languages[0];
    return navigator.language;
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    let objDiv = document.getElementById("paper-props");
    if (objDiv) objDiv.scrollTop = objDiv?.scrollHeight;
  }
  function handleMessageDrawerOpen(open) {
    closeSnackbar();
    setMessageDrawerOpen(open);
    if (open) {
      setParticipantListDrawerOpen(false);
    }
  }

  function handleParticipantListOpen(open) {
    setParticipantListDrawerOpen(open);
    if (open) {
      setMessageDrawerOpen(false);
    }
  }

  function handleSendMessage(message) {
    if (myLocalData.streamId) {
      let iceState = antmedia.iceConnectionState(myLocalData.streamId);
      if (
        iceState !== null &&
        iceState !== "failed" &&
        iceState !== "disconnected"
      ) {
        let commandList = message.split('*');
        if (commandList.length > 3 && commandList[0] === "admin" && antmedia.admin && antmedia.admin === true) {
          if (commandList[1] === "publisher_room") {
            antmedia.sendData(myLocalData.streamId,
                JSON.stringify({
                  streamId: commandList[2],
                  eventType: commandList[3]
                }));
          } else if (commandList[1] === "listener_room") {
            antmediaadmin.sendData(myLocalData.streamId + "listener",
                JSON.stringify({
                  streamId: commandList[2],
                  eventType: commandList[3]
                }));
          }
          return;
        } else if (commandList.length > 2 && commandList[0] === "listener" && antmedia.onlyDataChannel && antmedia.onlyDataChannel === true) {
          antmedia.sendData(myLocalData.streamId,
              JSON.stringify({
                streamId: commandList[1],
                eventType: commandList[2]
              }));
          return;
        }
        if(message === "debugme") {
          antmedia.getDebugInfo(myLocalData.streamId);
          return;
        }

        antmedia.sendData(
          myLocalData.streamId,
          JSON.stringify({
            eventType: "MESSAGE_RECEIVED",
            message: message,
            name: streamName,
            date: new Date().toString()
          })
        );
      }
    }
  }

  function handleDebugInfo(debugInfo) {
    var infoText = "Client Debug Info\n";
    infoText += "Events:\n";
    infoText += JSON.stringify(globals.trackEvents)+"\n";
    infoText += "Participants ("+participants.length+"):\n";
    infoText += JSON.stringify(participants)+"\n";
    infoText += "----------------------\n";
    infoText += debugInfo;

    //fake message to add chat
    var obj = {
      streamId: myLocalData.streamId,
      data: JSON.stringify({
        eventType: "MESSAGE_RECEIVED",
        name: "Debugger",
        date: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        message: infoText,
      }),
    };

    handleNotificationEvent(obj);
  }

  function toggleSetCam(data) {
    setCam((camList) => {
      let arr = _.cloneDeep(camList);
      let camObj = arr.find((c) => c.eventStreamId === data.eventStreamId);

      if (camObj) {
        camObj.isCameraOn = data.isCameraOn;
      } else {
        arr.push(data);
      }

      return arr;
    });
  }

  function toggleSetMic(data) {
    setMic((micList) => {
      let arr = _.cloneDeep(micList);
      let micObj = arr.find((c) => c.eventStreamId === data.eventStreamId);

      if (micObj) {
        micObj.isMicMuted = data.isMicMuted;
      } else {
        arr.push(data);
      }

      return arr;
    });
  }
  function toggleSetNumberOfUnreadMessages(numb) {
    setNumberOfUnReadMessages(numb);
  }

  function handleNotificationEvent(obj) {
    var notificationEvent = JSON.parse(obj.data);
    if (notificationEvent != null && typeof notificationEvent == "object") {
      var eventStreamId = notificationEvent.streamId;
      var eventType = notificationEvent.eventType;

      if (eventType === "CAM_TURNED_OFF") {
        toggleSetCam({
          eventStreamId: eventStreamId,
          isCameraOn: false,
        });
      } else if (eventType === "CAM_TURNED_ON") {
        toggleSetCam({
          eventStreamId: eventStreamId,
          isCameraOn: true,
        });
      } else if (eventType === "MIC_MUTED") {
        toggleSetMic({
          eventStreamId: eventStreamId,
          isMicMuted: true,
        });
      } else if (eventType === "MIC_UNMUTED") {
        toggleSetMic({
          eventStreamId: eventStreamId,
          isMicMuted: false,
        });
      } else if (eventType === "MESSAGE_RECEIVED") {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        notificationEvent.date = new Date(notificationEvent?.date).toLocaleString(getLang(), { timeZone: timezone, hour: "2-digit", minute: "2-digit" });
        // if message arrives.
        // if there is an new message and user has not opened message component then we are going to increase number of unread messages by one.
        // we are gonna also send snackbar.
        if (!messageDrawerOpen) {
          enqueueSnackbar(
            {
              sender: notificationEvent.name,
              message: notificationEvent.message,
              variant: "message",
              onClick: () => {
                handleMessageDrawerOpen(true);
                setNumberOfUnReadMessages(0);
              },
            },
            {
              autoHideDuration: 5000,
              anchorOrigin: {
                vertical: "top",
                horizontal: "right",
              },
            }
          );
          setNumberOfUnReadMessages((numb) => numb + 1);
        }
        setMessages((oldMessages) => {
          let lastMessage = oldMessages[oldMessages.length - 1]; //this must remain mutable
          const isSameUser = lastMessage?.name === notificationEvent?.name;
          const sentInSameTime = lastMessage?.date === notificationEvent?.date;

          if (isSameUser && sentInSameTime) {
            //group the messages *sent back to back in the same timeframe by the same user* by joinig the new message text with new line
            lastMessage.message =
              lastMessage.message + "\n" + notificationEvent.message;
            return [...oldMessages]; // dont make this "return oldMessages;" this is to trigger the useEffect for scroll bottom and get over showing the last prev state do
          } else {
            return [...oldMessages, notificationEvent];
          }
        });
      } else if (eventType === "SCREEN_SHARED_ON") {
        let videoLab = participants.find((p) => p.id === eventStreamId)
          ?.videoLabel
          ? participants.find((p) => p.id === eventStreamId).videoLabel
          : "";
        pinVideo(eventStreamId, videoLab);
        setScreenSharedVideoId(eventStreamId);
      } else if (eventType === "SCREEN_SHARED_OFF") {
        setScreenSharedVideoId(null);
        setPinnedVideoId(null);
      } else if (eventType === "UPDATE_STATUS") {
        setUserStatus(notificationEvent, eventStreamId);
      } else if (eventType === "PIN_USER") {
        if (
          notificationEvent.streamId === myLocalData.streamId &&
          !isScreenShared
        ) {
          let requestedMediaConstraints = {
            width: 640,
            height: 480,
          };
          antmedia.applyConstraints(
            myLocalData.streamId,
            requestedMediaConstraints
          );
        }
      } else if (eventType === "UNPIN_USER") {
        if (
          notificationEvent.streamId === myLocalData.streamId &&
          !isScreenShared
        ) {
          let requestedMediaConstraints = {
            width: 320,
            height: 240,
          };
          antmedia.applyConstraints(
            myLocalData.streamId,
            requestedMediaConstraints
          );
        }
      } else if (eventType === "VIDEO_TRACK_ASSIGNMENT_CHANGE") {
        console.log(JSON.stringify(obj));
        if (!notificationEvent.payload.trackId) {
          return;
        }
        setParticipants((oldParticipants) => {
          return oldParticipants
            .filter(
              (p) =>
                p.videoLabel === notificationEvent.payload.videoLabel ||
                p.id !== notificationEvent.payload.trackId
            )
            .map((p) => {
              if (
                p.videoLabel === notificationEvent.payload.videoLabel &&
                p.id !== notificationEvent.payload.trackId
              ) {
                return {
                  ...p,
                  id: notificationEvent.payload.trackId,
                  oldId: p.id,
                };
              }
              return p;
            });
        });
      } else if (eventType === "AUDIO_TRACK_ASSIGNMENT") {
        clearInterval(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setTalkers([]);
        }, 1000);
        setTalkers((oldTalkers) => {
          const newTalkers = notificationEvent.payload
            .filter(
              (p) =>
                p.trackId !== "" &&
                screenSharedVideoId !== p.trackId &&
                p.audioLevel !== 0
            )
            .map((p) => p.trackId);
          return _.isEqual(oldTalkers, newTalkers) ? oldTalkers : newTalkers;
        });
      }
    }
  }
  function setUserStatus(notificationEvent, eventStreamId) {
    if (notificationEvent.isScreenShared) {
      // if the participant was already pin someone than we should not update it
      if (!screenSharedVideoId) {
        setScreenSharedVideoId(eventStreamId);
        let videoLab = participants.find((p) => p.id === eventStreamId)
          ?.videoLabel
          ? participants.find((p) => p.id === eventStreamId).videoLabel
          : "";
        pinVideo(eventStreamId, videoLab);
      }
    }

    if (!isScreenShared && participants.find((p) => p.id === eventStreamId)) {
      if (!mic.find((m) => m.eventStreamId === eventStreamId)) {
        toggleSetMic({
          eventStreamId: eventStreamId,
          isMicMuted: notificationEvent.mic,
        });
      }
      if (!cam.find((m) => m.eventStreamId === eventStreamId)) {
        toggleSetCam({
          eventStreamId: eventStreamId,
          isCameraOn: notificationEvent.camera,
        });
      }
    }
  }
  function handleLeaveFromRoom() {
    // we need to empty participant array. i f we are going to leave it in the first place.
    setParticipants([]);
    antmedia.leaveFromRoom(roomName);
    antmedia.turnOffLocalCamera(myLocalData.streamId);
    setWaitingOrMeetingRoom("waiting");
  }
  function handleSendNotificationEvent(eventType, publishStreamId, info) {
    let notEvent = {
      streamId: publishStreamId,
      eventType: eventType,
      ...(info ? info : {}),
    };
    antmedia.sendData(publishStreamId, JSON.stringify(notEvent));
  }
  function handleRoomInfo(publishStreamId) {
    antmedia.getRoomInfo(roomName, publishStreamId);
    setIsPublished(true);
  }

  function updateStatus(obj) {
    if (roomName !== obj) {
      handleSendNotificationEvent("UPDATE_STATUS", myLocalData.streamId, {
        mic: !!mic.find((c) => c.eventStreamId === "localVideo")?.isMicMuted,
        camera: !!cam.find((c) => c.eventStreamId === "localVideo")?.isCameraOn,
        isPinned:
          pinnedVideoId === "localVideo" ? myLocalData.streamId : pinnedVideoId,
        isScreenShared: isScreenShared,
      });
    }
  }
  function handleSetMyObj(obj) {
    handleSetInitialMaxVideoTrackCount(obj.maxTrackCount);
    setMyLocalData({ ...obj, streamName });
  }
  function handlePlay(token, tempList) {
    antmedia.play(roomName, token, roomName, tempList);
  }
  function handleStreamInformation(tokenPlay, obj) {
    antmedia.play(obj.streamId, tokenPlay, roomName);
  }
  function handlePublish(publishStreamId, token, subscriberId, subscriberCode) {
    antmedia.publish(
      publishStreamId,
      token,
      subscriberId,
      subscriberCode,
      streamName,
      roomName,
      "{someKey:somveValue}"
    );
  }
  function handlePlayVideo(obj, publishStreamId) {
    let index = obj?.trackId?.substring("ARDAMSx".length);
    globals.trackEvents.push({track:obj.track.id, event:"added"});

    if (obj.track.kind === "audio") {
      setAudioTracks((sat) => {
        return [
          ...sat,
          {
            id: index,
            track: obj.track,
            streamId: obj.streamId,
          },
        ];
      });
      return;
    }
    if (index === publishStreamId) {
      return;
    }
    if (index === roomName) {
      return;
    } else {
      if (obj?.trackId && !participants.some((p) => p.id === index)) {
        setParticipants((spp) => {
          return [
            ...spp.filter((p) => p.id !== index),
            {
              id: index,
              videoLabel: index,
              track: obj.track,
              streamId: obj.streamId,
              isCameraOn: true,
              name: "",
            },
          ];
        });
      }
    }
  }

  function setVirtualBackgroundImage(imageUrl) {
    let virtualBackgroundImage = document.createElement("img");
    virtualBackgroundImage.id = "virtualBackgroundImage";
    virtualBackgroundImage.style.visibility = "hidden";
    virtualBackgroundImage.alt = "virtual-background";

    if (imageUrl !== undefined && imageUrl !== null && imageUrl !== "") {
        virtualBackgroundImage.src = imageUrl;
    } else {
      virtualBackgroundImage.src = "virtual-background.png";
    }

    setVirtualBackground(virtualBackgroundImage);
    antmedia.setBackgroundImage(virtualBackgroundImage);
  }

  function handleBackgroundReplacement(option) {
    let effectName;

    if(option === "none") {
      effectName = VideoEffect.NO_EFFECT;
      setIsVideoEffectRunning(false);
    }
    else if(option === "blur") {
      effectName = VideoEffect.BLUR_BACKGROUND;
      setIsVideoEffectRunning(true);
    }
    else if(option === "background") {
      if (virtualBackground === null) {
        setVirtualBackgroundImage(null);
      }
      effectName = VideoEffect.VIRTUAL_BACKGROUND
      setIsVideoEffectRunning(true);
    }
    antmedia.enableEffect(effectName).then(() => {
      console.log("Effect: "+ effectName+" is enabled");
    }).catch(err => {
      console.error("Effect: "+ effectName+" is not enabled. Error is " + err);
      setIsVideoEffectRunning(false);
    });
  }
  function checkAndTurnOnLocalCamera(streamId) {
    if(isVideoEffectRunning) {
      antmedia.mediaManager.localStream.getVideoTracks()[0].enabled = true;
    }
    else {
      antmedia.turnOnLocalCamera(streamId);
    }
  }

  function checkAndTurnOffLocalCamera(streamId) {
    if(isVideoEffectRunning) {
      antmedia.mediaManager.localStream.getVideoTracks()[0].enabled = false;
    }
    else {
      antmedia.turnOffLocalCamera(streamId);
    }
  }
  function handleRoomEvents({ streams, streamList }) {
    // [allParticipant, setAllParticipants] => list of every user
    setAllParticipants(streamList);
    // [participants,setParticipants] => number of visible participants due to tile count. If tile count is 3
    // then number of participants will be 3.
    // We are basically, finding names and match the names with the particular videos.
    // We do this because we can't get names from other functions.
    setParticipants((oldParts) => {
      if (streams.length < participants.length) {
        return oldParts.filter((p) => streams.includes(p.id));
      }
      // matching the names.
      return oldParts.map((p) => {
        const newName = streamList.find((s) => s.streamId === p.id)?.streamName;
        if (p.name !== newName) {
          return { ...p, name: newName };
        }
        return p;
      });
    });
    if (pinnedVideoId !== "localVideo" && !streams.includes(pinnedVideoId)) {
      setPinnedVideoId(null);
    }
  }

  function getSelectedDevices() {
    let devices = {
      videoDeviceId: selectedCamera,
      audioDeviceId: selectedMicrophone
    }
    return devices;
  }

  function setSelectedDevices(devices) {
    if (devices.videoDeviceId !== null && devices.videoDeviceId !== undefined) {
      setSelectedCamera(devices.videoDeviceId);
    }
    if (devices.audioDeviceId !== null && devices.audioDeviceId !== undefined) {
      setSelectedMicrophone(devices.audioDeviceId);
    }
  }

  function approveBecomeSpeakerRequest() {
    setOpenRequestBecomeSpeakerDialog(false);
    const appName = window.location.pathname.substring(
        0,
        window.location.pathname.lastIndexOf("/") + 1
    ).replaceAll('/','');
    const baseUrl = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/" + appName;
    //const baseUrl = "http://localhost:5080/Conference";
    let command = {
      "eventType": "GRANT_BECOME_PUBLISHER",
      "streamId": requestingSpeakerName,
    }
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    };
    fetch( baseUrl+ "/rest/v2/broadcasts/" + requestingSpeakerName + "/data", requestOptions).then(() => {});
  }

  function resetAllParticipants() {
    setAllParticipants([]);
  }

  function getAllParticipants() {
    return allParticipants;
  }

  function resetPartipants() {
    setParticipants([]);
  }

  // START custom functions
  antmedia.handlePlayVideo = handlePlayVideo;
  antmedia.handleRoomEvents = handleRoomEvents;
  antmedia.handlePublish = handlePublish;
  antmedia.handleStreamInformation = handleStreamInformation;
  antmedia.handlePlay = handlePlay;
  antmedia.handleRoomInfo = handleRoomInfo;
  antmedia.updateStatus = updateStatus;
  antmedia.handleSetMyObj = handleSetMyObj;
  antmedia.handleSendNotificationEvent = handleSendNotificationEvent;
  antmedia.handleNotificationEvent = handleNotificationEvent;
  antmedia.handleLeaveFromRoom = handleLeaveFromRoom;
  antmedia.handleSendMessage = handleSendMessage;
  antmedia.screenShareOffNotification = screenShareOffNotification;
  antmedia.screenShareOnNotification = screenShareOnNotification;
  antmedia.handleStartScreenShare = handleStartScreenShare;
  antmedia.enableDisableMCU = enableDisableMCU;
  antmedia.handleStopScreenShare = handleStopScreenShare;
  antmedia.handleScreenshareNotFromPlatform = handleScreenshareNotFromPlatform;
  antmedia.displayPoorNetworkConnectionWarning = displayPoorNetworkConnectionWarning;
  antmedia.handleNotifyPinUser = handleNotifyPinUser;
  antmedia.handleNotifyUnpinUser = handleNotifyUnpinUser;
  antmedia.handleSetMaxVideoTrackCount = handleSetMaxVideoTrackCount;
  antmedia.handleDebugInfo = handleDebugInfo;
  antmedia.handleBackgroundReplacement = handleBackgroundReplacement;
  antmedia.checkAndTurnOnLocalCamera = checkAndTurnOnLocalCamera;
  antmedia.checkAndTurnOffLocalCamera = checkAndTurnOffLocalCamera;
  antmedia.getSelectedDevices = getSelectedDevices;
  antmedia.setSelectedDevices = setSelectedDevices;
  antmedia.getAllParticipants = getAllParticipants;
  antmedia.resetAllParticipants = resetAllParticipants;
  antmedia.resetPartipants = resetPartipants;
  antmedia.toggleSetCam = toggleSetCam;
  antmedia.toggleSetMic = toggleSetMic;
  antmedia.turnObserverModeOn = turnObserverModeOn;
  antmedia.askForBecomingPublisher = askForBecomingPublisher;
  // END custom functions
  return (
    <Grid container className="App">
      <Grid
        container
        className="App-header"
        justifyContent="center"
        alignItems={"center"}
      >
        <MediaSettingsContext.Provider
          value={{
            isScreenShared,
            mic,
            cam,
            talkers,
            toggleSetCam,
            toggleSetMic,
            myLocalData,
            handleMessageDrawerOpen,
            handleParticipantListOpen,
            screenSharedVideoId,
            roomJoinMode,
            audioTracks,
            isPublished,
            speedTestBeforeLogin,
            setSpeedTestBeforeLogin,
            speedTestBeforeLoginModal,
            setSpeedTestBeforeLoginModal,
            setSelectedCamera,
            selectedCamera,
            selectedMicrophone,
            setSelectedMicrophone,
            selectedBackgroundMode,
            setSelectedBackgroundMode,
            setIsVideoEffectRunning,
            setParticipants,
            participants,
            setLeftTheRoom,
            observerMode,
          }}
        >
          <Dialog
              open={openRequestBecomeSpeakerDialog}
              onClose={()=>{setOpenRequestBecomeSpeakerDialog(false)}}
              aria-labelledby="scroll-dialog-title"
              aria-describedby="scroll-dialog-description"
          >
            <DialogContent dividers={false}>
              <DialogContentText
                  id="scroll-dialog-description"
                  ref={null}
                  tabIndex={-1}
              >
                {requestingSpeakerName} wants to become a speaker. Do you want to approve?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>{setOpenRequestBecomeSpeakerDialog(false)}}>Deny</Button>
              <Button onClick={()=>{approveBecomeSpeakerRequest()}}>Approve</Button>
            </DialogActions>
          </Dialog>
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
            {leftTheRoom ? (
              <LeftTheRoom />
            ) : waitingOrMeetingRoom === "waiting" ? (
              <WaitingRoom
                streamName={streamName}
                handleStreamName={(name) => setStreamName(name)}
                handleChangeRoomStatus={(status) =>
                  setWaitingOrMeetingRoom(status)
                }
              />
            ) : (
              <SettingsContext.Provider
                value={{
                  mic,
                  cam,
                  toggleSetCam,
                  messageDrawerOpen,
                  handleMessageDrawerOpen,
                  participantListDrawerOpen,
                  handleParticipantListOpen,
                  makeParticipantPresenter,
                  makeParticipantUndoPresenter,
                  handleSetMessages,
                  messages,
                  toggleSetNumberOfUnreadMessages,
                  numberOfUnReadMessages,
                  pinVideo,
                  pinnedVideoId,
                  screenSharedVideoId,
                  roomJoinMode,
                  audioTracks,
                  allParticipants,
                  presenters,
                  globals,
                  observerMode,
                }}
              >
                <>
                  <MeetingRoom
                    participants={participants}
                    allParticipants={allParticipants}
                    myLocalData={myLocalData}
                  />
                  <MessageDrawer messageDrawerOpen={messageDrawerOpen} messages={messages} />
                  <ParticipantListDrawer participantListDrawerOpen={participantListDrawerOpen} />
                </>
              </SettingsContext.Provider>
            )}
          </SnackbarProvider>
        </MediaSettingsContext.Provider>
      </Grid>
    </Grid>
  );
}

export default AntMedia;
