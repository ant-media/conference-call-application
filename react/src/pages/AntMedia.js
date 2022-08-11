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

const globals = {
  //this settings is to keep consistent with the sdk until backend for the app is setup
  // maxVideoTrackCount is the tracks i can see excluding my own local video.so the use is actually seeing 3 videos when their own local video is included.
  maxVideoTrackCount: 2,
};

function AntMedia() {
  const { id } = useParams();
  const roomName = id;
  const antmedia = useContext(AntmediaContext);

  // drawerOpen for message components.
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const [screenSharedVideoId, setScreenSharedVideoId] = useState(null);
  const [waitingOrMeetingRoom, setWaitingOrMeetingRoom] = useState("waiting");
  // { id: "", track:{} },
  const [participants, setParticipants] = useState([]);
  const [allParticipants, setAllParticipants] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [mic, setMic] = useState([]);
  const [talkers, setTalkers] = useState([]);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedCamera, setSelectedCamera] = React.useState("");
  const [selectedMicrophone, setSelectedMicrophone] = React.useState("");
  const timeoutRef = React.useRef(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [messages, setMessages] = useState([]);

  const [cam, setCam] = useState([
    {
      eventStreamId: "localVideo",
      isCameraOn: true, //start with camera on
    },
  ]);
  function pinVideo(id, videoLabelProp = "") {
    let videoLabel = videoLabelProp;
    console.log("videoLabelvideoLabelvideoLabelvideoLabelvideoLabelvideoLabelvideoLabelvideoLabel", id, videoLabel, participants)
    if (videoLabel === "") {
      // if videoLabel is missing select the first videoLabel you find
      // 1 -2 -3 -4 -5 -6 -7 -8 -9
      videoLabel = participants.find((p) => p.videoLabel !== p.id).videoLabel;

    }
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
    handleSendNotificationEvent("PIN_USER", myLocalData.streamId, {
      streamId: id,
    });
  }

  function handleNotifyUnpinUser(id) {
    handleSendNotificationEvent("UNPIN_USER", myLocalData.streamId, {
      streamId: id,
    });
  }
  function handleSetMaxVideoTrackCount(maxTrackCount) {
    if (myLocalData?.streamId) {
      console.log("set maxTrackCount: ", maxTrackCount);
      console.log("myLocalData: ", myLocalData);
      console.log("antmedia: ", antmedia);
      antmedia.setMaxVideoTrackCount(myLocalData.streamId, maxTrackCount);
      handleSendNotificationEvent("UNPIN_USER", myLocalData.streamId, {
        streamId: id,
      });
      globals.maxVideoTrackCount = maxTrackCount;
    }
  }
  function handleStartScreenShare() {
    antmedia.switchDesktopCapture(myLocalData.streamId);

    // antmedia.screenShareOnNotification();
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
    console.log(
      "screenShareOnNotificationscreenShareOnNotificationscreenShareOnNotification"
    );
    setIsScreenShared(true);
    antmedia.screenShareOffNotification();
    let requestedMediaConstraints = {
      width: 1920,
      height: 1080,
    };
    antmedia.applyConstraints(myLocalData.streamId, requestedMediaConstraints);
    console.log(
      "myLocalDatamyLocalDatamyLocalDatamyLocalDatamyLocalDatamyLocalData",
      myLocalData
    );
    antmedia.handleSendNotificationEvent(
      "SCREEN_SHARED_ON",
      myLocalData.streamId
    );

    setPinnedVideoId("localVideo");
    // send fake audio level to get screen sharing user on a videotrack
    antmedia.updateAudioLevel(myLocalData.streamId, 10);
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

      if (isSameUser && sentInSameTime) {
        //group the messages *sent back to back in the same timeframe by the same user* by joinig the new message text with new line
        lastMessage.message = lastMessage.message + "\n" + newMessage.message;
        return [...oldMessages]; // dont make this "return oldMessages;" this is to trigger the useEffect for scroll bottom and get over showing the last prev state do
      } else {
        return [...oldMessages, newMessage];
      }
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
    //console.log("CALCACLACLACLACLACLALCACLALCLCACLALCAL", notificationEvent);
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
        pinVideo(eventStreamId, videoLab)
        setScreenSharedVideoId(eventStreamId);
      } else if (eventType === "SCREEN_SHARED_OFF") {
        setScreenSharedVideoId(null);
        setPinnedVideoId(null);
      } else if (eventType === "UPDATE_STATUS") {
        setUserStatus(notificationEvent, eventStreamId);
      } else if (eventType === "PIN_USER") {
        console.log(
          "PIN_USERPIN_USERPIN_USERPIN_USERPIN_USERPIN_USERPIN_USERPIN_USER",
          notificationEvent,
          eventStreamId,
          screenSharedVideoId
        );
        if (
          notificationEvent.streamId === myLocalData.streamId &&
          !isScreenShared
        ) {
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
        if (
          notificationEvent.streamId === myLocalData.streamId &&
          !isScreenShared
        ) {
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
        console.log("eventType: ", eventType, notificationEvent);
        if (!notificationEvent.payload.trackId) {
          return;
        }
        setParticipants((oldParticipants) => {
          return oldParticipants.map((p) => {
            if (
              p.videoLabel === notificationEvent.payload.videoLabel &&
              p.id !== notificationEvent.payload.trackId
            ) {
              return { ...p, id: notificationEvent.payload.trackId };
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
    console.log(
      "notificationEvent",
      notificationEvent,
      eventStreamId,
      screenSharedVideoId
    );
    if (notificationEvent.isScreenShared) {
      // if the participant was already pin someone than we should not update it
      if (!screenSharedVideoId) {
        setScreenSharedVideoId(eventStreamId);
        let videoLab = participants.find((p) => p.id === eventStreamId)
          ?.videoLabel
          ? participants.find((p) => p.id === eventStreamId).videoLabel
          : "";
        pinVideo(eventStreamId, videoLab)
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
    setMyLocalData({ ...obj, streamName });
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
    let index = obj?.trackId?.substring("ARDAMSx".length);
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
      console.log("add participant yunus", index);
      if (obj?.trackId && !participants.some(p => p.id === index)) {
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
  }
  //console.log("participantsparticipantsparticipants", participants);
  function handleRoomEvents({ streams, streamList }) {
    console.log("GWEGWE stream", streams, streamList);
    // console.log('GWEGWE prev participants', participants, allParticipants);
    setAllParticipants(streamList);
    setParticipants((oldParts) => {
      if (streams.length < participants.length) {
        return oldParts.filter((p) => streams.includes(p.id));
      }
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
  antmedia.handleSetMaxVideoTrackCount = handleSetMaxVideoTrackCount;
  //console.log("UPDATE_STATUSUPDATE_STATUSUPDATE_STATUS OUTSIDE", participants);
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
            isPublished,
            setSelectedCamera,
            selectedCamera,
            selectedMicrophone,
            setSelectedMicrophone,
            setParticipants,
            participants,
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
                  allParticipants,
                  globals,
                }}
              >
                <>
                  <MeetingRoom
                    participants={participants}
                    allParticipants={allParticipants}
                    myLocalData={myLocalData}
                  />
                  <MessageDrawer drawerOpen={drawerOpen} messages={messages} />
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
