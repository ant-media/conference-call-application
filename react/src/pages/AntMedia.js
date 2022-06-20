import React, { useContext, useEffect, useState } from "react";
import { Grid } from "@mui/material";
import { useParams } from "react-router-dom";
import { AntmediaContext } from "App";
import _ from "lodash";
import WaitingRoom from "./WaitingRoom";
import MeetingRoom from "./MeetingRoom";
import MessageDrawer from "Components/MessageDrawer";
import { useSnackbar } from "notistack";
import { SnackbarProvider } from "notistack";
import AntSnackBar from "Components/AntSnackBar";

export const SettingsContext = React.createContext(null);
export const MediaSettingsContext = React.createContext(null);

function AntMedia() {
  const { id } = useParams();
  const roomName = id;
  const antmedia = useContext(AntmediaContext);
  // drawerOpen for message components.
  const [drawerOpen, setDrawerOpen] = useState(false);
  // whenever i joined the room, i will get my unique id and stream settings from webRTC.
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

  const [screenSharedVideoId, setScreenSharedVideoId] = useState(null);
  const [waitingOrMeetingRoom, setWaitingOrMeetingRoom] = useState("waiting");
  // { id: "", track:{} },
  const [participants, setParticipants] = useState([]);
  const [allParticipants, setAllParticipants] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [mic, setMic] = useState([]);
  const [talkers, setTalkers] = useState([]);
  const [isPublished, setIsPublished] = useState(false);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [messages, setMessages] = useState([]);

  const [cam, setCam] = useState([
    {
      eventStreamId: "localVideo",
      isCameraOn: true, //start with camera on
    },
  ]);
  function pinVideo(id, videoLabel = "") {
    if (pinnedVideoId === id) {
      setPinnedVideoId(null);
      handleNotifyUnpinUser(id);
      antmedia.assignVideoTrack(videoLabel, id, false);
    } else {
      setPinnedVideoId(id);
      handleNotifyPinUser(id);
      antmedia.assignVideoTrack(videoLabel, id, true);
    }
  }

  function handleNotifyPinUser(id) {
    console.log("PIN_USER PIN_USER PIN_USER", id);
    handleSendNotificationEvent("PIN_USER", myLocalData.streamId, {
      streamId: id,
    });
  }
  function handleNotifyUnpinUser(id) {
    handleSendNotificationEvent("UNPIN_USER", myLocalData.streamId, {
      streamId: id,
    });
  }
  function handleStartScreenShare() {
    antmedia.switchDesktopCapture(myLocalData.streamId);
    setIsScreenShared(true);
    // antmedia.screenShareOnNotification();
  }
  function screenShareOffNotification() {
    antmedia.handleSendNotificationEvent(
      "SCREEN_SHARED_OFF",
      myLocalData.streamId
    );
  }
  function screenShareOnNotification() {
    console.log(
      "screenShareOnNotificationscreenShareOnNotificationscreenShareOnNotification"
    );
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
  function handleSetMessages(msg) {
    setMessages((oldMessages) => {
      return [...oldMessages, msg];
    });
  }
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  function scrollToBottom() {
    let objDiv = document.getElementById("paper-props");
    if (objDiv) objDiv.scrollTop = objDiv?.scrollHeight;
  }
  function handleDrawerOpen(open) {
    closeSnackbar();
    setDrawerOpen(open);
  }

  function handleSendMessage(message) {
    if (myLocalData.streamId) {
      let iceState = antmedia.iceConnectionState(myLocalData.streamId);
      if (
        iceState !== null &&
        iceState !== "failed" &&
        iceState !== "disconnected"
      ) {
        console.log(
          "handleSendMessagehandleSendMessagehandleSendMessagehandleSendMessage",
          message,
          myLocalData
        );

        antmedia.sendData(
          myLocalData.streamId,
          JSON.stringify({
            eventType: "MESSAGE_RECEIVED",
            message: message,
            name: streamName,
            date: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })
        );
      }
    }
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
    console.log("CALCACLACLACLACLACLALCACLALCLCACLALCAL", notificationEvent);
    if (notificationEvent != null && typeof notificationEvent == "object") {
      var eventStreamId = notificationEvent.streamId;
      var eventType = notificationEvent.eventType;

      if (eventType === "CAM_TURNED_OFF") {
        console.log("Camera turned off for : ", eventStreamId, participants);
        toggleSetCam({
          eventStreamId: eventStreamId,
          isCameraOn: false,
        });
      } else if (eventType === "CAM_TURNED_ON") {
        console.log("Camera turned on for : ", eventStreamId);
        toggleSetCam({
          eventStreamId: eventStreamId,
          isCameraOn: true,
        });
      } else if (eventType === "MIC_MUTED") {
        console.log("Microphone muted for : ", eventStreamId);
        toggleSetMic({
          eventStreamId: eventStreamId,
          isMicMuted: true,
        });
      } else if (eventType === "MIC_UNMUTED") {
        console.log("Microphone unmuted for : ", eventStreamId);
        toggleSetMic({
          eventStreamId: eventStreamId,
          isMicMuted: false,
        });
      } else if (eventType === "MESSAGE_RECEIVED") {
        console.log("wqfwqfwqfwqfwqfwq", notificationEvent);
        // if message arrives.
        // if there is an new message and user has not opened message component then we are going to increase number of unread messages by one.
        // we are gonna also send snackbar.
        if (!drawerOpen) {
          enqueueSnackbar(
            {
              sender: notificationEvent.name,
              message: notificationEvent.message,
              variant: "message",
              onClick: () => {
                setDrawerOpen(true);
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
          return [...oldMessages, notificationEvent];
        });
      } else if (eventType === "SCREEN_SHARED_ON") {
        setScreenSharedVideoId(eventStreamId);

        setPinnedVideoId(eventStreamId);
      } else if (eventType === "SCREEN_SHARED_OFF") {
        setScreenSharedVideoId(null);
        setPinnedVideoId(null);
      } else if (eventType === "UPDATE_STATUS") {
        setUserStatus(notificationEvent, eventStreamId);
      } else if (eventType === "PIN_USER") {
        console.log("PIN_USER", notificationEvent);
        if (notificationEvent.streamId === myLocalData.streamId) {
          let requestedMediaConstraints = {
            width: 640,
            height: 480,
          };
          console.log("myLocalData.streamId", notificationEvent);
          antmedia.applyConstraints(
            myLocalData.streamId,
            requestedMediaConstraints
          );
        }
      } else if (eventType === "UNPIN_USER") {
        console.log("UNPIN_USER", notificationEvent);
        if (notificationEvent.streamId === myLocalData.streamId) {
          let requestedMediaConstraints = {
            width: 320,
            height: 240,
          };
          console.log("myLocalData.streamId", notificationEvent);
          antmedia.applyConstraints(
            myLocalData.streamId,
            requestedMediaConstraints
          );
        }
      } else if (eventType === "VIDEO_TRACK_ASSIGNMENT_CHANGE") {
        if (!notificationEvent.payload.trackId) {
          return;
        }
        let isChanged = false;
        setParticipants((oldParticipants) => {
          const newParticipants = _.cloneDeep(oldParticipants);
          newParticipants.forEach((p) => {
            if (
              p.videoLabel === notificationEvent.payload.videoLabel &&
              p.id !== notificationEvent.payload.trackId
            ) {
              p.id = notificationEvent.payload.trackId;
              isChanged = true;
            }
          });
          return isChanged ? newParticipants : oldParticipants;
        });
      } else if (eventType === "AUDIO_TRACK_ASSIGNMENT") {
        setTalkers((oldTalkers) => {
          const newTalkers = notificationEvent.payload
            .filter((p) => p.trackId !== "" && p.audioLevel > 150)
            .map((p) => p.trackId.substring("ARDAMSx".length));
          return _.isEqual(oldTalkers, newTalkers) ? oldTalkers : newTalkers;
        });
      }
    }
  }
  function setUserStatus(notificationEvent, eventStreamId) {
    console.log("notificationEvent", notificationEvent.isScreenShared)
    if (notificationEvent.isScreenShared) {
      setScreenSharedVideoId(eventStreamId);

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
        isPinned: pinnedVideoId,
        isScreenShared: isScreenShared
      });
    }
  }
  function handleSetMyObj(obj) {
    setMyLocalData(obj);
  }
  function handlePlay(token, tempList) {
    antmedia.play(roomName, token, roomName, tempList);
  }
  function handleStreamInformation(obj) {
    antmedia.play(obj.streamId, "", roomName);
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
    console.log(
      "handlePlayVideohandlePlayVideohandlePlayVideohandlePlayVideo",
      obj
    );
    let index = obj.trackId.substring("ARDAMSx".length);
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
      setParticipants((spp) => {
        return [
          ...spp,
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
  //console.log("participantsparticipantsparticipants", participants);
  function handleRoomEvents({ streams, streamList }) {
    console.log(
      "GWEGWEGWEGWEGEWGWEGWEGWEGWEGWEGWGEGWEGWEGWE",
      streams,
      streamList,
      participants,
      allParticipants,
    );
    setAllParticipants(streamList);
    setParticipants((oldParts) => {
      if (streams.length < participants.length) {
        return oldParts.slice(0, streams.length);
      }
      return oldParts.map((p) => {
        const newName = streamList.find(
          (s) => s.streamId === p.id
        )?.streamName;
        if (p.name !== newName) {
          return { ...p, name: newName };
        }
        return p;
      });
    });
  }


  // custom functions
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
  antmedia.handleStopScreenShare = handleStopScreenShare;
  antmedia.handleScreenshareNotFromPlatform = handleScreenshareNotFromPlatform;
  antmedia.handleNotifyPinUser = handleNotifyPinUser;
  antmedia.handleNotifyUnpinUser = handleNotifyUnpinUser;
  console.log("UPDATE_STATUSUPDATE_STATUSUPDATE_STATUS OUTSIDE", participants);
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
            handleDrawerOpen,
            screenSharedVideoId,
            audioTracks,
            isPublished
          }}
        >
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
            {waitingOrMeetingRoom === "waiting" ? (
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
                  drawerOpen,
                  handleDrawerOpen,
                  handleSetMessages,
                  messages,
                  toggleSetNumberOfUnreadMessages,
                  numberOfUnReadMessages,
                  pinVideo,
                  pinnedVideoId,
                  screenSharedVideoId,
                  audioTracks,
                }}
              >
                <>
                  <MeetingRoom
                    participants={participants}
                    allParticipants={allParticipants}
                    myLocalData={myLocalData}
                  />
                  <MessageDrawer allParticipants={allParticipants} />
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
