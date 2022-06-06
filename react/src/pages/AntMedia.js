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

  const [waitingOrMeetingRoom, setWaitingOrMeetingRoom] = useState("waiting");
  // { id: "", tracks:[] },
  const [participants, setParticipants] = useState([]);
  const [devices, setDevices] = useState([]);
  const [mic, setMic] = useState([]);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [messages, setMessages] = useState([]);

  const [cam, setCam] = useState([
    {
      eventStreamId: "localVideo",
      isCameraOn: true, //start with camera on
    },
  ]);
  function pinVideo(id) {
    if (pinnedVideoId === id) {
      setPinnedVideoId(null);
    } else {
      setPinnedVideoId(id);
    }
  }
  function handleStartScreenShare() {
    setIsScreenShared(true);
    antmedia.switchDesktopCapture(myLocalData.streamId);
  }
  function handleStopScreenShare() {
    setIsScreenShared(false);
    antmedia.switchVideoCameraCapture(myLocalData.streamId);
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
        console.log(
          "SCREEN_SHARED_ONSCREEN_SHARED_ONSCREEN_SHARED_ONSCREEN_SHARED_ON"
        );
        setPinnedVideoId(eventStreamId);
      } else if (eventType === "SCREEN_SHARED_OFF") {
        console.log(
          "SCREEN_SHARED_ONSCREEN_SHARED_ONSCREEN_SHARED_ONSCREEN_SHARED_ON"
        );
        setPinnedVideoId(null);
      } else if (eventType === "UPDATE_STATUS") {
        let requestedMediaConstraints = {
          width: 640,
          height: 480,
        };

        antmedia.applyConstraints(
          myLocalData.streamId,
          requestedMediaConstraints
        );
        setUserStatus(notificationEvent, eventStreamId);
      }
    }
  }
  function setUserStatus(notificationEvent, eventStreamId) {
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
  }

  function updateStatus(obj) {
    if (roomName !== obj) {
      handleSendNotificationEvent("UPDATE_STATUS", myLocalData.streamId, {
        mic: !!mic.find((c) => c.eventStreamId === "localVideo")?.isMicMuted,
        camera: !!cam.find((c) => c.eventStreamId === "localVideo")?.isCameraOn,
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
    if (index === publishStreamId) {
      return;
    }
    if (index === roomName) {
      return;
    } else {
      setParticipants((spp) => {
        let participant = spp.find((p) => p.id === index);
        if (participant) {
          return spp.map((s) => {
            if (s.id === index) {
              return { ...s, tracks: [...participant.tracks, obj.track] };
            }
            return s;
          });
        } else {
          return [
            ...spp,
            {
              id: index,
              tracks: [obj.track],
              streamId: obj.streamId,
              isCameraOn: true,
              name: "",
            },
          ];
        }
      });
    }
  }
  function handleRoomEvents({ streams, streamList }) {
    //
    // if anyone leave the room this if will be activated and remove the left user from participant list.
    if (
      _.differenceBy(
        participants,
        streams.map((s) => ({ id: s })),

        "id"
      ).length !== 0
    ) {
      setParticipants((oldParts) =>
        oldParts.filter((p) => streams.find((s) => s === p.id))
      );
      setPinnedVideoId(null);
    } else if (
      streamList.length > 0 &&
      participants.some((p) => p.name === "")
    ) {
      setParticipants((oldParts) => {
        return oldParts.map((p) => {
          let existStreamer = streamList.find((s) => s.streamId === p.id);
          if (existStreamer) return { ...p, name: existStreamer.streamName };
          return p;
        });
      });
    }
  }

  function handleDevices(obj) {
    setDevices(obj);
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
  antmedia.handleDevices = handleDevices;
  antmedia.handleStartScreenShare = handleStartScreenShare;
  antmedia.handleStopScreenShare = handleStopScreenShare;
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
            toggleSetCam,
            toggleSetMic,
            devices,
            myLocalData,
            handleDrawerOpen,
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
                }}
              >
                <>
                  <MeetingRoom
                    participants={participants}
                    myLocalData={myLocalData}
                  />
                  <MessageDrawer participants={participants} />
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
