import React, {useEffect, useRef, useState} from "react";
import {Backdrop, Box, CircularProgress, Grid} from "@mui/material";
import {useBeforeUnload, useParams} from "react-router-dom";
import WaitingRoom from "./WaitingRoom";
import _ from "lodash";
import MeetingRoom from "./MeetingRoom";
import MessageDrawer from "Components/MessageDrawer";
import {useSnackbar} from 'notistack';
import LeftTheRoom from "./LeftTheRoom";
import {getUrlParameter, VideoEffect, WebRTCAdaptor} from "@antmedia/webrtc_adaptor";
import {SvgIcon} from "../Components/SvgIcon";
import ParticipantListDrawer from "../Components/ParticipantListDrawer";
import EffectsDrawer from "../Components/EffectsDrawer";
import {useTranslation} from "react-i18next";

import {getRootAttribute, isComponentMode} from "../utils";
import floating from "../external/floating.js";
import {UnauthrorizedDialog} from "Components/Footer/Components/UnauthorizedDialog";
import {useWebSocket} from 'Components/WebSocketProvider';
import {useTheme} from "@mui/material/styles";
import useSound from 'use-sound';
import joinRoomSound from 'static/sounds/join-sound.mp3';
import leaveRoomSound from 'static/sounds/leave-sound.mp3';
import PublisherRequestListDrawer from "../Components/PublisherRequestListDrawer";
import {WebinarRoles} from "../WebinarRoles";
import Stack from "@mui/material/Stack";

// UnitTestContext is used to pass the globals object to the unit tests
// don't use it in the production code
export const UnitTestContext = React.createContext(null);

const globals = {
  //this settings is to keep consistent with the sdk until backend for the app is setup
  // maxVideoTrackCount is the tracks i can see excluding my own local video.so the use is actually seeing 3 videos when their own local video is included.
  maxVideoTrackCount: 6,
  desiredTileCount: 6,
  trackEvents: [],
  //pagination is used to keep track of the current page and the total page of the participants list
  participantListPagination: {
      currentPage: 1,
      pageSize: 15,
      totalPage: 1,
      offset: 1
  }
};

function getMediaConstraints(videoSendResolution, frameRate) {
  let constraint = null;

    switch (videoSendResolution) {
        case "screenConstraints":
            constraint = {
                video: {
                    width: {max: window.screen.width},
                    height: {max: window.screen.height},
                    frameRate: {ideal: frameRate}
                }, audio: true,
            };
            break;
        case "qvgaConstraints":
            constraint = {
                video: {
                    width: {ideal: 320},
                    height: {ideal: 180},
                    advanced: [{frameRate: {min: frameRate}}, {height: {min: 180}}, {width: {min: 320}}, {frameRate: {max: frameRate}}, {width: {max: 320}}, {height: {max: 180}}, {aspectRatio: {exact: 1.77778}}]
                }
            };
            break;
        case "vgaConstraints":
            constraint = {
                video: {
                    width: {ideal: 640},
                    height: {ideal: 360},
                    advanced: [{frameRate: {min: frameRate}}, {height: {min: 360}}, {width: {min: 640}}, {frameRate: {max: frameRate}}, {width: {max: 640}}, {height: {max: 360}}, {aspectRatio: {exact: 1.77778}}]
                }
            };
            break;
        case "hdConstraints":
            constraint = {
                video: {
                    width: {ideal: 1280},
                    height: {ideal: 720},
                    advanced: [{frameRate: {min: frameRate}}, {height: {min: 720}}, {width: {min: 1280}}, {frameRate: {max: frameRate}}, {width: {max: 1280}}, {height: {max: 720}}, {aspectRatio: {exact: 1.77778}}]
                }
            };
            break;
        case "fullHdConstraints":
            constraint = {
                video: {
                    width: {ideal: 1920},
                    height: {ideal: 1080},
                    advanced: [{frameRate: {min: frameRate}}, {height: {min: 1080}}, {width: {min: 1920}}, {frameRate: {max: frameRate}}, {width: {max: 1920}}, {height: {max: 1080}}, {aspectRatio: {exact: 1.77778}}]
                }
            };
            break;
        default:
            break;
    }

  return constraint;
}

var peerconnection_config = {
  'iceServers': [
    {
      'urls': 'stun:stun1.l.google.com:19302'
    }
  ],
  sdpSemantics: 'unified-plan'
};

checkAndSetPeerConnectionConfig();

function checkAndSetPeerConnectionConfig() {
    let turnServerURL = getRootAttribute("data-turn-server-url");
    let turnUsername = getRootAttribute("data-turn-username");
    let turnCredential = getRootAttribute("data-turn-credential");

    if (!turnServerURL) {
        turnServerURL = process.env.REACT_APP_TURN_SERVER_URL;
        turnUsername = process.env.REACT_APP_TURN_SERVER_USERNAME;
        turnCredential = process.env.REACT_APP_TURN_SERVER_CREDENTIAL;
    }

    if (turnServerURL) {
        peerconnection_config = {
            'iceServers': [
                {
                    'urls': turnServerURL,
                    'username': turnUsername,
                    'credential': turnCredential
                }
            ],
            sdpSemantics: 'unified-plan'
        };
    }
}

var streamNameInit = getRootAttribute("stream-name");

if (!streamNameInit) {
  streamNameInit = getUrlParameter("streamName");
}

var onlyDataChannel = getRootAttribute("only-data-channel");
if (!onlyDataChannel) {
  onlyDataChannel = getUrlParameter("onlyDataChannel");
}

if (onlyDataChannel == null || typeof onlyDataChannel === "undefined") {
  onlyDataChannel = false;
} else {
  onlyDataChannel = (onlyDataChannel === "true");
}

var initialPlayOnly = getRootAttribute("play-only");
if (!initialPlayOnly) {
  initialPlayOnly = getUrlParameter("playOnly");
}

if (initialPlayOnly == null || typeof initialPlayOnly === "undefined") {
  initialPlayOnly = false;
} else {
  initialPlayOnly = (initialPlayOnly === "true");
}

var initialStreamId = getRootAttribute("data-publish-stream-id");
if (!initialStreamId) {
  initialStreamId = getUrlParameter("streamId");
}

var admin = getRootAttribute("admin");
if (!admin) {
  admin = getUrlParameter("admin");
}

if (admin == null || typeof admin === "undefined") {
  admin = false;
} else {
  admin = (admin === "true");
}

function getToken() {
  const dataToken = document.getElementById("root")?.getAttribute("data-token");
  let token = (dataToken) ? dataToken : getUrlParameter("token");
  if (token === null || typeof token === "undefined") {
    token = "";
  }
  return token;
}

var token = getToken();

function getRole() {
  const dataRole = document.getElementById("root")?.getAttribute("data-role");
  let role = (dataRole) ? dataRole : getUrlParameter("role");
  if (role === null || typeof role === "undefined") {
    role = WebinarRoles.Default;
  }
  return role;
}

var roleInit = getRole();

var enterDirectly = getUrlParameter("enterDirectly");
if (enterDirectly == null || typeof enterDirectly === "undefined") {
    enterDirectly = false;
}
var subscriberId = getUrlParameter("subscriberId");
var subscriberCode = getUrlParameter("subscriberCode");
var scrollThreshold = -Infinity;
var scroll_down = true;
var last_warning_time = null;

var videoQualityConstraints = {
    video: {
        width: {ideal: 640},
        height: {ideal: 360},
        advanced: [{frameRate: {min: 15}}, {height: {min: 360}}, {width: {min: 640}}, {frameRate: {max: 15}}, {width: {max: 640}}, {height: {max: 360}}, {aspectRatio: {exact: 1.77778}}]
    },
}

var audioQualityConstraints = {
    audio: {
        noiseSuppression: true, echoCancellation: true
    }
}

var mediaConstraints = {
    // setting constraints here breaks source switching on firefox.
    video: videoQualityConstraints.video, audio: audioQualityConstraints.audio,
};

if (localStorage.getItem('selectedCamera')) {
    mediaConstraints.video.deviceId = localStorage.getItem('selectedCamera');
}

if (localStorage.getItem('selectedMicrophone')) {
    mediaConstraints.audio.deviceId = localStorage.getItem('selectedMicrophone');
}


if (initialPlayOnly) {
    mediaConstraints = {
        video: false, audio: false,
    };
}

let websocketURL = getRootAttribute("data-websocket-url");

if (!websocketURL) {

  websocketURL = process.env.REACT_APP_WEBSOCKET_URL;

    if (!websocketURL) {
        const appName = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
        const path = window.location.hostname + ":" + window.location.port + appName + "websocket";
        websocketURL = "ws://" + path;

        if (window.location.protocol.startsWith("https")) {
            websocketURL = "wss://" + path;
        }
    }

}

var fullScreenId = -1;

var roomOfStream = [];

var audioListenerIntervalJob = null;
var videoTrackAssignmentsIntervalJob = null;


var room = null;
var streamIdInUseCounter = 0;
var reconnecting = false;
var publishReconnected;
var playReconnected;

function AntMedia(props) {
  // eslint-disable-next-line
  const initialRoomName = (isComponentMode()) ? getRootAttribute("data-room-name") : useParams().id;
  const [roomName, setRoomName] = useState(initialRoomName);

  const [role, setRole] = useState(roleInit);

    // drawerOpen for message components.
    const [messageDrawerOpen, setMessageDrawerOpen] = useState(false);

    // drawerOpen for participant list components.
    const [participantListDrawerOpen, setParticipantListDrawerOpen] = useState(false);

    // drawerOpen for effects components.
    const [effectsDrawerOpen, setEffectsDrawerOpen] = useState(false);

  const [publishStreamId, setPublishStreamId] = useState(initialStreamId);

  // this is my own name when I enter the room.
  const [streamName, setStreamName] = useState(streamNameInit);

    // this is for checking if I am sharing my screen with other participants.
    const [isScreenShared, setIsScreenShared] = useState(false);

    // this is for checking if my local camera is turned off.
    const [isMyCamTurnedOff, setIsMyCamTurnedOff] = useState(false);

    // this is for checking if my local mic is turned off.
    const [isMyMicMuted, setIsMyMicMuted] = useState(false);

    //we are going to store number of unread messages to display on screen if user has not opened message component.
    const [numberOfUnReadMessages, setNumberOfUnReadMessages] = useState(0);

    // hide or show the emoji reaction component.
    const [showEmojis, setShowEmojis] = React.useState(false);

    // open or close the mute participant dialog.
    const [isMuteParticipantDialogOpen, setMuteParticipantDialogOpen] = React.useState(false);

    // set participant id you wanted to mute.
    const [participantIdMuted, setParticipantIdMuted] = React.useState({streamName: "", streamId: ""});

    // this one just triggers the re-rendering of the component.
    const [participantUpdated, setParticipantUpdated] = useState(false);

    const [isRecordPluginInstalled, setIsRecordPluginInstalled] = useState(false);

    const [isRecordPluginActive, setIsRecordPluginActive] = useState(false);

    const [waitingOrMeetingRoom, setWaitingOrMeetingRoom] = useState("waiting");
    const [leftTheRoom, setLeftTheRoom] = useState(false);
    const [unAuthorizedDialogOpen, setUnAuthorizedDialogOpen] = useState(false);

    const [isAdmin, setIsAdmin] = React.useState(admin === true || role === WebinarRoles.Host || role === WebinarRoles.ActiveHost);
    // presenterButtonStreamIdInProcess keeps the streamId of the participant who is in the process of becoming presenter/unpresenter.
    const [presenterButtonStreamIdInProcess, setPresenterButtonStreamIdInProcess] = useState([]);
    const [presenterButtonDisabled, setPresenterButtonDisabled] = React.useState([]);
    const [microphoneButtonDisabled, setMicrophoneButtonDisabled] = React.useState(false);
    const [cameraButtonDisabled, setCameraButtonDisabled] = React.useState(false);

    const [settings, setSettings] = React.useState();

    const [screenSharingInProgress, setScreenSharingInProgress] = React.useState(false);

  const [requestSpeakerList, setRequestSpeakerList] = React.useState([]);

  const [isBroadcasting, setIsBroadcasting] = React.useState(false);

  const [appSettingsMaxVideoTrackCount, setAppSettingsMaxVideoTrackCount] = React.useState(6);

    const [reactions] = useState({
        'sparkling_heart': '💖',
        'thumbs_up': '👍🏼',
        'party_popper': '🎉',
        'clapping_hands': '👏🏼',
        'face_with_tears_of_joy': '😂',
        'open_mouth': '😮',
        'sad_face': '😢',
        'thinking_face': '🤔',
        'thumbs_down': '👎🏼'
    });

    const [playJoinRoomSound /*, { stopJoinRoomSound }*/] = useSound(
        joinRoomSound,
        { volume: 0.5, interrupt: true }
    );

    const [playLeaveRoomSound /*, { stopLeaveRoomSound }*/] = useSound(
        leaveRoomSound,
        { volume: 0.5, interrupt: true }
    );

    React.useEffect(() => {
    setParticipantUpdated(!participantUpdated);
    if (presenterButtonStreamIdInProcess.length > 0) {
      setTimeout(() => {
        if (presenterButtonStreamIdInProcess.length > 0) {
          setPresenterButtonStreamIdInProcess([]);
          setPresenterButtonDisabled([]);
          setParticipantUpdated(!participantUpdated);
        }
      }, 1000);
    }
  }, [presenterButtonStreamIdInProcess]); // eslint-disable-line

    const {sendMessage, latestMessage, isWebSocketConnected} = useWebSocket();

    const [videoTrackAssignments, setVideoTrackAssignments] = useState([]);

  /*
   * allParticipants: is a dictionary of (streamId, broadcastObject) for the sum of the paged participants and the participants in videoTrackAssignments.
   * It comes from subtrackList callback + broadcast object which called in video track assignments list
   */
  const [allParticipants, setAllParticipants] = useState({});

  /*
   * pagedParticipants: is a dictionary of (streamId, broadcastObject) for participants in the participant list drawer.
   * subtrackList callback (which is return of getSubtracks request) for roomName has subtrackList and
   * we use it to fill this dictionary. It's a subset of allParticipants.
   */
    const [pagedParticipants, setPagedParticipants] = useState({});

    const [participantCount, setParticipantCount] = useState(1); // 1 is for the local participant

    const [audioTracks, setAudioTracks] = useState([]);

    const talkers = useRef([]);
    const [isPublished, setIsPublished] = useState(false);
    const [isPlayed, setIsPlayed] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const [selectedCamera, setSelectedCamera] = React.useState(localStorage.getItem('selectedCamera'));
    const [selectedMicrophone, setSelectedMicrophone] = React.useState(localStorage.getItem('selectedMicrophone'));
    const [selectedBackgroundMode, setSelectedBackgroundMode] = React.useState("");
    const [selectedVideoEffect, setSelectedVideoEffect] = React.useState(VideoEffect.NO_EFFECT);
    const [isVideoEffectRunning, setIsVideoEffectRunning] = React.useState(false);
    const [virtualBackground, setVirtualBackground] = React.useState(null);
    const timeoutRef = React.useRef(null);
    const screenShareWebRtcAdaptor = React.useRef(null)
    const screenShareStreamId = React.useRef(null)
    const {enqueueSnackbar, closeSnackbar} = useSnackbar();
    const [fakeParticipantCounter, setFakeParticipantCounter] = React.useState(1);

    const makeid = React.useCallback((length) => {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },[]);

    // speed test related states
    const speedTestStreamId = React.useRef(makeid(20));
    const speedTestForPublishWebRtcAdaptor = React.useRef(null);
    const [speedTestObject, setSpeedTestObject] = React.useState({
        message: "Please wait while we are testing your connection speed",
        isfinished: false,
        isfailed: false,
        errorMessage: "",
        progressValue: 10
    });
    const speedTestProgress = React.useRef(0);
    const speedTestPlayStarted = React.useRef(false);
    const speedTestCounter = React.useRef(0);
    const speedTestForPlayWebRtcAdaptor = React.useRef(null);
    const statsList = React.useRef([]);

    // video send resolution for publishing
    // possible values: "auto", "highDefinition", "standartDefinition", "lowDefinition"
    const [videoSendResolution, setVideoSendResolution] = React.useState(localStorage.getItem("videoSendResolution") ? localStorage.getItem("videoSendResolution") : "auto");

    const [messages, setMessages] = React.useState([]);

    const [devices, setDevices] = React.useState([]);

    const [isPlayOnly, setIsPlayOnly] = React.useState(initialPlayOnly);

    const [isEnterDirectly] = React.useState(enterDirectly);

    const [localVideo, setLocalVideo] = React.useState(null);

    const [webRTCAdaptor, setWebRTCAdaptor] = React.useState();
    const [leaveRoomWithError, setLeaveRoomWithError] = React.useState(null);

  const [initialized, setInitialized] = React.useState(!!props.isTest);
  const [publisherRequestListDrawerOpen, setPublisherRequestListDrawerOpen] = React.useState(false);
  // open or close the mute participant dialog.
  const [isBecomePublisherConfirmationDialogOpen, setBecomePublisherConfirmationDialogOpen] = React.useState(false);

    const publishStats = useRef(null);
    const playStats = useRef(null);

    const [isReconnectionInProgress, setIsReconnectionInProgress] = React.useState(false);

    const [highResourceUsageWarningCount, setHighResourceUsageWarningCount] = React.useState(0);

    const [isNoSreamExist, setIsNoSreamExist] = React.useState(false);


    const {t} = useTranslation();

    const theme = useTheme();

  useEffect(() => {
    setTimeout(() => {
      setParticipantUpdated(!participantUpdated);
      //console.log("setParticipantUpdated due to videoTrackAssignments or allParticipants change.");
    }, 5000);
  }, [videoTrackAssignments, allParticipants]); // eslint-disable-line 

    function handleUnauthorizedDialogExitClicked() {

        setUnAuthorizedDialogOpen(false)
        setWaitingOrMeetingRoom("waiting")

    }

    /*
      * This function performs the following tasks:
      * 1. It creates two new WebRTCAdaptor instances for publish and play.
      * 2. If the user is in playOnly mode, instead of using camera and microphone, it uses the video element for publish.
     */
    function startSpeedTest() {
        //TODO: this speed test should be refactored and be thought again
        if (isPlayOnly === "true" || isPlayOnly === true) {
            createSpeedTestForPlayWebRtcAdaptor();
        } else {
            createSpeedTestForPublishWebRtcAdaptor();
        }
        setTimeout(() => {
            if (speedTestProgress.current < 40)
                {
                //it means that it's stuck before publish started
                stopSpeedTest();
                setSpeedTestObjectFailed("Speed test failed. It may be due to firewall, wi-fi or network restrictions. Change your network or Try again ");
            }
        }, 15000); //it tooks about 20 seconds to finish the test, if it's less 40, it means it's stuck
    }

    function stopSpeedTest() {
        if (speedTestForPublishWebRtcAdaptor.current) {
            speedTestForPublishWebRtcAdaptor.current.stop("speedTestStream" + speedTestStreamId.current);
            speedTestForPublishWebRtcAdaptor.current.closeStream();
            speedTestForPublishWebRtcAdaptor.current.closeWebSocket();
        }
        if (speedTestForPlayWebRtcAdaptor.current) {
            speedTestForPlayWebRtcAdaptor.current.stop("speedTestSampleStream");
        }
        speedTestForPublishWebRtcAdaptor.current = null;
        speedTestForPlayWebRtcAdaptor.current = null;

        //we need to listen device changes with main webRTCAdaptor
        webRTCAdaptor.mediaManager?.trackDeviceChange();
    }

    function createSpeedTestForPublishWebRtcAdaptor() {
        speedTestForPublishWebRtcAdaptor.current = new WebRTCAdaptor({
            websocket_url: websocketURL,
            mediaConstraints: {video: true, audio: false},
            sdp_constraints: {
                OfferToReceiveAudio: false, OfferToReceiveVideo: false,
            },
            peerconnection_config: peerconnection_config,
            debug: true,
            callback: speedTestForPublishWebRtcAdaptorInfoCallback,
            callbackError: speedTestForPublishWebRtcAdaptorErrorCallback,
            purposeForTest: "publish-speed-test"
        })

    }

    function speedTestForPublishWebRtcAdaptorInfoCallback(info, obj) {
        if (info === "initialized") {
            speedTestCounter.current = 0;
            setSpeedTestObjectProgress(10);
            speedTestForPublishWebRtcAdaptor.current.publish("speedTestStream" + speedTestStreamId.current, token, subscriberId, subscriberCode, "speedTestStream" + speedTestStreamId.current, "", "")
        } 
        else if (info === "publish_started") {
            speedTestCounter.current = 0;
            console.log("speed test publish started");
            setSpeedTestObjectProgress(20);
            speedTestForPublishWebRtcAdaptor.current.enableStats("speedTestStream" + speedTestStreamId.current);
        } 
        else if (info === "updated_stats") 
        {
            if (speedTestCounter.current === 0) {
                statsList.current = []; // reset stats list if it is the first time
            }
            setSpeedTestObjectProgress(20 + (speedTestCounter.current * 20));

            speedTestCounter.current = speedTestCounter.current + 1;
            setAndFillPublishStatsList(obj);

            if (speedTestCounter.current > 3 && statsList.current.length > 3) {
                calculateThePublishSpeedTestResult();
            } else {
                setSpeedTestObjectProgress(20 + (speedTestCounter.current * 20));
            }
        } 
        else if (info === "ice_connection_state_changed") {
            console.log("speed test ice connection state changed")
        }
    }

    /*

     */

    function setAndFillPlayStatsList(obj) {
        console.log("obj", obj);
        let tempStatsList = statsList.current;
        let tempStats = {};

        tempStats.currentRoundTripTime = obj.currentRoundTripTime;

        tempStats.packetsReceived = obj.packetsReceived;

        tempStats.totalBytesReceivedCount = obj.totalBytesReceivedCount;

        tempStats.framesReceived = obj.framesReceived;
        tempStats.framesDropped = obj.framesDropped;

        tempStats.startTime = obj.startTime;
        tempStats.currentTimestamp = obj.currentTimestamp;

        tempStats.firstBytesReceivedCount = obj.firstBytesReceivedCount;
        tempStats.lastBytesReceived = obj.lastBytesReceived;

        tempStats.videoPacketsLost = obj.videoPacketsLost;
        tempStats.audioPacketsLost = obj.audioPacketsLost;

        tempStats.inboundRtpList = obj.inboundRtpList;

        tempStats.videoJitterAverageDelay = obj.videoJitterAverageDelay;
        tempStats.audioJitterAverageDelay = obj.audioJitterAverageDelay;

        tempStats.videoRoundTripTime = obj.videoRoundTripTime;
        tempStats.audioRoundTripTime = obj.audioRoundTripTime;

        tempStatsList.push(tempStats);
        statsList.current = tempStatsList;
    }

    function setAndFillPublishStatsList(obj) {
        console.log("obj", obj);
        let tempStatsList = statsList.current;
        let tempStats = {};
        tempStats.videoRoundTripTime = obj.videoRoundTripTime;
        tempStats.audioRoundTripTime = obj.audioRoundTripTime;
        tempStats.videoPacketsLost = obj.videoPacketsLost;
        tempStats.totalVideoPacketsSent = obj.totalVideoPacketsSent;
        tempStats.totalAudioPacketsSent = obj.totalAudioPacketsSent;
        tempStats.audioPacketsLost = obj.audioPacketsLost;
        tempStats.videoJitter = obj.videoJitter;
        tempStats.audioJitter = obj.audioJitter;
        tempStats.currentOutgoingBitrate = obj.currentOutgoingBitrate;
        tempStatsList.push(tempStats);
        statsList.current = tempStatsList;
    }

    function setSpeedTestObjectFailed(errorMessage) {
        let tempSpeedTestObject = {};
        tempSpeedTestObject.message = errorMessage;
        tempSpeedTestObject.isfinished = false;
        tempSpeedTestObject.isfailed = true;
        tempSpeedTestObject.errorMessage = errorMessage;
        tempSpeedTestObject.progressValue = 0;
        speedTestProgress.current = tempSpeedTestObject.progressValue;

        setSpeedTestObject(tempSpeedTestObject);
    }

    function setSpeedTestObjectProgress(progressValue) {
        // if progress value is more than 100, it means that speed test is failed, and we can not get or set the stat list properly

        //TODO: It's just a insurance to not encounter this case. It's put there for a workaround solution in production for fakeeh. Remove it later - mekya
        if (progressValue > 100) {
            // we need to stop the speed test and set the speed test object as failed
            stopSpeedTest();
            setSpeedTestObjectFailed("Speed test failed. It may be due to firewall, wi-fi or network restrictions. Change your network or Try again ");
            return;
        }
        let tempSpeedTestObject = {};
        tempSpeedTestObject.message = speedTestObject.message;
        tempSpeedTestObject.isfinished = false;
        tempSpeedTestObject.isfailed = false;
        tempSpeedTestObject.errorMessage = "";
        tempSpeedTestObject.progressValue = progressValue;
        speedTestProgress.current = tempSpeedTestObject.progressValue;
        setSpeedTestObject(tempSpeedTestObject);
    }

    function calculateThePublishSpeedTestResult() {
        let updatedStats = {};

        updatedStats.videoRoundTripTime = parseFloat(statsList.current[statsList.current.length - 1].videoRoundTripTime) // we can use the last value
        updatedStats.videoRoundTripTime = (updatedStats.videoRoundTripTime === -1) ? 0 : updatedStats.videoRoundTripTime;

        updatedStats.audioRoundTripTime = parseFloat(statsList.current[statsList.current.length - 1].audioRoundTripTime) // we can use the last value
        updatedStats.audioRoundTripTime =(updatedStats.audioRoundTripTime === -1) ? 0 : updatedStats.audioRoundTripTime;

        updatedStats.videoPacketsLost = parseInt(statsList.current[statsList.current.length - 1].videoPacketsLost) 
                                            + parseInt(statsList.current[statsList.current.length - 2].videoPacketsLost) 
                                            + parseInt(statsList.current[statsList.current.length - 3].videoPacketsLost);

        updatedStats.videoPacketsLost = (updatedStats.videoPacketsLost < 0) ? 0 : updatedStats.videoPacketsLost;

        updatedStats.totalVideoPacketsSent = parseInt(statsList.current[statsList.current.length - 1].totalVideoPacketsSent) 
                                                + parseInt(statsList.current[statsList.current.length - 2].totalVideoPacketsSent)
                                                + parseInt(statsList.current[statsList.current.length - 3].totalVideoPacketsSent);

        updatedStats.totalVideoPacketsSent = (updatedStats.totalVideoPacketsSent < 0) ? 0 : updatedStats.totalVideoPacketsSent;

        updatedStats.audioPacketsLost = parseInt(statsList.current[statsList.current.length - 1].audioPacketsLost) 
                                            + parseInt(statsList.current[statsList.current.length - 2].audioPacketsLost)
                                            + parseInt(statsList.current[statsList.current.length - 3].audioPacketsLost);

        updatedStats.totalAudioPacketsSent = parseInt(statsList.current[statsList.current.length - 1].totalAudioPacketsSent)
                                                + parseInt(statsList.current[statsList.current.length - 2].totalAudioPacketsSent)
                                                + parseInt(statsList.current[statsList.current.length - 3].totalAudioPacketsSent);

        updatedStats.totalAudioPacketsSent = (updatedStats.totalAudioPacketsSent < 0) ? 0 : updatedStats.totalAudioPacketsSent;

        updatedStats.audioPacketsLost = (updatedStats.audioPacketsLost < 0) ? 0 : updatedStats.audioPacketsLost;

        updatedStats.videoJitter = (parseFloat(statsList.current[statsList.current.length - 1].videoJitter) + parseFloat(statsList.current[statsList.current.length - 2].videoJitter))/2.0;
        updatedStats.videoJitter = (updatedStats.videoJitter === -1) ? 0 : updatedStats.videoJitter;

        updatedStats.audioJitter = (parseFloat(statsList.current[statsList.current.length - 1].audioJitter) + parseFloat(statsList.current[statsList.current.length - 2].audioJitter))/2.0;
        updatedStats.audioJitter = (updatedStats.audioJitter === -1) ? 0 : updatedStats.audioJitter;

        updatedStats.currentOutgoingBitrate = parseInt(statsList.current[statsList.current.length - 1].currentOutgoingBitrate) // we can use the last value
        updatedStats.currentOutgoingBitrate = (updatedStats.currentOutgoingBitrate === -1) ? 0 : updatedStats.currentOutgoingBitrate;

        let rtt = ((parseFloat(updatedStats.videoRoundTripTime) + parseFloat(updatedStats.audioRoundTripTime)) / 2).toPrecision(3);
        let packetLost = parseInt(updatedStats.videoPacketsLost) + parseInt(updatedStats.audioPacketsLost);
        let packetLostPercentage = ((updatedStats.videoPacketsLost+updatedStats.audioPacketsLost)/(updatedStats.totalVideoPacketsSent + updatedStats.totalAudioPacketsSent)) * 100
        let jitter = ((parseFloat(updatedStats.videoJitter) + parseInt(updatedStats.audioJitter)) / 2).toPrecision(3);
        let outgoingBitrate = parseInt(updatedStats.currentOutgoingBitrate);
        let bandwidth = parseInt(speedTestForPublishWebRtcAdaptor.current.mediaManager.bandwidth);
        console.log("* rtt: " + rtt);
        console.log("* packetLost: " + packetLost);
        console.log("* totalPacketSent: " + (updatedStats.totalVideoPacketsSent + updatedStats.totalAudioPacketsSent));
        console.log("* packetLostPercentage: " + packetLostPercentage);
        console.log("* jitter: " + jitter);
        console.log("* outgoingBitrate: " + outgoingBitrate);
        console.log("* bandwidth: " + bandwidth);

        let speedTestResult = {};

        if (rtt >= 0.2 || packetLostPercentage >= 3.5 || jitter >= 0.2) {
            console.log("-> Your connection quality is poor. You may experience interruptions");
            speedTestResult.message = "Your connection quality is poor. You may experience interruptions";
        } else if (rtt >= 0.1 || packetLostPercentage >= 2 || jitter >= 0.08) {
            console.log("-> Your connection is moderate, occasional disruptions may occur");
            speedTestResult.message = "Your connection is moderate, occasional disruptions may occur";
        } else if (rtt >= 0.03 || jitter >= 0.02 || packetLostPercentage >= 1) {
            console.log("-> Your connection is good.");
            speedTestResult.message = "Your connection is Good.";
        } else {
            console.log("-> Your connection is great");
            speedTestResult.message = "Your connection is Great!";
        }

        speedTestResult.isfailed = false;
        speedTestResult.errorMessage = "";
        speedTestResult.progressValue = 100;

        speedTestResult.isfinished = true;
        speedTestProgress.current = speedTestResult.progressValue;
        setSpeedTestObject(speedTestResult);

        stopSpeedTest();
    }

    function calculateThePlaySpeedTestResult() {
        let stats = statsList.current[statsList.current.length - 1];
        let oldStats = statsList.current[statsList.current.length - 2];

        // Calculate total bytes received
        let totalBytesReceived = stats.totalBytesReceivedCount;

        // Calculate video frames received and frames dropped
        let framesReceived = stats.framesReceived;
        let framesDropped = stats.framesDropped;

        // Calculate the time difference (in seconds)
        let timeElapsed = (stats.currentTimestamp - stats.startTime) / 1000; // Convert ms to seconds

        // Calculate incoming bitrate (bits per second)
        let bytesReceivedDiff = stats.lastBytesReceived - stats.firstBytesReceivedCount;
        let incomingBitrate = (bytesReceivedDiff * 8) / timeElapsed; // Convert bytes to bits

        // Calculate packet loss
        let videoPacketsLost = stats.videoPacketsLost;
        let audioPacketsLost = stats.audioPacketsLost;

        let totalPacketsLost = videoPacketsLost + audioPacketsLost;

        // Calculate packet loss for the previous stats
        let oldVideoPacketsLost = stats.videoPacketsLost;
        let oldAudioPacketsLost = stats.audioPacketsLost;

        let oldTotalPacketsLost = oldVideoPacketsLost + oldAudioPacketsLost;

        let packageReceived = stats.inboundRtpList.find(item => item.trackIdentifier.startsWith('ARDAMSv')).packetsReceived + stats.inboundRtpList.find(item => item.trackIdentifier.startsWith('ARDAMSa')).packetsReceived;
        let oldPackageReceived = oldStats.inboundRtpList.find(item => item.trackIdentifier.startsWith('ARDAMSv')).packetsReceived + oldStats.inboundRtpList.find(item => item.trackIdentifier.startsWith('ARDAMSa')).packetsReceived;

        // Calculate the packet loss percentage
        let packageLostPercentage = 0;
        console.log("publishStats:", publishStats.current);
        if (publishStats.current !== null) {
            let deltaPackageLost = oldTotalPacketsLost - totalPacketsLost;
            let deltaPackageReceived = oldPackageReceived - packageReceived;

            if (deltaPackageLost > 0) {
                packageLostPercentage = ((deltaPackageLost / parseInt(deltaPackageReceived)) * 100).toPrecision(3);
            }
        }

        // Jitter calculation (average of video and audio jitter)
        let videoJitter = stats.inboundRtpList.find(item => item.trackIdentifier.startsWith('ARDAMSv')).jitterBufferDelay;
        let audioJitter = stats.inboundRtpList.find(item => item.trackIdentifier.startsWith('ARDAMSa')).jitterBufferDelay;

        let avgJitter = (videoJitter + audioJitter) / 2;

        let rtt = ((parseFloat(stats.videoRoundTripTime) + parseFloat(stats.audioRoundTripTime)) / 2).toPrecision(3);

        // Frame drop rate
        let frameDropRate = framesDropped / framesReceived * 100;

        console.log("* Total bytes received: " + totalBytesReceived);
        console.log("* Incoming bitrate: " + incomingBitrate.toFixed(2) + " bps");
        console.log("* Total packets lost: " + totalPacketsLost);
        console.log("* Frame drop rate: " + frameDropRate.toFixed(2) + "%");
        console.log("* Average jitter: " + avgJitter.toFixed(2) + " ms");

        let speedTestResult = {};

        if (rtt > 0.15 || packageLostPercentage > 2.5 || frameDropRate > 5 || avgJitter > 100) {
            console.log("-> Your connection quality is poor. You may experience interruptions");
            speedTestResult.message = "Your connection quality is poor. You may experience interruptions";
        } else if (rtt > 0.1 || packageLostPercentage > 1.5 || avgJitter > 50 || frameDropRate > 2.5) {
            console.log("-> Your connection is moderate, occasional disruptions may occur");
            speedTestResult.message = "Your connection is moderate, occasional disruptions may occur";
        } else {
            console.log("-> Your connection is great");
            speedTestResult.message = "Your connection is Great!";
        }

        speedTestResult.isfailed = false;
        speedTestResult.errorMessage = "";
        speedTestResult.progressValue = 100;

        speedTestResult.isfinished = true;
        speedTestProgress.current = speedTestResult.progressValue;
        setSpeedTestObject(speedTestResult);

        stopSpeedTest();
    }


    function speedTestForPublishWebRtcAdaptorErrorCallback(error, message) {
        console.log("error from speed test webrtc adaptor callback")
        //some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
        console.log("error:" + error + " message:" + message);

        setSpeedTestObjectFailed("There is an error('"+error+"'). Please try again later...");
        stopSpeedTest();
    }

    function createSpeedTestForPlayWebRtcAdaptor() {
        speedTestPlayStarted.current = false;
        speedTestForPlayWebRtcAdaptor.current = new WebRTCAdaptor({
            websocket_url: websocketURL,
            mediaConstraints: {video: false, audio: false},
            playOnly: true,
            sdp_constraints: {
                OfferToReceiveAudio: false, OfferToReceiveVideo: false,
            },
            peerconnection_config: peerconnection_config,
            debug: true,
            callback: speedTestForPlayWebRtcAdaptorInfoCallback,
            callbackError: speedTestForPlayWebRtcAdaptorErrorCallback,
            purposeForTest: "play-speed-test"
        })
    }

    function speedTestForPlayWebRtcAdaptorInfoCallback(info, obj) {
        if (info === "initialized") {
            speedTestPlayStarted.current = false;
            speedTestForPlayWebRtcAdaptor.current.play("speedTestSampleStream", "", "", [], "", "", "");
        } else if (info === "play_started") {
            console.log("speed test play started")
            speedTestPlayStarted.current = true;
            setSpeedTestObjectProgress(20);
            speedTestForPlayWebRtcAdaptor.current?.enableStats("speedTestSampleStream");
        }
        else if (info === "updated_stats")
        {
            processUpdatedStatsForPlaySpeedTest(obj);
        } else if (info === "ice_connection_state_changed") {
            console.log("speed test ice connection state changed")
        }
    }

    function speedTestForPlayWebRtcAdaptorErrorCallback(error, message) {
        console.log("error from speed test webrtc adaptor callback")
        //some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
        console.log("error:" + error + " message:" + message);

        setSpeedTestObjectFailed("There is an error('"+error+"'). Please try again later...");

        stopSpeedTest();
    }

    function processUpdatedStatsForPlaySpeedTest(statsObj) {
        if (speedTestCounter.current === 0) {
            statsList.current = []; // reset stats list if it is the first time
        }
        setSpeedTestObjectProgress(20 + (speedTestCounter.current * 20));

        speedTestCounter.current = speedTestCounter.current + 1;
        setAndFillPlayStatsList(statsObj);

        if (speedTestCounter.current > 3 && statsList.current.length > 3) {
            calculateThePlaySpeedTestResult();
        } else {
            let tempSpeedTestObject = {};
            tempSpeedTestObject.message = speedTestObject.message;
            tempSpeedTestObject.isfinished = false;
            tempSpeedTestObject.isfailed = false;
            tempSpeedTestObject.errorMessage = "";
            tempSpeedTestObject.progressValue = 20 + (speedTestCounter.current * 20);
            speedTestProgress.current = tempSpeedTestObject.progressValue;
            setSpeedTestObject(tempSpeedTestObject);
        }
    }

    function checkAndUpdateVideoAudioSources() {
        if (isPlayOnly) {
            console.info("Play only mode is active, no need to check and update video audio sources.");
            return;
        }
        let isVideoDeviceAvailable = false;
        let isAudioDeviceAvailable = false;
        let selectedDevices = getSelectedDevices();
        let currentCameraDeviceId = selectedDevices.videoDeviceId;
        let currentAudioDeviceId = selectedDevices.audioDeviceId;

        // check if the selected devices are still available
        for (let index = 0; index < devices.length; index++) {
            if (devices[index].kind === "videoinput" && devices[index].deviceId === selectedDevices.videoDeviceId) {
                isVideoDeviceAvailable = true;
                setCameraButtonDisabled(false);
            }
            if (devices[index].kind === "audioinput" && devices[index].deviceId === selectedDevices.audioDeviceId) {
                isAudioDeviceAvailable = true;
                setMicrophoneButtonDisabled(false);
            }
        }

        // if the selected devices are not available, select the first available device
        if (selectedDevices.videoDeviceId === '' || isVideoDeviceAvailable === false) {
            const camera = devices.find(d => d.kind === 'videoinput');
            if (camera) {
                selectedDevices.videoDeviceId = camera.deviceId;
                setCameraButtonDisabled(false);
                console.info("Unable to access selected camera, switching the first available camera.");
                displayMessage("Unable to access selected camera, switching the first available camera.", "white");
            } else {
                // if there is no camera, set the video to false
                checkAndTurnOffLocalCamera()
                setCameraButtonDisabled(true)
                console.info("There is no available camera device.");
                displayMessage("There is no available camera device.", "white")
            }
        }
        if (selectedDevices.audioDeviceId === '' || isAudioDeviceAvailable === false) {
            const audio = devices.find(d => d.kind === 'audioinput');
            if (audio) {
                selectedDevices.audioDeviceId = audio.deviceId;
                setMicrophoneButtonDisabled(false);
                console.info("Unable to access selected microphone, switching the first available microphone.");
                displayMessage("Unable to access selected microphone, switching the first available microphone.", "white");
            } else {
                // if there is no audio, set the audio to false
                muteLocalMic()
                setMicrophoneButtonDisabled(true)
                console.info("There is no microphone device available.");
                displayMessage("There is no microphone device available.", "white")
            }
        }

        setSelectedDevices(selectedDevices);

        try {
            if (webRTCAdaptor !== null && currentCameraDeviceId !== selectedDevices.videoDeviceId && typeof publishStreamId != 'undefined') {
                webRTCAdaptor?.switchVideoCameraCapture(publishStreamId, selectedDevices.videoDeviceId);
            }
            if (webRTCAdaptor !== null && (currentAudioDeviceId !== selectedDevices.audioDeviceId || selectedDevices.audioDeviceId === 'default') && typeof publishStreamId != 'undefined') {
                webRTCAdaptor?.switchAudioInputSource(publishStreamId, selectedDevices.audioDeviceId);
            }
        } catch (error) {
            console.error("Error while switching video/audio sources", error);
        }
    }

    function checkAndUpdateVideoAudioSourcesForPublishSpeedTest() {
        console.log("Start updating video and audio sources");

        let { videoDeviceId, audioDeviceId } = getSelectedDevices();
        const isDeviceAvailable = (deviceType, selectedDeviceId) =>
            devices.some(device => device.kind === deviceType && device.deviceId === selectedDeviceId);

        const updateDeviceIfUnavailable = (deviceType, selectedDeviceId) => {
            if (!selectedDeviceId || !isDeviceAvailable(deviceType, selectedDeviceId)) {
                const availableDevice = devices.find(device => device.kind === deviceType);
                return availableDevice ? availableDevice.deviceId : selectedDeviceId;
            }
            return selectedDeviceId;
        };

        videoDeviceId = updateDeviceIfUnavailable("videoinput", videoDeviceId);
        audioDeviceId = updateDeviceIfUnavailable("audioinput", audioDeviceId);

        const updatedDevices = { videoDeviceId, audioDeviceId };
        console.log("Updated device selections:", updatedDevices);

        setSelectedDevices(updatedDevices);

        const switchDevice = (switchMethod, currentDeviceId, newDeviceId, streamId) => {
            if (speedTestForPublishWebRtcAdaptor.current && currentDeviceId !== newDeviceId && streamId) {
                speedTestForPublishWebRtcAdaptor.current[switchMethod](streamId, newDeviceId);
            }
        };

        try {
            switchDevice(
                "switchVideoCameraCapture",
                getSelectedDevices().videoDeviceId,
                videoDeviceId,
                publishStreamId
            );

            switchDevice(
                "switchAudioInputSource",
                getSelectedDevices().audioDeviceId,
                audioDeviceId,
                publishStreamId
            );
        } catch (error) {
            console.error(
                "Error while switching video and audio sources for the publish speed test adaptor",
                error
            );
        }

        console.log("Finished updating video and audio sources");
    }


    React.useEffect(() => {
        setParticipantUpdated(!participantUpdated);
        if (presenterButtonStreamIdInProcess.length > 0) {
            setTimeout(() => {
                if (presenterButtonStreamIdInProcess.length > 0) {
                    setPresenterButtonStreamIdInProcess([]);
                    setPresenterButtonDisabled([]);
                    setParticipantUpdated(!participantUpdated);
                }
            }, 3000);
        }
    }, [presenterButtonStreamIdInProcess]); // eslint-disable-line 

    function makeParticipantPresenter(streamId) {
        let participantsRole = "";
        let participantsNewRole = "";
        let broadcastObject = allParticipants[streamId];

        if (broadcastObject !== null && broadcastObject !== undefined) {
            participantsRole = broadcastObject.role;
        }

        if (participantsRole === WebinarRoles.Host) {
            participantsNewRole = WebinarRoles.ActiveHost;
        } else if (participantsRole === WebinarRoles.Speaker) {
            participantsNewRole = WebinarRoles.ActiveSpeaker;
        } else if (participantsRole === WebinarRoles.TempListener) {
            participantsNewRole = WebinarRoles.ActiveTempListener;
        } else {
            console.error("Invalid role for participant to make presenter", participantsRole);
            return;
        }

        if (!presenterButtonStreamIdInProcess.includes(streamId)) {
            setPresenterButtonStreamIdInProcess(presenterButtonStreamIdInProcess => [...presenterButtonStreamIdInProcess, streamId]);
        }

        if (!presenterButtonDisabled.includes(streamId)) {
            setPresenterButtonDisabled(presenterButtonDisabled => [...presenterButtonDisabled, streamId]);
        }

        updateParticipantRole(streamId, participantsNewRole);
    }

    function makeParticipantUndoPresenter(streamId) {
        let participantsRole = "";
        let participantsNewRole = "";
        let broadcastObject = allParticipants[streamId];

        if (broadcastObject !== null && broadcastObject !== undefined) {
            participantsRole = broadcastObject.role;
        }

        if (participantsRole === WebinarRoles.ActiveHost) {
            participantsNewRole = WebinarRoles.Host;
        } else if (participantsRole === WebinarRoles.ActiveSpeaker) {
            participantsNewRole = WebinarRoles.Speaker;
        } else if (participantsRole === WebinarRoles.ActiveTempListener) {
            participantsNewRole = WebinarRoles.TempListener;
        } else {
            console.error("Invalid role for participant to make presenter", participantsRole);
            return;
        }

        if (!presenterButtonStreamIdInProcess.includes(streamId)) {
            setPresenterButtonStreamIdInProcess(presenterButtonStreamIdInProcess => [...presenterButtonStreamIdInProcess, streamId]);
        }

        if (!presenterButtonDisabled.includes(streamId)) {
            setPresenterButtonDisabled(presenterButtonDisabled => [...presenterButtonDisabled, streamId]);
        }

        updateParticipantRole(streamId, participantsNewRole);
    }

    function updateParticipantRole(streamId, newRole) {
        updateBroadcastRole(streamId, newRole);
        
        setTimeout(() => {
            handleSendNotificationEvent(
                "UPDATE_PARTICIPANT_ROLE",
                publishStreamId,
                {
                  streamId: streamId,
                  senderStreamId: publishStreamId,
                  role: newRole
                }
            );
            console.log("UPDATE_PARTICIPANT_ROLE event sent by "+publishStreamId);

            webRTCAdaptor?.getSubtracks(roomName, null, globals.participantListPagination.offset, globals.participantListPagination.pageSize);
        }, 2000);
    }

    function updateBroadcastRole(streamId, newRole) {
        const jsCmd = {
            command: "updateBroadcastRole",
            streamId: streamId,
            role: newRole,
        };

        sendMessage(JSON.stringify(jsCmd));
    }

    function sendDataChannelMessage(receiverStreamId, message) {
        const jsCmd = {
            command: "sendData",
            streamId: publishStreamId,
            receiverStreamId: receiverStreamId,
            message: message,
        };

        sendMessage(JSON.stringify(jsCmd));
    }

    function reconnectionInProgress() {
        setIsReconnectionInProgress(true);
        reconnecting = true;

        displayWarning("Connection lost. Trying reconnect...");
    }

    function joinRoom(roomName, generatedStreamId) {
        room = roomName;
        roomOfStream[generatedStreamId] = room;

        globals.maxVideoTrackCount = appSettingsMaxVideoTrackCount;
        globals.desiredTileCount = appSettingsMaxVideoTrackCount;
        setPublishStreamId(generatedStreamId);

        if (!isPlayOnly) {
            handlePublish(generatedStreamId, token, subscriberId, subscriberCode);
        } else if (process.env.REACT_APP_SHOW_PLAY_ONLY_PARTICIPANTS === "true") {
            // if the user is in playOnly mode, it will join the room with the generated stream id
            // so we can get the list of play only participants in the room
            webRTCAdaptor?.joinRoom(roomName, generatedStreamId, null, streamName, role, getUserStatusMetadata());
            console.log("Play only mode is active, joining the room with the generated stream id");
        }

        webRTCAdaptor?.play(roomName, token, roomName, null, subscriberId, subscriberCode, '{}', role);
    }

    function requestVideoTrackAssignmentsInterval() {
        if (videoTrackAssignmentsIntervalJob === null) {
            videoTrackAssignmentsIntervalJob = setInterval(() => {
                webRTCAdaptor?.requestVideoTrackAssignments(roomName);
                webRTCAdaptor?.getSubtrackCount(roomName, null, null); // get the total participant count in the room
            }, 3000);
        }
    }

    function checkDevices() {
        return navigator.mediaDevices.enumerateDevices().then(devices => {
            let audioDeviceAvailable = false;
            let videoDeviceAvailable = false;

            devices.forEach(device => {
                if (device.kind === "audioinput") {
                    audioDeviceAvailable = true;
                }
                if (device.kind === "videoinput") {
                    videoDeviceAvailable = true;
                }
            });

            if (!audioDeviceAvailable) {
                mediaConstraints.audio = false;
            }
            if (!videoDeviceAvailable) {
                mediaConstraints.video = false;
            }
        }).catch(err => {
            console.error("Error enumerating devices:", err);
            return Promise.reject(err); // Reject the promise if an error occurs
        });
    }

    function fakeReconnect() {
        console.log("************* fake reconnect");
        let orginal = webRTCAdaptor.iceConnectionState;
        webRTCAdaptor.iceConnectionState = () => "disconnected";

        webRTCAdaptor.reconnectIfRequired();

        setTimeout(() => {
            webRTCAdaptor.iceConnectionState = orginal;
        }, 5000);
    }

    function addFakeParticipant() {
        displayMessage("Fake participant added");
        let suffix = "fake" + fakeParticipantCounter;
        let tempCount = fakeParticipantCounter + 1;
        setFakeParticipantCounter(tempCount);

        let allParticipantsTemp = {...allParticipants};
        let broadcastObject = {
            name: "name_" + suffix,
            streamId: "streamId_" + suffix,
            metaData: JSON.stringify({isCameraOn: false}),
            isPinned: undefined,
            isScreenShared: undefined,
            isFake: true,
            status: "livestream"
        };
        allParticipantsTemp["streamId_" + suffix] = broadcastObject;

        if (!_.isEqual(allParticipantsTemp, allParticipants)) {
          setAllParticipants(allParticipantsTemp);
        }

        if (Object.keys(allParticipantsTemp).length <= globals.maxVideoTrackCount) {
            let newVideoTrackAssignment = {
                videoLabel: "label_" + suffix, track: null, streamId: "streamId_" + suffix, isFake: true
            };
            let temp = [...videoTrackAssignments];
            temp.push(newVideoTrackAssignment);
          if (!_.isEqual(temp, videoTrackAssignments)) {
                setVideoTrackAssignments(temp);
            }
    }

        console.log("fake participant added");
        setParticipantUpdated(!participantUpdated);
    }

    function removeFakeParticipant() {
        let tempCount = fakeParticipantCounter - 1;
        let suffix = "fake" + tempCount;
        setFakeParticipantCounter(tempCount);

        let tempVideoTrackAssignments = videoTrackAssignments.filter(el => el.streamId !== "streamId_" + suffix)
        if (!_.isEqual(tempVideoTrackAssignments, videoTrackAssignments)) {
            setVideoTrackAssignments(tempVideoTrackAssignments);
        }

        let allParticipantsTemp = {...allParticipants};
        delete allParticipantsTemp["streamId_" + suffix];
        if (!_.isEqual(allParticipantsTemp, allParticipants)) {
            setAllParticipants(allParticipantsTemp);
        }

        console.log("fake participant removed");
        setParticipantUpdated(!participantUpdated);
    }

    function handleMainTrackBroadcastObject(broadcastObject) {
        if (broadcastObject.metaData !== undefined && broadcastObject.metaData !== null) {
            let brodcastStatusMetadata = JSON.parse(broadcastObject.metaData);

            if (brodcastStatusMetadata.isRecording !== undefined && brodcastStatusMetadata.isRecording !== null) {
                setIsRecordPluginActive(brodcastStatusMetadata.isRecording);
            }
        }
    }


    function handleSubtrackBroadcastObject(broadcastObject) {
        let streamName = broadcastObject.name;
        let metaDataStr = broadcastObject.metaData;
        // Handle adding external stream as subtrack via REST case. If this is not done tile is not rendered by circle.
        if(!streamName){
          broadcastObject.name = broadcastObject.streamId
        }
        if(metaDataStr === "" || metaDataStr === null || metaDataStr === undefined){
          broadcastObject.metaData = "{\"isMicMuted\":false,\"isCameraOn\":true,\"isScreenShared\":false,\"playOnly\":false}"
        }

        let metaData = JSON.parse(broadcastObject.metaData);

        let allParticipantsTemp = {...allParticipants};
        let pagedParticipantsTemp = {...pagedParticipants};

        broadcastObject.isScreenShared = metaData.isScreenShared;
        let filteredBroadcastObject = filterBroadcastObject(broadcastObject);
        allParticipantsTemp[filteredBroadcastObject.streamId] = filteredBroadcastObject; //TODO: optimize
        pagedParticipantsTemp[filteredBroadcastObject.streamId] = filteredBroadcastObject;
        if (!_.isEqual(allParticipantsTemp, allParticipants)) {
            setPagedParticipants(pagedParticipantsTemp);
            setAllParticipants(allParticipantsTemp);
            setParticipantUpdated(!participantUpdated);
        }
    }

    // TODO: instead of filterBroadcastObject, we can implement eqivalent function instead of _.isEqual
    function filterBroadcastObject(broadcastObject) {
        let tempBroadcastObject = broadcastObject;
        if (tempBroadcastObject !== null && tempBroadcastObject !== undefined) {
            tempBroadcastObject.receivedBytes = -1;
            tempBroadcastObject.duration = -1;
            tempBroadcastObject.bitrate = -1;
            tempBroadcastObject.updateTime = -1;
        }
        if (tempBroadcastObject.streamId === publishStreamId) {
            tempBroadcastObject.name = "You";
        }
        return tempBroadcastObject;
    }

    useEffect(() => {
        createWebRTCAdaptor();
        //just run once when component is mounted
    }, []);  //eslint-disable-line

    function createWebRTCAdaptor() {
        reconnecting = false;
        publishReconnected = true;
        playReconnected = true;
        console.log("++ createWebRTCAdaptor");
        //here we check if audio or video device available and wait result
        //according to the result we modify mediaConstraints

        checkDevices().then(() => {
            var adaptor = new WebRTCAdaptor({
                websocket_url: websocketURL,
                mediaConstraints: mediaConstraints,
                peerconnection_config: peerconnection_config,
                isPlayMode: isPlayOnly, // onlyDataChannel: isPlayOnly,
                debug: true,
                callback: infoCallback,
                callbackError: errorCallback,
                purposeForTest: "main-adaptor"
            });
            setWebRTCAdaptor(adaptor)
        });
    }

    useEffect(() => {
        if (devices.length > 0) {
            checkAndUpdateVideoAudioSources();
        } else {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                setDevices(devices);
            });
        }
    }, [devices]); // eslint-disable-line 

    if (webRTCAdaptor) {
        webRTCAdaptor.callback = infoCallback;
        webRTCAdaptor.callbackError = errorCallback;
        webRTCAdaptor.localStream = localVideo;
    }



    React.useEffect(() => {
        if ((isPublished || isPlayOnly) && isPlayed) {
            setWaitingOrMeetingRoom("meeting")
            setIsJoining(false);
        }
    }, [isPublished, isPlayed, isPlayOnly])

    function createScreenShareWebRtcAdaptor() {

        navigator.mediaDevices.getDisplayMedia(getMediaConstraints("screenConstraints", 20))
            .then((stream) => {
                if (stream !== null && stream !== undefined && stream.getVideoTracks().length > 0) {
                    // it handles the stop screen sharing event
                    stream.getVideoTracks()[0].addEventListener('ended', () => {
                        handleStopScreenShare();
                    });
                }
                screenShareWebRtcAdaptor.current = new WebRTCAdaptor({
                    websocket_url: websocketURL,
                    localStream: stream,
                    mediaConstraints: getMediaConstraints("screenConstraints", 20),
                    peerconnection_config: peerconnection_config,
                    sdp_constraints: {
                        OfferToReceiveAudio: false, OfferToReceiveVideo: false,
                    },
                    debug: true,
                    callback: screenShareWebRtcAdaptorInfoCallback,
                    callbackError: screenShareWebRtcAdaptorErrorCallback,
                    purposeForTest: "screen-share"
                })

            }).catch(error => {
            console.log(error)
        })

    }

    function startScreenSharing() {

        var metaData = {
            isMicMuted: false, isCameraOn: true, isScreenShared: true, playOnly: false, role: roleInit
        }

        let currentStreamName = streamName + " - Screen Share";

        screenShareStreamId.current = publishStreamId + "_presentation"

        screenShareWebRtcAdaptor.current.publish(screenShareStreamId.current, token, subscriberId, subscriberCode, currentStreamName, roomName, JSON.stringify(metaData), roleInit)

        setScreenSharingInProgress(true);

        setTimeout(() => {
            setScreenSharingInProgress(false);
        }, 5000);
    }

    React.useEffect(() => {
        if (isPlayOnly && enterDirectly && initialized) {
            let streamId = makeid(10);
            setStreamName("Anonymous");

            // if play only mode and enter directly flags are true, then we will enter the meeting room directly
            setWaitingOrMeetingRoom("meeting");

            joinRoom(roomName, streamId);
        }


        // eslint-disable-next-line 
    }, [initialized]);

    function checkAndSetIsPinned(streamId, broadcastObject) {
        let existingBroadcastObject = allParticipants[streamId];
        if (existingBroadcastObject !== null && existingBroadcastObject !== undefined) {
            broadcastObject.isPinned = existingBroadcastObject.isPinned;
        }
        return broadcastObject;
    }

    function infoCallback(info, obj) {
        if (info === "initialized") {
            setInitialized(true);
        } else if (info === "subtrackList") {
            let subtrackList = obj.subtrackList;
            let allParticipantsTemp = {};
            let pagedParticipantsTemp = {};
            if (!isPlayOnly && publishStreamId) {
                allParticipantsTemp[publishStreamId] = {name: "You"};
            }

            // We are getting the subtracks of the room and adding them to the allParticipantsTemp
            subtrackList.forEach(subTrack => {
                let broadcastObject = JSON.parse(subTrack);

                handleSubtrackBroadcastObject(broadcastObject);

                let metaDataStr = broadcastObject.metaData;
                if(metaDataStr === "" || metaDataStr === null || metaDataStr === undefined){
                    metaDataStr = "{\"isMicMuted\":false,\"isCameraOn\":true,\"isScreenShared\":false,\"playOnly\":false}"
                }

                let metaData = JSON.parse(metaDataStr);
                broadcastObject.isScreenShared = metaData.isScreenShared;

                let filteredBroadcastObject = filterBroadcastObject(broadcastObject);
                filteredBroadcastObject = checkAndSetIsPinned(filteredBroadcastObject.streamId, filteredBroadcastObject);
                allParticipantsTemp[filteredBroadcastObject.streamId] = filteredBroadcastObject;
                pagedParticipantsTemp[filteredBroadcastObject.streamId] = filteredBroadcastObject;
            });

            // Subtrack list is pagination based, but we need to keep participants who have video track assignments but not in the subtrack list
            const participantVTAByStreamId = new Map(
                videoTrackAssignments.map(e => [e.streamId, e])
            );

            Object.keys(allParticipants).forEach(participantId => {
                if (participantVTAByStreamId.has(participantId) && !allParticipantsTemp[participantId]) {
                    allParticipantsTemp[participantId] = allParticipants[participantId];
                }
            });

            // add fake participants into the new list
            Object.keys(allParticipants).forEach(streamId => {
                let broadcastObject = allParticipants[streamId];
                if (broadcastObject.isFake === true) {
                    allParticipantsTemp[streamId] = broadcastObject;
                    pagedParticipantsTemp[streamId] = broadcastObject;
                }
            });
            if (!_.isEqual(pagedParticipantsTemp, pagedParticipants)) {
                setPagedParticipants(pagedParticipantsTemp);
            }
            if (!_.isEqual(allParticipantsTemp, allParticipants)) {
                setAllParticipants(allParticipantsTemp);
                setParticipantUpdated(!participantUpdated);
            }
        } else if (info === "subtrackCount") {
            if (obj.count !== undefined) {
                if (obj.count > participantCount) {
                    // if the new participant is added, we need to get the subtrack list again
                    webRTCAdaptor?.getSubtracks(roomName, null, globals.participantListPagination.offset, globals.participantListPagination.pageSize);
                }
                setParticipantCount(obj.count);
            }
        } else if (info === "broadcastObject") {
            if (obj.broadcast === undefined) {
                return;
            }

            let broadcastObject = JSON.parse(obj.broadcast);

            if (obj.streamId === roomName) { //maintrack object
                handleMainTrackBroadcastObject(broadcastObject);
            } else { //subtrack object
                handleSubtrackBroadcastObject(broadcastObject);
            }

            console.log(obj.broadcast);
        } else if (info === "newTrackAvailable") {
            console.log("newTrackAvailable:", obj);
            handlePlayVideo(obj);
        } else if (info === "publish_started") {
            setIsPublished(true);
            streamIdInUseCounter = 0;
            console.log("**** publish started:" + reconnecting);
            updateMaxVideoTrackCount(appSettingsMaxVideoTrackCount);

            if (reconnecting) {
                // we need to set the local video again after the reconnection
                let newLocalVideo = document.getElementById((typeof publishStreamId === "undefined") ? "localVideo" : publishStreamId);
                localVideoCreate(newLocalVideo);
                // we need to set the setVideoCameraSource to be able to update sender source after the reconnection
                webRTCAdaptor.mediaManager.setVideoCameraSource(publishStreamId, webRTCAdaptor.mediaManager.mediaConstraints, null, true);
                webRTCAdaptor?.getSubtracks(roomName, null, globals.participantListPagination.offset, globals.participantListPagination.pageSize);
                publishReconnected = true;
                reconnecting = !(publishReconnected && playReconnected);
                setIsReconnectionInProgress(reconnecting);

                return;
            }
            console.log("publish started");
            playJoinRoomSound();
            //stream is being published
            webRTCAdaptor?.enableStats(publishStreamId);
        } else if (info === "publish_finished") {
            setIsPublished(false);
            //stream is being finished
        } else if (info === "play_finished") {
            setIsPlayed(false);
            //stream is being finished
        } else if (info === "session_restored") {
            console.log("**** session_restored:" + reconnecting);
            if (reconnecting) {
                publishReconnected = true;
                reconnecting = !(publishReconnected && playReconnected);
                setIsReconnectionInProgress(reconnecting);
            }
        } else if (info === "play_started") {
            console.log("**** play started:" + reconnecting);
            setIsPlayed(true);
            setIsNoSreamExist(false);
            webRTCAdaptor?.getBroadcastObject(roomName);
            webRTCAdaptor?.getSubtrackCount(roomName, null, null);
            webRTCAdaptor?.getSubtracks(roomName, null, globals.participantListPagination.offset, globals.participantListPagination.pageSize);
            requestVideoTrackAssignmentsInterval();

            if (isPlayOnly) {
                setWaitingOrMeetingRoom("meeting");
                setIsJoining(false);
            }

            if (reconnecting) {
                playReconnected = true;
                reconnecting = !((publishReconnected || isPlayOnly) && playReconnected);
                setIsReconnectionInProgress(reconnecting);
            }
            webRTCAdaptor?.enableStats(roomName);
        } else if (info === "play_finished") {
            clearInterval(requestVideoTrackAssignmentsInterval);
            videoTrackAssignmentsIntervalJob = null;
        } else if (info === "screen_share_stopped") {

        } else if (info === "screen_share_started") {

        } else if (info === "data_received") {
            try {
                handleNotificationEvent(obj);
            } catch (e) {
            }
        } else if (info === "available_devices") {
            setDevices(obj);

        } else if (info === "updated_stats") {
            if (obj.streamId === roomName) {
                checkConnectionQualityForPlay(obj);
            } else {
                checkConnectionQualityForPublish(obj);
            }
        } else if (info === "debugInfo") {
            handleDebugInfo(obj.debugInfo);
        } else if (info === "ice_connection_state_changed") {
            console.log("iceConnectionState Changed: ", JSON.stringify(obj))
        } else if (info === "reconnection_attempt_for_player") {
            console.log("Reconnection attempt for player")
            if (isPlayOnly && isNoSreamExist) { // xxx
                console.log("Reconnection attempt for player with no stream existmfor play only mode.")
            } else {
                playReconnected = false;
                //reset UI releated states
                removeAllRemoteParticipants();
                
                if (!reconnecting) {
                    reconnectionInProgress();
                }
            }
        } else if (info === "reconnection_attempt_for_publisher") {
            console.log("Reconnection attempt for publisher")
            publishReconnected = isPlayOnly;
            if (!reconnecting) {
                reconnectionInProgress();
            }
        }
    }

    function checkConnectionQualityForPlay(obj) {
        if (obj.inboundRtpList === undefined || obj.inboundRtpList === null || obj.inboundRtpList.length === 0) {
            // it means that there is no incoming stream so we don't need to check the connection quality for playback
            return;
        }

        let totalPacketsLost, videoPacketsLost, audioPacketsLost, totalBytesReceived, incomingBitrate;

        // if the playStats is null, it means that it is the first time to get the stats
        // so we don't need to check the connection quality for playback
        if (playStats.current !== null) {

            // Calculate total bytes received
            totalBytesReceived = obj.totalBytesReceivedCount;

            // Calculate video frames received and frames dropped
            let framesReceived = obj.framesReceived;
            let framesDropped = obj.framesDropped;

            // Calculate the time difference (in seconds)
            let timeElapsed = (obj.currentTimestamp - obj.startTime) / 1000; // Convert ms to seconds

            // Calculate incoming bitrate (bits per second)
            let bytesReceivedDiff = obj.lastBytesReceived - obj.firstBytesReceivedCount;
            incomingBitrate = (bytesReceivedDiff * 8) / timeElapsed; // Convert bytes to bits

            // Calculate packet loss
            videoPacketsLost = obj.videoPacketsLost;
            audioPacketsLost = obj.audioPacketsLost;
            totalPacketsLost = videoPacketsLost + audioPacketsLost;

            // Calculate RTT as the average of audio and video RTT
            let rtt = ((parseFloat(obj.videoRoundTripTime) + parseFloat(obj.audioRoundTripTime)) / 2).toPrecision(3);

            // Calculate frame drop rate as a percentage
            let frameDropRate = (framesDropped / framesReceived) * 100;

            // Determine network status warnings
            if (rtt > 0.15 || frameDropRate > 5) {
                console.warn(`rtt: ${rtt}, average frameDropRate: ${frameDropRate}`);
                displayPoorNetworkConnectionWarning("Network connection is weak. You may encounter connection drop!");
            } else if (rtt > 0.1 || frameDropRate > 2.5) {
                console.warn(`rtt: ${rtt}, average frameDropRate: ${frameDropRate}`);
                displayPoorNetworkConnectionWarning("Network connection is not stable. Please check your connection!");
            }
        }

        let updatedPlayStats = {totalPacketsLost: totalPacketsLost, videoPacketsLost: videoPacketsLost, audioPacketsLost: audioPacketsLost, totalBytesReceived: totalBytesReceived, incomingBitrate: incomingBitrate, inboundRtpList: obj.inboundRtpList};
        console.log("playStats:", updatedPlayStats);
        playStats.current = updatedPlayStats;
    }

    function checkConnectionQualityForPublish(obj) {
        let rtt = ((parseFloat(obj.videoRoundTripTime) + parseFloat(obj.audioRoundTripTime)) / 2).toPrecision(3);
        let jitter = ((parseFloat(obj.videoJitter) + parseInt(obj.audioJitter)) / 2).toPrecision(3);
        //let outgoingBitrate = parseInt(obj.currentOutgoingBitrate);

        let packageLost = parseInt(obj.videoPacketsLost) + parseInt(obj.audioPacketsLost);
        let packageSent = parseInt(obj.totalVideoPacketsSent) + parseInt(obj.totalAudioPacketsSent);

        let packageLostPercentage = 0;
        console.log("publishStats:", publishStats.current);
        if (publishStats.current !== null) {
            let deltaPackageLost = packageLost - publishStats.current.packageLost;
            let deltaPackageSent = packageSent - publishStats.current.packageSent;

            if (deltaPackageLost > 0) {
                packageLostPercentage = ((deltaPackageLost / parseInt(deltaPackageSent)) * 100).toPrecision(3);
            }
        }

        if (rtt >= 0.15 || packageLostPercentage >= 2.5 || jitter >= 0.08) { //|| ((outgoingBitrate / 100) * 80) >= obj.availableOutgoingBitrate
            console.warn("rtt:" + rtt + " packageLostPercentage:" + packageLostPercentage + " jitter:" + jitter); // + " Available Bandwidth kbps :", obj.availableOutgoingBitrate, "Outgoing Bandwidth kbps:", outgoingBitrate);
            displayPoorNetworkConnectionWarning("Network connection is weak. You may encounter connection drop!");
        } else if (rtt >= 0.1 || packageLostPercentage >= 1.5 || jitter >= 0.05) {
            console.warn("rtt:" + rtt + " packageLostPercentage:" + packageLostPercentage + " jitter:" + jitter);
            displayPoorNetworkConnectionWarning("Network connection is not stable. Please check your connection!");
        }

        publishStats.current = {packageLost: packageLost, packageSent: packageSent};
    }

    //TODO : add receive stats

    function screenShareWebRtcAdaptorInfoCallback(info, obj) {
        if (info === "initialized") {
            startScreenSharing();
        } else if (info === "publish_started") {
            let notEvent = {
                streamId: screenShareStreamId.current, eventType: "SCREEN_SHARED_ON"
            };
            console.info("send notification event", notEvent);
            webRTCAdaptor?.sendData(publishStreamId, JSON.stringify(notEvent));

            setIsScreenShared(true);
            //webRTCAdaptor?.assignVideoTrack("videoTrack0", screenShareStreamId.current, true);
            //pinVideo(screenShareStreamId.current);

        } else if (info === "updated_stats") {
            //checkConnectionQuality(obj);
        } else if (info === "ice_connection_state_changed") {
            //FIXME: handle reconnection
        }
    }


    function screenShareWebRtcAdaptorErrorCallback(error, message) {
        console.log("error from screen share webrtc adaptor callback")
        //some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
        console.log("error:" + error + " message:" + message);
    }

    function errorCallback(error, message) {
        //some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
        var errorMessage = JSON.stringify(error);
        if (typeof message != "undefined") {
            errorMessage = message;
        }
        if (error.indexOf("no_active_streams_in_room") !== -1) {
            errorMessage = "No active stream in the room.";
        }
        errorMessage = JSON.stringify(error);
        if (error.indexOf("NotFoundError") !== -1) {
            errorMessage = "Camera or Mic are not found or not allowed in your device.";
            alert(errorMessage);
        } else if (error.indexOf("NotReadableError") !== -1 || error.indexOf("TrackStartError") !== -1) {
            errorMessage = "Camera or Mic is being used by some other process that does not not allow these devices to be read.";
            displayWarning(errorMessage);

        } else if (error.indexOf("OverconstrainedError") !== -1 || error.indexOf("ConstraintNotSatisfiedError") !== -1) {
            errorMessage = "There is no device found that fits your video and audio constraints. You may change video and audio constraints.";
            alert(errorMessage);
        } else if (error.indexOf("NotAllowedError") !== -1 || error.indexOf("PermissionDeniedError") !== -1) {
            errorMessage = "You are not allowed to access camera and mic.";
        } else if (error.indexOf("TypeError") !== -1) {
            errorMessage = "Video/Audio is required.";
            displayWarning(errorMessage);
            webRTCAdaptor?.mediaManager.getDevices();
        } else if (error.indexOf("UnsecureContext") !== -1) {
            errorMessage = "Fatal Error: Browser cannot access camera and mic because of unsecure context. Please install SSL and access via https";
        } else if (error.indexOf("WebSocketNotSupported") !== -1) {
            errorMessage = "Fatal Error: WebSocket not supported in this browser";
        } else if (error.indexOf("no_stream_exist") !== -1) {
            setIsNoSreamExist(true);
        } else if (error.indexOf("streamIdInUse") !== -1) {
            // if the stream id is in use when reconnection, don't display the error
            if (!reconnecting) {
                streamIdInUseCounter++;
                if (streamIdInUseCounter > 3) {
                    console.log("This stream id is already in use. You may be logged in on another device.");
                    setLeaveRoomWithError("Streaming is already active with your username. Please check that you're not using it in another browser tab.");
                    setLeftTheRoom(true);
                    setIsJoining(false);
                    setIsReconnectionInProgress(false);
                }
            }
        } else if (error.indexOf("data_channel_error") !== -1) {
            errorMessage = "There was a error during data channel communication";
        } else if (error.indexOf("ScreenSharePermissionDenied") !== -1) {
            errorMessage = "You are not allowed to access screen share";
        } else if (error.indexOf("WebSocketNotConnected") !== -1) {
            errorMessage = "WebSocket Connection is disconnected.";
        } else if (error.indexOf("already_publishing") !== -1) {
            console.log("**** already publishing:" + reconnecting);
            if (reconnecting) {
                webRTCAdaptor?.stop(publishStreamId);

                setTimeout(() => {
                    handlePublish(publishStreamId, token, subscriberId, subscriberCode);
                }, 2000);
            }
        } else if (error.indexOf("unauthorized_access") !== -1) {
            handleLeaveFromRoom()

            setUnAuthorizedDialogOpen(true)
        } else if (error.indexOf("highResourceUsage") !== -1) {
            setHighResourceUsageWarningCount(highResourceUsageWarningCount + 1);

            if (highResourceUsageWarningCount % 3 === 0) {
                displayMessage("All servers are busy. Retrying to connect...", "white");
            }
            if (!isJoining && roomName && publishStreamId) {

                setTimeout(() => {
                    webRTCAdaptor?.closeWebSocket();
                    if (!isPlayOnly) {
                        webRTCAdaptor?.stop(publishStreamId);
                    }
                    webRTCAdaptor?.stop(roomName);
                    webRTCAdaptor?.checkWebSocketConnection();
                    joinRoom(roomName, publishStreamId);
                }, 3000);
            }
        } else if (error === "publishTimeoutError") {
            setLeaveRoomWithError("Firewall might be blocking your connection. Please report this.");
            setLeftTheRoom(true);
            setIsJoining(false);
            setIsReconnectionInProgress(false);
        } else if (error === "license_suspended_please_renew_license") {
            setLeaveRoomWithError("Licence error. Please report this.");
            setLeftTheRoom(true);
            setIsJoining(false);
            setIsReconnectionInProgress(false);
        } else if (error === "notSetRemoteDescription") {
            setLeaveRoomWithError("System is not compatible to connect. Please report this.");
            setLeftTheRoom(true);
            setIsJoining(false);
            setIsReconnectionInProgress(false);
        }
        console.log("***** " + error)
    }

    function pinFirstVideo() {
        pinVideo(videoTrackAssignments[0].streamId)
    }

    function pinVideo(streamId) {
        // id is for pinning user.
        let videoLabel;
        let broadcastObject = allParticipants[streamId];

        if (broadcastObject === null || broadcastObject === undefined) {
            console.error("Cannot find broadcast object for streamId: " + streamId);
            return;
        }

        // if we already pin the targeted user then we are going to remove it from pinned video.
        if ((typeof broadcastObject.isPinned !== "undefined") && (broadcastObject.isPinned === true)) {
            broadcastObject.isPinned = false; // false means user unpin manually
            allParticipants[streamId] = broadcastObject;
            handleNotifyUnpinUser(streamId !== publishStreamId ? streamId : publishStreamId);
            setParticipantUpdated(!participantUpdated);

            let vta = videoTrackAssignments.find(el => el.streamId == streamId);
            if (vta) {
                webRTCAdaptor?.assignVideoTrack(vta.videoLabel, streamId, false);
            }
            return;
        }

        // if there is no pinned video we are going to pin the targeted user.
        // and we need to inform pinned user.
        if (streamId === publishStreamId) {
            videoLabel = "localVideo";
        }

        if (videoLabel !== "localVideo") {
            let nextAvailableVideoLabel;

            // if we are publisher, the first video track is reserved for local video, so we start from 1
            // if we are play only, the first video track is not reserved for local video, so we start from 0
            let videoTrackAssignmentStartIndex = (isPlayOnly) ? 0 : 1;

            for (let i = videoTrackAssignmentStartIndex; i < videoTrackAssignments.length; i++) {
                // if the video track is not reserved, we can assign it to the pinned user
                if (videoTrackAssignments[i].isReserved === false) {
                    nextAvailableVideoLabel = videoTrackAssignments[i]?.videoLabel;
                    break;
                }
            }

            if (nextAvailableVideoLabel === undefined && videoTrackAssignments.length > videoTrackAssignmentStartIndex) {
                // if there is no available video track, we use the first video track
                videoLabel = videoTrackAssignments[videoTrackAssignmentStartIndex]?.videoLabel
            } else if (nextAvailableVideoLabel === undefined) {
                console.error("Cannot find available video track for pinning user.");
                return;
            } else {
                videoLabel = nextAvailableVideoLabel;
            }

            setTimeout(() => {
                webRTCAdaptor?.assignVideoTrack(videoLabel, streamId, true);
            }, 1000);
            

        }

        Object.keys(allParticipants).forEach(id => {
            let participant = allParticipants[id];
            if (typeof participant.isPinned !== 'undefined' && participant.isPinned === true) {

                participant.isPinned = false;
                allParticipants[id] = participant;
            }
        });

        broadcastObject.isPinned = true;
        allParticipants[streamId] = broadcastObject;

        handleNotifyPinUser(streamId !== publishStreamId ? streamId : publishStreamId);

        setParticipantUpdated(!participantUpdated);
    }

    function turnOffYourCamNotification(participantId) {
        handleSendNotificationEvent(
            "TURN_YOUR_CAM_OFF",
            publishStreamId,
            {
                streamId: participantId,
                senderStreamId: publishStreamId
            }
        );
    }

    function turnOnYourMicNotification(participantId) {
        handleSendNotificationEvent(
            "TURN_YOUR_MIC_ON",
            publishStreamId,
            {
                streamId: participantId,
                senderStreamId: publishStreamId
            }
        );
    }

    function handleNotifyPinUser(id) {
        if (id === "localVideo") {
            // if we pin local video then we are not going to inform anyone.
            return;
        }
        // If I PIN USER then i am going to inform pinned user.
        // Why? Because if i pin someone, pinned user's resolution has to change for better visibility.
        handleSendNotificationEvent("PIN_USER", publishStreamId, {
            streamId: id,
        });
    }

    function handleNotifyUnpinUser(id) {
        // If I UNPIN USER then i am going to inform pinned user.
        // Why? We need to decrease resolution for pinned user's internet usage.
        handleSendNotificationEvent("UNPIN_USER", publishStreamId, {
            streamId: id,
        });
    }

    function handleSetDesiredTileCount(maxTrackCount) {
        globals.desiredTileCount = maxTrackCount;
    }

    function updateMaxVideoTrackCount(newCount) {
        if (publishStreamId && globals.maxVideoTrackCount !== newCount) {
            globals.maxVideoTrackCount = newCount;
            console.log("maxVideoTrackCount updated to: " + newCount);
            webRTCAdaptor?.setMaxVideoTrackCount(publishStreamId, newCount);
        }
    }

    function handleStartScreenShare() {
        createScreenShareWebRtcAdaptor()
    }

    function turnOffYourMicNotification(participantId) {
        handleSendNotificationEvent("TURN_YOUR_MIC_OFF", publishStreamId, {
            streamId: participantId, senderStreamId: publishStreamId
        });
    }

    function startRecord() {

        displayMessage("Recording is about to start...", "white")
        var jsCmd = {
            command: "startRecording", streamId: roomName, websocketURL: websocketURL, token: token
        };

        sendMessage(JSON.stringify(jsCmd));
    }

    function stopRecord() {
        displayMessage("Recording is about to stop...", "white")
        var jsCmd = {
            command: "stopRecording", streamId: roomName,
        };

        sendMessage(JSON.stringify(jsCmd));
    }

   

    const displayPoorNetworkConnectionWarning = (message) => {
        console.warn("Poor Network Connection Warning:" + message);

        if (last_warning_time == null || Date.now() - last_warning_time > 1000 * 30) {
            last_warning_time = Date.now();
            displayWarning(message);
        }
    }

    const displayMessage = React.useCallback((message, color) => {
        closeSnackbar();
        enqueueSnackbar(message, {
            icon: <SvgIcon size={24} name={'report'} color={color}/>,
            variant: "info",
            autoHideDuration: 5000,
            anchorOrigin: {
                vertical: "top", horizontal: "right",
            },
        });
    }, [closeSnackbar, enqueueSnackbar]);

    const displayWarning = (message) => {
        displayMessage(message, "red");
    }

    function handleStopScreenShare() {
        setIsScreenShared(false);
        screenShareWebRtcAdaptor.current.stop(screenShareStreamId.current);
        screenShareWebRtcAdaptor.current.closeStream();
        screenShareWebRtcAdaptor.current.closeWebSocket();
    }

    function handleSetMessages(newMessage) {
        setMessages((oldMessages) => {
            let lastMessage = oldMessages[oldMessages.length - 1]; //this must remain mutable
            const isSameUser = lastMessage?.name === newMessage?.name;
            const sentInSameTime = lastMessage?.date === newMessage?.date;
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            newMessage.date = new Date(newMessage?.date).toLocaleString(getLang(), {
                timeZone: timezone, hour: "2-digit", minute: "2-digit"
            });
            calculate_scroll_height();
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
        if (navigator.languages !== undefined) return navigator.languages[0];
        return navigator.language;
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    function scrollToBottom() {
        let objDiv = document.getElementById("paper-props");
        if (objDiv && scroll_down && objDiv.scrollHeight > objDiv.clientHeight) {
            objDiv.scrollTo(0, objDiv.scrollHeight);
            scrollThreshold = 0.95;
            scroll_down = false;
        }

    }

    function handleMessageDrawerOpen(open) {
        closeSnackbar();
        setMessageDrawerOpen(open);
        if (open) {
            setParticipantListDrawerOpen(false);
            setEffectsDrawerOpen(false);
            setPublisherRequestListDrawerOpen(false);
        }
    }

    function handleParticipantListOpen(open) {
        setParticipantListDrawerOpen(open);
        if (open) {
            setMessageDrawerOpen(false);
            setEffectsDrawerOpen(false);
            setPublisherRequestListDrawerOpen(false);
        }
    }

    function handleEffectsOpen(open) {
        setEffectsDrawerOpen(open);
        if (open) {
            setMessageDrawerOpen(false);
            setParticipantListDrawerOpen(false);
            setPublisherRequestListDrawerOpen(false);
    }
  }

  function handlePublisherRequestListOpen(open) {
    setPublisherRequestListDrawerOpen(open);
    if (open) {
      setMessageDrawerOpen(false);
      setParticipantListDrawerOpen(false);
      setEffectsDrawerOpen(false);
        }
    }

    function handlePublisherRequest() {
        if (!isPlayOnly) {
            return;
        }
        handleSendNotificationEvent("REQUEST_BECOME_PUBLISHER", roomName, {
            senderStreamId: publishStreamId, senderStreamName: streamName
        });
    }

    function makeListenerAgain(streamId) {
        handleSendNotificationEvent("MAKE_LISTENER_AGAIN", roomName, {
            senderStreamId: streamId
        });
        updateParticipantRole(streamId, WebinarRoles.Listener);
    }

    function handleStartBecomePublisher() {
        if (isPlayOnly) {
            setIsPlayOnly(false);
            setInitialized(false);
            setWaitingOrMeetingRoom("waiting");
        }
    }

    function approveBecomeSpeakerRequest(streamId) {
        setRequestSpeakerList(requestSpeakerList.filter((item) => item !== streamId));
        handleSendNotificationEvent("APPROVE_BECOME_PUBLISHER", roomName, {
            senderStreamId: streamId
        });
        updateParticipantRole(streamId, WebinarRoles.TempListener);
    }

    function rejectBecomeSpeakerRequest(streamId) {
        setRequestSpeakerList(requestSpeakerList.filter((item) => item !== streamId))
        handleSendNotificationEvent("REJECT_BECOME_PUBLISHER", roomName, {
            senderStreamId: streamId
        });
    }

    function handleSendMessage(message) {
        if (publishStreamId || isPlayOnly) {

            let streamId = isPlayOnly ? roomName : publishStreamId;
            let iceState = webRTCAdaptor?.iceConnectionState(streamId);
            if (iceState !== null && iceState !== "failed" && iceState !== "disconnected") {
                if (message === "debugme") {
                    webRTCAdaptor?.getDebugInfo(streamId);
                    return;
                } else if (message === "clearme") {
                    setMessages([]);
                    return;
                }


                webRTCAdaptor?.sendData(streamId, JSON.stringify({
                    eventType: "MESSAGE_RECEIVED",
                    message: message,
                    name: streamName,
                    senderId: streamId,
                    date: new Date().toString()
                }));
            }
        }
    }

    function handleDebugInfo(debugInfo) {
        var infoText = "Client Debug Info\n";
        infoText += "Events:\n";
        infoText += JSON.stringify(globals.trackEvents) + "\n";
        infoText += "Video Track Assignments (" + videoTrackAssignments.length + "):\n\n";
        infoText += JSON.stringify(videoTrackAssignments) + "\n\n";
        infoText += "All Participants (" + Object.keys(allParticipants).length + "):\n";
        Object.entries(allParticipants).forEach(([key, value]) => {
            infoText += "- " + key + "\n";
        });
        //infoText += JSON.stringify(allParticipants) + "\n";
        infoText += "----------------------\n";
        infoText += debugInfo;

        //fake message to add chat
        var obj = {
            streamId: publishStreamId, data: JSON.stringify({
                eventType: "MESSAGE_RECEIVED", name: "Debugger", date: new Date().toLocaleTimeString([], {
                    hour: "2-digit", minute: "2-digit",
                }), message: infoText,
            }),
        };

        handleNotificationEvent(obj);
    }

    function toggleSetNumberOfUnreadMessages(numb) {
        setNumberOfUnReadMessages(numb);
    }

    function calculate_scroll_height() {
        let objDiv = document.getElementById("paper-props");
        if (objDiv) {
            let scrollPosition = objDiv.scrollTop / (objDiv.scrollHeight - objDiv.clientHeight);
            if (scrollPosition > scrollThreshold) {
                scroll_down = true;
            }
        }
    }

    React.useEffect(() => {
        updateUserStatusMetadata(isMyMicMuted, !isMyCamTurnedOff);
    }, [role]);

    React.useEffect(() => {
        // we need to empty participant array. if we are going to leave it in the first place.
        setVideoTrackAssignments([]);
        setAllParticipants({});

        clearInterval(audioListenerIntervalJob);
        audioListenerIntervalJob = null;

        if (isPlayOnly) {
            webRTCAdaptor?.stop(publishStreamId);
        }
        webRTCAdaptor?.stop(roomName);

        if (isPlayOnly) {
            webRTCAdaptor?.turnOffLocalCamera(publishStreamId);
        }
        //close streams fully to not encounter webcam light
        webRTCAdaptor?.closeStream();

        if (isScreenShared && screenShareWebRtcAdaptor.current != null) {
            handleStopScreenShare();
        }

        createWebRTCAdaptor();

        setWaitingOrMeetingRoom("waiting");
    }, [isPlayOnly]);

    function handleNotificationEvent(obj) {
        var notificationEvent = JSON.parse(obj.data);
        //console.log("handleNotificationEvent:", notificationEvent);
        if (notificationEvent != null && typeof notificationEvent == "object") {
            var eventStreamId = notificationEvent.streamId;
            var eventType = notificationEvent.eventType;

            if (eventType === "CAM_TURNED_OFF" || eventType === "CAM_TURNED_ON" || eventType === "MIC_MUTED" || eventType === "MIC_UNMUTED") {
                webRTCAdaptor?.getBroadcastObject(eventStreamId);
            } else if (eventType === "RECORDING_TURNED_ON") {
                setIsRecordPluginActive(true);
            } else if (eventType === "RECORDING_TURNED_OFF") {
                setIsRecordPluginActive(false);
            } else if (eventType === "BROADCAST_ON" && eventStreamId === publishStreamId) {
                setIsBroadcasting(true);
                console.log("BROADCAST_ON");
            } else if (eventType === "BROADCAST_OFF" && eventStreamId === publishStreamId) {
                setIsBroadcasting(false);
                console.log("BROADCAST_OFF");
            } else if (eventType === "MESSAGE_RECEIVED") {
                // if message arrives from myself or footer message button is disabled then we are not going to show it.
                if (notificationEvent.senderId === publishStreamId || process.env.REACT_APP_FOOTER_MESSAGE_BUTTON_VISIBILITY === 'false') {
                    return;
                }
                calculate_scroll_height();
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                notificationEvent.date = new Date(notificationEvent?.date).toLocaleString(getLang(), {
                    timeZone: timezone, hour: "2-digit", minute: "2-digit"
                });
                // if message arrives.
                // if there is an new message and user has not opened message component then we are going to increase number of unread messages by one.
                // we are gonna also send snackbar.
                if (!messageDrawerOpen) {
                    enqueueSnackbar(notificationEvent.message, {
                        sender: notificationEvent.name, variant: "message", onClick: () => {
                            handleMessageDrawerOpen(true);
                            setNumberOfUnReadMessages(0);
                        }, autoHideDuration: 5000, anchorOrigin: {
                            vertical: "top", horizontal: "right",
                        },
                    });
                    setNumberOfUnReadMessages((numb) => numb + 1);
                }
                setMessages((oldMessages) => {
                    let lastMessage = oldMessages[oldMessages.length - 1]; //this must remain mutable
                    const isSameUser = lastMessage?.name === notificationEvent?.name;
                    const sentInSameTime = lastMessage?.date === notificationEvent?.date;

                    if (isSameUser && sentInSameTime) {
                        //group the messages *sent back to back in the same timeframe by the same user* by joinig the new message text with new line
                        lastMessage.message = lastMessage.message + "\n" + notificationEvent.message;
                        return [...oldMessages]; // don't make this "return oldMessages;" this is to trigger the useEffect for scroll bottom and get over showing the last prev state do
                    } else {
                        return [...oldMessages, notificationEvent];
                    }
                });
            } else if (eventType === "REACTIONS" && notificationEvent.senderStreamId !== publishStreamId) {
                showReactions(notificationEvent.senderStreamId, notificationEvent.senderStreamName, notificationEvent.reaction, allParticipants);
            } else if (eventType === "TURN_YOUR_CAM_OFF") {
                if (publishStreamId === notificationEvent.streamId) {
                    console.warn(notificationEvent.senderStreamId, "closed your cam");
                    checkAndTurnOffLocalCamera(publishStreamId);
                }
            } else if (eventType === "TURN_YOUR_MIC_ON") {
                if (publishStreamId === notificationEvent.streamId) {
                    console.warn(notificationEvent.senderStreamId, "turns your mic on");
                    unmuteLocalMic();
                }
            } else if (eventType === "TURN_YOUR_MIC_OFF") {
                if (publishStreamId === notificationEvent.streamId) {
                    console.warn(notificationEvent.senderStreamId, "muted you");
                    muteLocalMic();
                }
            } else if (eventType === "PIN_USER") {
                if (notificationEvent.streamId === publishStreamId && !isScreenShared) {
                    updateVideoSendResolution(true);
                }
            } else if (eventType === "UNPIN_USER") {
                if (notificationEvent.streamId === publishStreamId && !isScreenShared) {
                    updateVideoSendResolution(false);
                }
            } else if (eventType === "VIDEO_TRACK_ASSIGNMENT_LIST") {

                // There are 2 operations here:
                // 1. VTA available in both sides -> Update
                // 2. VTA available in the current state but not in the new list -> Remove
                // We don't need to add new VTA because it will be added by the handlePlayVideo function

                let receivedVideoTrackAssignments = notificationEvent.payload;

                console.info("VIDEO_TRACK_ASSIGNMENT_LIST -> ", JSON.stringify(receivedVideoTrackAssignments));

                // Remove empty trackId assignments
                //receivedVideoTrackAssignments = receivedVideoTrackAssignments.filter((vta) => vta.trackId !== "");

                let currentVideoTrackAssignments = [...videoTrackAssignments];

                let tempVideoTrackAssignmentsNew = [];

                let tempAllParticipants = {...allParticipants};

                // This function checks the case 1 and case 2
                currentVideoTrackAssignments.forEach(tempVideoTrackAssignment => {
                    let assignment;

                    receivedVideoTrackAssignments.forEach(videoTrackAssignment => {
                        if (tempVideoTrackAssignment.videoLabel === videoTrackAssignment.videoLabel) {
                            assignment = videoTrackAssignment;
                        }
                    });

                    if (tempVideoTrackAssignment.isMine || tempVideoTrackAssignment.isFake || assignment !== undefined) {
                        if (isVideoLabelExists(tempVideoTrackAssignment.videoLabel, tempVideoTrackAssignmentsNew)) {
                            console.error("Video label is already exist: " + tempVideoTrackAssignment.videoLabel);
                        } else {
                            tempVideoTrackAssignmentsNew.push(tempVideoTrackAssignment);
                        }

                    } else {
                        console.log("---> Removed video track assignment: " + tempVideoTrackAssignment.videoLabel);
                        delete tempAllParticipants[tempVideoTrackAssignment.streamId];
                    }
                });

                if (!_.isEqual(allParticipants, tempAllParticipants)) {
                    setAllParticipants(tempAllParticipants);
                }

                currentVideoTrackAssignments = [...tempVideoTrackAssignmentsNew];

                // update participants according to current assignments
                receivedVideoTrackAssignments.forEach(vta => {
                    let existingAssignment = currentVideoTrackAssignments.find(oldVTA => oldVTA.videoLabel === vta.videoLabel);
                    if (existingAssignment) {
                        existingAssignment.streamId = vta.trackId;
                        existingAssignment.isReserved = vta.reserved;
                    }
                    if (!allParticipants[vta.trackId]) {
                        webRTCAdaptor?.getBroadcastObject(vta.trackId);
                    }
                });

                checkScreenSharingStatus();

                // check if there is any difference between old and new assignments
                if (!_.isEqual(currentVideoTrackAssignments, videoTrackAssignments)) {
                    setVideoTrackAssignments(currentVideoTrackAssignments);
                    requestSyncAdministrativeFields();
                    setParticipantUpdated(!participantUpdated);
                }

            } else if (eventType === "AUDIO_TRACK_ASSIGNMENT") {
                clearInterval(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    talkers.current = [];
                }, 1000);
                //console.log(JSON.stringify(notificationEvent.payload));
                updateTalkers(notificationEvent);
            } else if (eventType === "TRACK_LIST_UPDATED") {
                console.info("TRACK_LIST_UPDATED -> ", obj);

                webRTCAdaptor?.getSubtrackCount(roomName, null, null);
                webRTCAdaptor?.getSubtracks(roomName, null, globals.participantListPagination.offset, globals.participantListPagination.pageSize);
            } else if (eventType === "UPDATE_PARTICIPANT_ROLE") {

                console.log("UPDATE_PARTICIPANT_ROLE -> ", obj);

                console.log("UPDATE_PARTICIPANT_ROLE is received by " + publishStreamId);


                let updatedParticipant = allParticipants[notificationEvent.streamId];

                if (updatedParticipant === null || updatedParticipant === undefined) {
                    console.warn("Cannot find broadcast object for streamId: " + notificationEvent.streamId, " in allParticipants. Updated participant list request is sent.");
                    webRTCAdaptor?.getSubtracks(roomName, null, globals.participantListPagination.offset, globals.participantListPagination.pageSize);
                    return;
                }

                displayRoleUpdateMessage(notificationEvent.streamId, updatedParticipant.role, notificationEvent.role);

                updatedParticipant.role = notificationEvent.role;

                console.log("UPDATE_PARTICIPANT_ROLE event received and role updated for ", updatedParticipant);


                if (publishStreamId === notificationEvent.streamId) {
                    setRole(notificationEvent.role);
                } else {
                    console.log("UPDATE_PARTICIPANT_ROLE event received and subtracks are queried");
                    webRTCAdaptor?.getSubtracks(roomName, null, globals.participantListPagination.offset, globals.participantListPagination.pageSize);
                }
                setParticipantUpdated(!participantUpdated);
            } else if (eventType === "REQUEST_BECOME_PUBLISHER") {
                if (role === WebinarRoles.Host || role === WebinarRoles.ActiveHost) {
                    if (requestSpeakerList.includes(notificationEvent.senderStreamId)) {
                        console.log("Request is already received from ", notificationEvent.senderStreamId);
                        return;
                    }
                    setRequestSpeakerList((oldRequestSpeakerList) => {
                        return [...oldRequestSpeakerList, notificationEvent.senderStreamId];
                    });
                    showInfoSnackbarWithLatency(notificationEvent.senderStreamId + t(" is requesting to become a speaker"));
                }
            } else if (eventType === "MAKE_LISTENER_AGAIN") {
                if (role === WebinarRoles.TempListener || role === WebinarRoles.ActiveTempListener) {
                    showInfoSnackbarWithLatency(t("You are made listener again"));
                    mediaConstraints = {
                        video: false, audio: false,
                    };
                    setIsPlayed(false);
                    setRole(WebinarRoles.Listener);
                    setIsPlayOnly(true);
                }
            } else if (eventType === "APPROVE_BECOME_PUBLISHER") {
                if (role === WebinarRoles.Listener && notificationEvent.senderStreamId === publishStreamId) {
                    showInfoSnackbarWithLatency(t("Your request to become a speaker is approved"));
                    mediaConstraints = {
                        // setting constraints here breaks source switching on firefox.
                        video: videoQualityConstraints.video, audio: audioQualityConstraints.audio,
                    };
                    setRole(WebinarRoles.TempListener);
                    setIsPlayOnly(false);
                }
            } else if (eventType === "REJECT_BECOME_PUBLISHER") {
                if (role === WebinarRoles.Listener && notificationEvent.senderStreamId === publishStreamId) {
                    showInfoSnackbarWithLatency(t("Your request to become a speaker is rejected"));
                }
            }
        }
    }

    const updateTalkers = (notificationEvent) => {
        const newTalkers = notificationEvent.payload
            .filter((p) => p.trackId !== "" && p.audioLevel < 60)
            .map((p) => p.trackId);

        // Only update if there's a difference
        if (!_.isEqual(talkers.current, newTalkers)) {
            talkers.current = newTalkers;
        }
    };

    function displayRoleUpdateMessage(streamId, oldRole, newRole) {
        if (isAdmin !== true || oldRole === null || oldRole === undefined || newRole === null || newRole === undefined || oldRole === newRole) {
            console.log("Role update message is not displayed. Admin: ", isAdmin, " Old Role: ", oldRole, " New Role: ", newRole);
            return;
        }

        if (oldRole.includes("active") && !newRole.includes("active")) {
            showInfoSnackbarWithLatency(streamId + t(" is removed from the listening room"));
        } else if (!oldRole.includes("active") && newRole.includes("active")) {
            showInfoSnackbarWithLatency(streamId + t(" is added to the listening room"));
        }
    }

    function showInfoSnackbarWithLatency(message) {
        setTimeout(() => {
            enqueueSnackbar({
                message: message,
                variant: 'info',
                icon: <SvgIcon size={24} name={'info'} color="#fff"/>,
                anchorOrigin: {
                    vertical: "top",
                    horizontal: "right",
                },
            }, {
                autoHideDuration: 5000,
            });
        }, 1000);
    }

    function checkScreenSharingStatus() {
        const broadcastObjectsArray = Object.values(allParticipants);
        broadcastObjectsArray.forEach((broadcastObject) => {
            if (broadcastObject.isScreenShared === true && typeof broadcastObject.isPinned === "undefined") {
                pinVideo(broadcastObject.streamId);
            }
        })
    }

    function getUserStatusMetadata(isMicMuted, isCameraOn, isScreenShareActive) {
        let metadata = {
            isMicMuted: isMicMuted === null ? null : isMicMuted,
            isCameraOn: isCameraOn,
            isScreenShared: isScreenShareActive,
            playOnly: isPlayOnly,
            role: role
        }

        return metadata;
    }

    const updateRoomRecordingStatus = React.useCallback((isRecording) => {
        let metadata = {};
        if (isRecording) {
            metadata.isRecording = true;
        } else {
            metadata.isRecording = false;
        }
        webRTCAdaptor?.updateStreamMetaData(roomName, JSON.stringify(metadata));
    }, [webRTCAdaptor, roomName]);

    function updateUserStatusMetadata(micMuted, cameraOn) {
        let metadata = getUserStatusMetadata(micMuted, cameraOn, false);

        webRTCAdaptor?.updateStreamMetaData(publishStreamId, JSON.stringify(metadata));
    }

    function handleLeaveFromRoom() {

        // we need to empty participant array. if we are going to leave it in the first place.
        setVideoTrackAssignments([]);
        setAllParticipants({});
        setPagedParticipants({});

        clearInterval(audioListenerIntervalJob);
        audioListenerIntervalJob = null;

        if (!isPlayOnly) {
            webRTCAdaptor?.stop(publishStreamId);
        }
        webRTCAdaptor?.stop(roomName);

        if (!isPlayOnly) {
            webRTCAdaptor?.turnOffLocalCamera(publishStreamId);
        }
        //close streams fully to not encounter webcam light
        webRTCAdaptor?.closeStream();

        if (isScreenShared && screenShareWebRtcAdaptor.current != null) {
            handleStopScreenShare();
        }

        if (process.env.REACT_APP_SHOW_PLAY_ONLY_PARTICIPANTS === "true") {
            webRTCAdaptor?.leaveFromRoom(roomName, publishStreamId);
        }

        playLeaveRoomSound();

        setWaitingOrMeetingRoom("waiting");
    }

    // when user closes the tab or refreshes the page
    // we need to leave the room
    useBeforeUnload((ev) => {
        handleLeaveFromRoom();
    });

    const handleSendNotificationEvent = React.useCallback((eventType, publishStreamId, info) => {
        let notEvent = {
            streamId: publishStreamId, eventType: eventType, ...(info ? info : {}),
        };
        console.info("send notification event", notEvent);
        webRTCAdaptor?.sendData(publishStreamId, JSON.stringify(notEvent));
    }, [webRTCAdaptor]);

    function updateVideoSendResolution(isPinned) {
        let promise = null;
        let mediaConstraints = {video: true};

        if (isScreenShared) {
            mediaConstraints = getMediaConstraints("screenConstraints", 20);
            promise = webRTCAdaptor?.applyConstraints(mediaConstraints);
        } else if (videoSendResolution === "auto" && !isPinned) {
            mediaConstraints = getMediaConstraints("qvgaConstraints", 15);
            promise = webRTCAdaptor?.applyConstraints(mediaConstraints);
        } else if (videoSendResolution === "auto" && isPinned) {
            mediaConstraints = getMediaConstraints("qvgaConstraints", 25);
            promise = webRTCAdaptor?.applyConstraints(mediaConstraints);
        } else if (videoSendResolution === "highDefinition") {
            mediaConstraints = getMediaConstraints("hdConstraints", 15);
            promise = webRTCAdaptor?.applyConstraints(mediaConstraints);
        } else if (videoSendResolution === "standardDefinition") {
            mediaConstraints = getMediaConstraints("vgaConstraints", 15);
            promise = webRTCAdaptor?.applyConstraints(mediaConstraints);
        } else if (videoSendResolution === "lowDefinition") {
            mediaConstraints = getMediaConstraints("qvgaConstraints", 15);
            promise = webRTCAdaptor?.applyConstraints(mediaConstraints);
        } else {
            console.error("Unknown camera resolution: " + videoSendResolution);
        }

        if (promise !== null) {
            promise?.then(() => {
                console.info("Camera resolution is updated to " + videoSendResolution + " mode");
                let videoTrackSettings = webRTCAdaptor?.mediaManager?.localStream?.getVideoTracks()[0]?.getSettings();
                console.info("Video track resolution: ", videoTrackSettings?.width, "x", videoTrackSettings?.height, " frame rate: ", videoTrackSettings?.frameRate);
            }).catch(err => {
                setVideoSendResolution("auto");
                console.error("Camera resolution is not updated to " + videoSendResolution + " mode. Error is " + err);
                console.info("Trying to update camera resolution to auto");
            });
        }
    }

    function removeAllRemoteParticipants() {
        let newVideoTrackAssignment = {
            videoLabel: "localVideo", track: null, streamId: publishStreamId, isMine: true, isReserved: false
        };

        let tempVideoTrackAssignments = [];
        if (!isPlayOnly) {
            tempVideoTrackAssignments.push(newVideoTrackAssignment);
        }
        if (!_.isEqual(tempVideoTrackAssignments, videoTrackAssignments)) {
            setVideoTrackAssignments(tempVideoTrackAssignments);
        }

        let allParticipantsTemp = {};
        if (!isPlayOnly) {
            allParticipantsTemp[publishStreamId] = {name: "You"};
        }
        if (!_.isEqual(allParticipantsTemp, allParticipants)) {
            console.log("removeAllRemoteParticipants setAllParticipants:"+JSON.stringify(allParticipantsTemp));
            setAllParticipants(allParticipantsTemp);
        }
        setPagedParticipants({});
        setParticipantUpdated(!participantUpdated);
    }

    function addMeAsParticipant(publishStreamId) {
        let isParticipantExist = videoTrackAssignments.find((vta) => vta.label === "localVideo");

        if (isParticipantExist || isPlayOnly) {
            return;
        }

        let newVideoTrackAssignment = {
            videoLabel: "localVideo", track: null, streamId: publishStreamId, isMine: true, isReserved: false
        };
        let tempVideoTrackAssignments = [...videoTrackAssignments];
        tempVideoTrackAssignments.push(newVideoTrackAssignment);
        if (!_.isEqual(tempVideoTrackAssignments, videoTrackAssignments)) {
            setVideoTrackAssignments(tempVideoTrackAssignments);
            setParticipantUpdated(!participantUpdated);
        }

        let allParticipantsTemp = {...allParticipants};
        allParticipantsTemp[publishStreamId] = {
            streamId: publishStreamId, name: "You", isPinned: false, isScreenShared: false, status: "livestream"
        };

        if (!_.isEqual(allParticipantsTemp, allParticipants)) {
            console.log("addMeAsParticipant setAllParticipants:"+JSON.stringify(allParticipantsTemp));
            setAllParticipants(allParticipantsTemp);
            setParticipantUpdated(!participantUpdated);
        }
    }


    function handlePublish(publishStreamId, token, subscriberId, subscriberCode) {
        let userStatusMetadata = getUserStatusMetadata(isMyMicMuted, !isMyCamTurnedOff, isScreenShared);

        addMeAsParticipant(publishStreamId);

        let currentStreamName = streamName;
        if (streamName === "" || streamName === undefined || streamName === null) {
            currentStreamName = "Anonymous"
        }

        webRTCAdaptor?.publish(publishStreamId, token, subscriberId, subscriberCode, currentStreamName, roomName, JSON.stringify(userStatusMetadata), role);
    }

    function handlePlayVideo(obj) {
        console.log("handlePlayVideo: " + JSON.stringify(obj));
        let index = obj?.trackId?.substring("ARDAMSx".length);
        globals.trackEvents.push({track: obj.track.id, event: "added"});

        if (obj.track.kind === "audio") {
            var newAudioTrack = {
                id: index, track: obj.track, streamId: obj.streamId
            };

            //append new audio track, track id should be unique because of audio track limitation
            let temp = audioTracks;
            temp.push(newAudioTrack);
            setAudioTracks(temp);
        } else if (obj.track.kind === "video") {
            let newVideoTrackAssignment = {
                videoLabel: index, track: obj.track, streamId: obj.streamId, isReserved: false
            };

            if (isVideoLabelExists(newVideoTrackAssignment.videoLabel, videoTrackAssignments)) {
                console.error("Video label is already exist: " + newVideoTrackAssignment.videoLabel);
            } else {
                console.log("add vta:"+newVideoTrackAssignment.videoLabel)
                setVideoTrackAssignments((videoTrackAssignments) => [...videoTrackAssignments, newVideoTrackAssignment]);
                setParticipantUpdated(!participantUpdated);
                console.log("document.hidden",document.hidden);
                if (document.hidden) {
                    playJoinRoomSound();
                }
            }
        }
    }

    function isVideoLabelExists(videoLabel, assignments) {
        let isExist = false;
        assignments.forEach((vta) => {
            if (vta.videoLabel === videoLabel) {
                isExist = true;
            }
        });
        return isExist;
    }

    React.useEffect(() => {
        updateAllParticipantsPagination(globals.participantListPagination.currentPage);
    }, [participantCount]);

    function updateAllParticipantsPagination(currentPage) {
        if (currentPage <= 0) {
            currentPage = 1;
        }

        // we calculate the total page count for pagination
        if (participantCount === 0) {
            // if we are play only user and there is no participant then total page is 1
            globals.participantListPagination.totalPage = 1;
        } else {
            globals.participantListPagination.totalPage = Math.floor(participantCount / globals.participantListPagination.pageSize)
                + (participantCount % globals.participantListPagination.pageSize > 0 ? 1 : 0);
        }

        if (currentPage > globals.participantListPagination.totalPage) {
            currentPage = globals.participantListPagination.totalPage;
        }

        globals.participantListPagination.currentPage = currentPage;
        globals.participantListPagination.offset = (globals.participantListPagination.currentPage - 1) * globals.participantListPagination.pageSize;

        // we need to get the subtracks for the new page
        webRTCAdaptor?.getSubtracks(roomName, null, globals.participantListPagination.offset, globals.participantListPagination.pageSize);
    }

    const fetchImageAsBlob = async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    };

    function setVirtualBackgroundImage(url) {
        if (url === undefined || url === null || url === "") {
            return;
        } else if (url.startsWith("data:image")) {
            setAndEnableVirtualBackgroundImage(url);
        } else {
            fetchImageAsBlob(url).then((blobUrl) => {
                setAndEnableVirtualBackgroundImage(blobUrl);
            });
        }
    }

    function setAndEnableVirtualBackgroundImage(imageUrl) {
        let virtualBackgroundImage = document.getElementById("virtualBackgroundImage");

        if (virtualBackgroundImage === null) {
            virtualBackgroundImage = document.createElement("img");
            virtualBackgroundImage.id = "virtualBackgroundImage";
            virtualBackgroundImage.style.visibility = "hidden";
            virtualBackgroundImage.alt = "virtual-background";
        }

        console.log("Virtual background image url: " + imageUrl);
        if (imageUrl !== undefined && imageUrl !== null && imageUrl !== "") {
            virtualBackgroundImage.src = imageUrl;
        } else {
            virtualBackgroundImage.src = "virtual-background0.png";
        }

        virtualBackgroundImage.onload = () => {
            console.log("Virtual background image is loaded");
            setVirtualBackground(virtualBackgroundImage);
            webRTCAdaptor?.setBackgroundImage(virtualBackgroundImage);

            if (selectedVideoEffect === VideoEffect.VIRTUAL_BACKGROUND) {
                // if virtual background is already enabled, no need to enable it again.
                return;
            }

            webRTCAdaptor?.enableEffect(VideoEffect.VIRTUAL_BACKGROUND).then(() => {
                console.log("Effect: " + VideoEffect.VIRTUAL_BACKGROUND + " is enabled");
                setSelectedVideoEffect(VideoEffect.VIRTUAL_BACKGROUND);
                setIsVideoEffectRunning(true);
            }).catch(err => {
                console.error("Effect: " + VideoEffect.VIRTUAL_BACKGROUND + " is not enabled. Error is " + err);
                setSelectedVideoEffect(VideoEffect.NO_EFFECT);
                setIsVideoEffectRunning(false);
            });
        };
    }

    function handleBackgroundReplacement(option) {
        let effectName;

        if (option === "none") {
            effectName = VideoEffect.NO_EFFECT;
            setIsVideoEffectRunning(false);
        } else if (option === "slight-blur") {
            webRTCAdaptor?.setBlurEffectRange(3, 4);
            effectName = VideoEffect.BLUR_BACKGROUND;
            setIsVideoEffectRunning(true);
        } else if (option === "blur") {
            webRTCAdaptor?.setBlurEffectRange(6, 8);
            effectName = VideoEffect.BLUR_BACKGROUND;
            setIsVideoEffectRunning(true);
        } else if (option === "background") {
            if (virtualBackground === null) {
                setAndEnableVirtualBackgroundImage(null);
                return;
            }
            effectName = VideoEffect.VIRTUAL_BACKGROUND;
            setIsVideoEffectRunning(true);
        }
        webRTCAdaptor?.enableEffect(effectName)?.then(() => {
            console.log("Effect: " + effectName + " is enabled");
            setSelectedVideoEffect(effectName);
        }).catch(err => {
            console.error("Effect: " + effectName + " is not enabled. Error is " + err);
            setSelectedVideoEffect(VideoEffect.NO_EFFECT);
            setIsVideoEffectRunning(false);
        });
    }

    function checkAndTurnOnLocalCamera(streamId) {
        if (isVideoEffectRunning) {
            webRTCAdaptor.mediaManager.localStream.getVideoTracks()[0].enabled = true;
        } else {
            webRTCAdaptor?.turnOnLocalCamera(streamId);
        }

        updateUserStatusMetadata(isMyMicMuted, true);
        setIsMyCamTurnedOff(false);

        handleSendNotificationEvent("CAM_TURNED_ON", publishStreamId);
    }

    function checkAndTurnOffLocalCamera(streamId) {
        if (isVideoEffectRunning) {
            webRTCAdaptor.mediaManager.localStream.getVideoTracks()[0].enabled = false;
        } else {
            webRTCAdaptor?.turnOffLocalCamera(streamId);
        }

        updateUserStatusMetadata(isMyMicMuted, false);
        setIsMyCamTurnedOff(true);

        handleSendNotificationEvent("CAM_TURNED_OFF", publishStreamId);
    }

    const getSelectedDevices = React.useCallback(()=> {
        let devices = {
            videoDeviceId: selectedCamera, audioDeviceId: selectedMicrophone
        }
        return devices;
    },[selectedCamera, selectedMicrophone]);

    const setSelectedDevices = React.useCallback((devices) => {
        if (devices.videoDeviceId !== null && devices.videoDeviceId !== undefined) {
            setSelectedCamera(devices.videoDeviceId);
            localStorage.setItem("selectedCamera", devices.videoDeviceId);
        }
        if (devices.audioDeviceId !== null && devices.audioDeviceId !== undefined) {
            setSelectedMicrophone(devices.audioDeviceId);
            localStorage.setItem("selectedMicrophone", devices.audioDeviceId);
        }
    },[]);

    const cameraSelected = React.useCallback((value) => {
        if (selectedCamera !== value) {
            setSelectedDevices({videoDeviceId: value});
            // When we first open home page, React will call this function and local stream is null at that time.
            // So, we need to catch the error.
            try {
                webRTCAdaptor?.switchVideoCameraCapture(publishStreamId, value, () => {
                    console.log("Camera selection callback");
                });
            } catch (e) {
                console.log("Local stream is not ready yet.");
            }
        }
    },[selectedCamera, webRTCAdaptor, publishStreamId, setSelectedDevices]);

    const microphoneSelected = React.useCallback((value) => {
        if (selectedMicrophone !== value) {
            setSelectedDevices({audioDeviceId: value});
            // When we first open home page, React will call this function and local stream is null at that time.
            // So, we need to catch the error.
            try {
                webRTCAdaptor?.switchAudioInputSource(publishStreamId, value);
            } catch (e) {
                console.log("Local stream is not ready yet.");
            }
        }
    }, [selectedMicrophone, setSelectedDevices, webRTCAdaptor, publishStreamId]);

    function requestSyncAdministrativeFields() {
        var jsCmd = {
        command: "syncAdministrativeFields",
        roomName: roomName,
        streamId: publishStreamId,
        websocketURL: websocketURL,
        token: token
        };
        sendMessage(JSON.stringify(jsCmd));
    }

    const showReactions = React.useCallback((streamId, streamName, reactionRequest, allParticipants) => {
        let reaction = '😀';

        if (reactions[reactionRequest] !== undefined) {
            reaction = reactions[reactionRequest];
        }

        if (streamId === publishStreamId) {
            streamName = 'You';
        }

        floating({
            content: '<div>' + reaction + '<br><span style="background-color: darkgray;color: white;padding: 1px 2px;text-align: center;border-radius: 5px;font-size: 0.675em;">' + streamName + '</span></div>',
            number: 1,
            duration: 5,
            repeat: 1,
            direction: 'normal',
            size: 2
        });
    }, [reactions, publishStreamId]);

    const sendReactions = React.useCallback((reaction) =>{
        let reactionsStreamId = (isPlayOnly) ? roomName : publishStreamId;
        handleSendNotificationEvent("REACTIONS", reactionsStreamId, {
            reaction: reaction, senderStreamId: publishStreamId, senderStreamName: streamName
        });
        showReactions(publishStreamId, streamName, reaction, allParticipants);
    },[handleSendNotificationEvent, publishStreamId, showReactions, allParticipants]);

    const toggleMic = (mute) => {
        if (mute) {
            muteLocalMic();
        } else {
            unmuteLocalMic();
        }
    };

    function muteLocalMic() {
        webRTCAdaptor?.muteLocalMic();
        updateUserStatusMetadata(true, !isMyCamTurnedOff);
        setIsMyMicMuted(true);

        handleSendNotificationEvent("MIC_MUTED", publishStreamId);
    }

    function unmuteLocalMic() {
        webRTCAdaptor?.unmuteLocalMic();
        updateUserStatusMetadata(false, !isMyCamTurnedOff);
        setIsMyMicMuted(false);

        handleSendNotificationEvent("MIC_UNMUTED", publishStreamId);
    }

    const setAudioLevelListener = (listener, period) => {
        if (audioListenerIntervalJob == null) {
            audioListenerIntervalJob = setInterval(() => {
                if (webRTCAdaptor?.remotePeerConnection[publishStreamId] !== undefined && webRTCAdaptor?.remotePeerConnection[publishStreamId] !== null) {
                    webRTCAdaptor?.remotePeerConnection[publishStreamId].getStats(null).then(stats => {
                        for (const stat of stats.values()) {
                            if (stat.type === 'media-source' && stat.kind === 'audio') {
                                listener(stat?.audioLevel?.toFixed(2));
                            }
                        }
                    });
                }
            }, period);
        }
    }

    function localVideoCreate(tempLocalVideo) {
        // it can be null when we first open the page
        // due to the fact that local stream is not ready yet.
        if (typeof tempLocalVideo !== "undefined" && tempLocalVideo !== null) {
            setLocalVideo(tempLocalVideo);
            webRTCAdaptor.mediaManager.localVideo = tempLocalVideo;
            webRTCAdaptor.mediaManager.localVideo.srcObject = webRTCAdaptor.mediaManager.localStream;
        }
    }

    function checkVideoTrackHealth() {
        // if the camera is turned off by the user or play only, no need to check it
        if (isMyCamTurnedOff || isPlayOnly) {
            return true;
        }
        // if the camera is turned on and the video track is muted, then there is a problem with the camera
        let localStream = webRTCAdaptor?.mediaManager?.localStream;
        if(localStream == null || webRTCAdaptor?.mediaManager?.localStream.getVideoTracks()[0].muted) {
            //camera is not working properly
            return false;
        }

        return true;
    }

    const getTrackStats = React.useCallback(() => { // eslint-disable-line  no-unused-vars 
        //this method is being used in the integration test code
        return webRTCAdaptor.remotePeerConnectionStats[roomName];
       
    },[webRTCAdaptor?.remotePeerConnectionStats, roomName]); 

    React.useEffect(() => {
        //gets the setting from the server through websocket
        if (isWebSocketConnected) {
            var jsCmd = {
                command: "getSettings",
            };
            sendMessage(JSON.stringify(jsCmd));
        }
    }, [isWebSocketConnected]);

    React.useEffect(() => {
        if (!latestMessage) {
            return;
        }
        var obj = JSON.parse(latestMessage);
        var definition;
        if (obj.command === "setSettings") {
            var localSettings = JSON.parse(obj.settings);
            console.log("--isRecordingFeatureAvailable: ", localSettings?.isRecordingFeatureAvailable);
            setIsRecordPluginInstalled(localSettings?.isRecordingFeatureAvailable);
            if (localSettings?.maxVideoTrackCount !== undefined && localSettings?.maxVideoTrackCount !== null) {
                console.log("--maxVideoTrackCountFromAppSettings: ", localSettings?.maxVideoTrackCount);
                setAppSettingsMaxVideoTrackCount(localSettings?.maxVideoTrackCount > 0 ? localSettings?.maxVideoTrackCount+1 : 6);
            }
            setSettings(localSettings);
        } else if (obj.command === "startRecordingResponse") {
            console.log("Incoming startRecordingResponse:", obj);
            definition = JSON.parse(obj.definition);
            if (definition.success) {
                setIsRecordPluginActive(true);
                updateRoomRecordingStatus(true);
                handleSendNotificationEvent("RECORDING_TURNED_ON", publishStreamId);
                displayMessage("Recording is started successfully", "white")
            } else {
                console.log("Start Recording is failed");
                displayMessage("Recording cannot be started. Error is " + definition.message, "white")
            }
        } else if (obj.command === "stopRecordingResponse") {
            console.log("Incoming stopRecordingResponse:", obj);
            definition = JSON.parse(obj.definition);
            if (definition.success) {
                setIsRecordPluginActive(false);
                updateRoomRecordingStatus(false);
                handleSendNotificationEvent("RECORDING_TURNED_OFF", publishStreamId);
                displayMessage("Recording is stopped successfully", "white")
            } else {
                console.log("Stop Recording is failed");
                setIsRecordPluginActive(false);
                updateRoomRecordingStatus(false);
                handleSendNotificationEvent("RECORDING_TURNED_OFF", publishStreamId);
                displayMessage("Recording stopped forcefully due to error: " + definition.message, "white")
            }
        }
        }, [latestMessage, publishStreamId, displayMessage, handleSendNotificationEvent, updateRoomRecordingStatus]); // eslint-disable-line 

    const makeFullScreen = (divId) => {
        if (fullScreenId === divId) {
            document.getElementById(divId).classList.remove("selected");
            document.getElementById(divId).classList.add("unselected");
            fullScreenId = -1;
        } else {
            document.getElementsByClassName("publisher-content")[0].className = "publisher-content chat-active fullscreen-layout";
            if (fullScreenId !== -1) {
                document.getElementById(fullScreenId).classList.remove("selected");
                document.getElementById(fullScreenId).classList.add("unselected");
            }
            document.getElementById(divId).classList.remove("unselected");
            document.getElementById(divId).classList.add("selected");
            fullScreenId = divId;
        }
    }
    window.makeFullScreen = makeFullScreen;

    function setMicAudioLevel(audioLevel) {
        webRTCAdaptor?.setVolumeLevel(audioLevel);
    }

    /* istanbul ignore next */
    return (!initialized ? <>
            <Grid
                container
                spacing={0}
                direction="column"
                alignItems="center"
                justifyContent="center"
                style={{minHeight: '100vh'}}
            >
                <Grid item xs={3}>
                    <Box sx={{display: 'flex'}}>
                        <CircularProgress size="4rem"/>
                    </Box>
                </Grid>
            </Grid>
        </> : <Grid container className="App">
            <Grid
                container
                className="App-header"
                justifyContent="center"
                alignItems={"center"}
            >
                    <UnitTestContext.Provider
                        value={{
                            isScreenShared,
                            talkers,
                            audioTracks,
                            isPublished,
                            selectedCamera,
                            selectedMicrophone,
                            selectedBackgroundMode,
                            videoTrackAssignments,
                            setVideoTrackAssignments,
                            messageDrawerOpen,
                            participantListDrawerOpen,
                            messages,
                            numberOfUnReadMessages,
                            participantUpdated,
                            allParticipants,
                            globals,
                            isPlayOnly,
                            setIsPlayOnly,
                            localVideo,
                            streamName,
                            initialized,
                            devices,
                            publishStreamId,
                            isMyMicMuted,
                            isMyCamTurnedOff,
                            setIsMyCamTurnedOff,
                            sendReactions,
                            setSelectedBackgroundMode,
                            setIsVideoEffectRunning,
                            handleMessageDrawerOpen,
                            handleParticipantListOpen,
                            setSelectedCamera,
                            setSelectedMicrophone,
                            setLeftTheRoom,
                            joinRoom,
                            handleStopScreenShare,
                            handleStartScreenShare,
                            cameraSelected,
                            microphoneSelected,
                            handleBackgroundReplacement,
                            muteLocalMic,
                            unmuteLocalMic,
                            checkAndTurnOnLocalCamera,
                            checkAndTurnOffLocalCamera,
                            setAudioLevelListener,
                            handleSetMessages,
                            toggleSetNumberOfUnreadMessages,
                            pinVideo,
                            setLocalVideo,
                            setWaitingOrMeetingRoom,
                            setStreamName,
                            handleLeaveFromRoom,
                            handleSendNotificationEvent,
                            handleSetDesiredTileCount,
                            handleSendMessage,
                            turnOffYourMicNotification,
                            addFakeParticipant,
                            removeFakeParticipant,
                            fakeReconnect,
                            showEmojis,
                            setShowEmojis,
                            isMuteParticipantDialogOpen,
                            setMuteParticipantDialogOpen,
                            participantIdMuted,
                            setParticipantIdMuted,
                            videoSendResolution,
                            setVideoSendResolution,
                            makeid,
                            startRecord,
                            stopRecord,
                            isRecordPluginInstalled,
                            isRecordPluginActive,
                            isEnterDirectly,
                            publisherRequestListDrawerOpen,
                            setPublisherRequestListDrawerOpen,
                            isAdmin,
                            setIsAdmin,
                            presenterButtonDisabled,
                            setPresenterButtonDisabled,
                            effectsDrawerOpen,
                            handleEffectsOpen,
                            setVirtualBackgroundImage,
                            localVideoCreate,
                            microphoneButtonDisabled,
                            setMicrophoneButtonDisabled,
                            cameraButtonDisabled,
                            setCameraButtonDisabled,
                            updateMaxVideoTrackCount,
                            checkAndUpdateVideoAudioSources,
                            setDevices,
                            getSelectedDevices,
                            setIsJoining,
                            isJoining,
                            setParticipantUpdated,
                            makeParticipantPresenter,
                            makeParticipantUndoPresenter,
                            isBecomePublisherConfirmationDialogOpen,
                            setBecomePublisherConfirmationDialogOpen,
                            requestSpeakerList,
                            turnOnYourMicNotification,
                            turnOffYourCamNotification,
                            handlePublisherRequestListOpen,
                            setRequestSpeakerList,
                            presenterButtonStreamIdInProcess,
                            roomName,
                            role,
                            speedTestObject,
                            setSpeedTestObject,
                            speedTestStreamId,
                            startSpeedTest,
                            stopSpeedTest,
                            statsList,
                            getTrackStats,
                            isBroadcasting,
                            playStats,
                            checkAndSetIsPinned,
                            setMicAudioLevel,
                            updateAllParticipantsPagination,
                            pagedParticipants,
                            participantCount,
                            setParticipantCount,
                            checkAndUpdateVideoAudioSourcesForPublishSpeedTest,
                            fetchImageAsBlob,
                            setAndEnableVirtualBackgroundImage,
                            setAndFillPlayStatsList,
                            setAndFillPublishStatsList,
                            setSpeedTestObjectFailed,
                            setSpeedTestObjectProgress,
                            calculateThePlaySpeedTestResult,
                            processUpdatedStatsForPlaySpeedTest,
                            speedTestCounter,
                            setRoomName,
                            setPublishStreamId,
                            settings,
                            setRole,
                            handleNotificationEvent,
                            approveBecomeSpeakerRequest,
                            rejectBecomeSpeakerRequest,
                            handleStartBecomePublisher,
                            handlePublisherRequest,
                            makeListenerAgain,
                            checkVideoTrackHealth
                        }}
                    >
                        {props.children}
                    <UnauthrorizedDialog
                        onClose={handleUnauthorizedDialogExitClicked}
                        open={unAuthorizedDialogOpen}
                        onExitClicked={handleUnauthorizedDialogExitClicked}

                    />

                    {isJoining ? (
                        <Backdrop
                            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                            open={isJoining}
                            //onClick={handleClose}
                        >
                            <Stack alignItems='center' justify='center' alignContent='center'>
                                <CircularProgress size={52} color="inherit"/>
                                { isNoSreamExist && isPlayOnly ?
                                    <span style={{margin: '27px', fontSize: 18, fontWeight: 'normal'}}>
                    <b>{t("The room is currently empty.")}</b><br></br><b>{t("You will automatically join the room once it is ready.")}</b>
                  </span>
                                    :
                                    <span style={{margin: '27px', fontSize: 18, fontWeight: 'normal'}}>{t("Joining the room...")}</span>
                                }
                            </Stack>
                        </Backdrop>
                    ):null}

                    {isReconnectionInProgress ? (
                        <Backdrop
                            sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                            open={isReconnectionInProgress}
                            //onClick={handleClose}
                        >
                            <Stack alignItems='center' justify='center' alignContent='center'>
                                <CircularProgress size={52} color="inherit"/>
                                <span style={{margin: '27px', fontSize: 18, fontWeight: 'normal'}}>{t("Reconnecting...")}</span>
                            </Stack>
                        </Backdrop>
                    ):null}

                    {screenSharingInProgress ? (
                        <Backdrop
                            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                            open={screenSharingInProgress}
                            //onClick={handleClose}
                        >
                            <Stack item alignItems='center' justify='center' alignContent='center'>
                                <CircularProgress size={52} color="inherit"/>
                                <span style={{margin: '27px', fontSize: 18, fontWeight: 'normal'}}>{t("Starting Screen Share...")}</span>
                            </Stack>
                        </Backdrop>
                    ):null}

                    {leftTheRoom ? (
                        <LeftTheRoom
                            withError={leaveRoomWithError}
                            handleLeaveFromRoom={() => handleLeaveFromRoom()}
                        />
                    ) : waitingOrMeetingRoom === "waiting" ? (
                        <WaitingRoom
                            isPlayOnly={isPlayOnly}
                            initialized={initialized}
                            localVideoCreate={(tempLocalVideo) => localVideoCreate(tempLocalVideo)}
                            localVideo={localVideo}
                            streamName={streamName}
                            setStreamName={(name) => setStreamName(name)}
                            makeid={(length)=>makeid(length)}
                            setSpeedTestObject={(speedTestObject) => setSpeedTestObject(speedTestObject)}
                            speedTestStreamId={speedTestStreamId}
                            startSpeedTest={()=>startSpeedTest()}
                            stopSpeedTest={()=>stopSpeedTest()}
                            setIsJoining={(isJoining) => setIsJoining(isJoining)}
                            joinRoom={(roomName, generatedStreamId) => joinRoom(roomName, generatedStreamId)}
                            speedTestObject={speedTestObject}
                            setWaitingOrMeetingRoom={(room) => setWaitingOrMeetingRoom(room)}
                            handleBackgroundReplacement={(mode)=>handleBackgroundReplacement(mode)}
                            isMyCamTurnedOff={isMyCamTurnedOff}
                            cameraButtonDisabled={cameraButtonDisabled}
                            checkAndTurnOffLocalCamera={(streamId) => checkAndTurnOffLocalCamera(streamId)}
                            checkAndTurnOnLocalCamera={(streamId) => checkAndTurnOnLocalCamera(streamId)}
                            isMyMicMuted={isMyMicMuted}
                            toggleMic={(mute) => toggleMic(mute)}
                            microphoneButtonDisabled={microphoneButtonDisabled}
                            microphoneSelected={(mic) => microphoneSelected(mic)}
                            devices={devices}
                            selectedCamera={selectedCamera}
                            cameraSelected={(camera) => cameraSelected(camera)}
                            selectedMicrophone={selectedMicrophone}
                            selectedBackgroundMode={selectedBackgroundMode}
                            setSelectedBackgroundMode={(mode) => setSelectedBackgroundMode(mode)}
                            videoSendResolution={videoSendResolution}
                            setVideoSendResolution={(resolution) => setVideoSendResolution(resolution)}
                            talkers={talkers.current}
                            isPublished={isPublished}
                            allParticipants={allParticipants}
                            setAudioLevelListener={(listener, period) => setAudioLevelListener(listener, period)}
                            setParticipantIdMuted={(participant) => setParticipantIdMuted(participant)}
                            turnOnYourMicNotification={(streamId) => turnOnYourMicNotification(streamId)}
                            turnOffYourMicNotification={(streamId) => turnOffYourMicNotification(streamId)}
                            turnOffYourCamNotification={(streamId) => turnOffYourCamNotification(streamId)}
                            pinVideo={(streamId) => pinVideo(streamId)}
                            isAdmin={isAdmin}
                            publishStreamId={publishStreamId}
                            role={role}
                            checkVideoTrackHealth={checkVideoTrackHealth}
                        />
                    ) : (
                        <>
                            <MeetingRoom
                                messageDrawerOpen={messageDrawerOpen}
                                participantListDrawerOpen={participantListDrawerOpen}
                                effectsDrawerOpen={effectsDrawerOpen}
                                publisherRequestListDrawerOpen={publisherRequestListDrawerOpen}
                                showEmojis={showEmojis}
                                sendReactions={(reaction) => sendReactions(reaction)}
                                setShowEmojis={(show) => setShowEmojis(show)}
                                globals={globals}
                                audioTracks={audioTracks}
                                participantIdMuted={participantIdMuted}
                                isMuteParticipantDialogOpen={isMuteParticipantDialogOpen}
                                setMuteParticipantDialogOpen={(open) => setMuteParticipantDialogOpen(open)}
                                publishStreamId={publishStreamId}
                                pinVideo={(streamId) => pinVideo(streamId)}
                                pinFirstVideo={pinFirstVideo}
                                allParticipants={allParticipants}
                                participantUpdated={participantUpdated}
                                videoTrackAssignments={videoTrackAssignments}
                                updateMaxVideoTrackCount={updateMaxVideoTrackCount}
                                talkers={talkers}
                                streamName={streamName}
                                isPublished={isPublished}
                                isPlayOnly={isPlayOnly}
                                isMyMicMuted={isMyMicMuted}
                                isMyCamTurnedOff={isMyCamTurnedOff}
                                setAudioLevelListener={(listener, period) => setAudioLevelListener(listener, period)}
                                setParticipantIdMuted={(participant) => setParticipantIdMuted(participant)}
                                turnOnYourMicNotification={(streamId) => turnOnYourMicNotification(streamId)}
                                turnOffYourMicNotification={(streamId) => turnOffYourMicNotification(streamId)}
                                turnOffYourCamNotification={(streamId) => turnOffYourCamNotification(streamId)}
                                isAdmin={isAdmin}
                                localVideo={localVideo}
                                localVideoCreate={(tempLocalVideo) => localVideoCreate(tempLocalVideo)}
                                isRecordPluginActive={isRecordPluginActive}
                                isEnterDirectly={isEnterDirectly}
                                cameraButtonDisabled={cameraButtonDisabled}
                                checkAndTurnOffLocalCamera={(streamId) => checkAndTurnOffLocalCamera(streamId)}
                                checkAndTurnOnLocalCamera={(streamId) => checkAndTurnOnLocalCamera(streamId)}
                                toggleMic={(mute) => toggleMic(mute)}
                                microphoneButtonDisabled={microphoneButtonDisabled}
                                isScreenShared={isScreenShared}
                                handleStartScreenShare={()=>handleStartScreenShare()}
                                handleStopScreenShare={()=>handleStopScreenShare()}
                                numberOfUnReadMessages={numberOfUnReadMessages}
                                toggleSetNumberOfUnreadMessages={(value) => toggleSetNumberOfUnreadMessages(value)}
                                handleMessageDrawerOpen={(open) => handleMessageDrawerOpen(open)}
                                participantCount={participantCount}
                                handleParticipantListOpen={(open) => handleParticipantListOpen(open)}
                                requestSpeakerList={requestSpeakerList}
                                handlePublisherRequestListOpen={(open) => setPublisherRequestListDrawerOpen(open)}
                                handlePublisherRequest={()=>handlePublisherRequest()}
                                setLeftTheRoom={(left) => setLeftTheRoom(left)}
                                addFakeParticipant={() => addFakeParticipant()}
                                removeFakeParticipant={() => removeFakeParticipant()}
                                fakeReconnect={() => fakeReconnect()}
                                isBroadcasting={isBroadcasting}
                                handleSetDesiredTileCount={(count) => handleSetDesiredTileCount(count)}
                                handleBackgroundReplacement={(mode)=>handleBackgroundReplacement(mode)}
                                microphoneSelected={(mic) => microphoneSelected(mic)}
                                devices={devices}
                                selectedCamera={selectedCamera}
                                cameraSelected={(camera) => cameraSelected(camera)}
                                selectedMicrophone={selectedMicrophone}
                                selectedBackgroundMode={selectedBackgroundMode}
                                setSelectedBackgroundMode={(mode) => setSelectedBackgroundMode(mode)}
                                videoSendResolution={videoSendResolution}
                                setVideoSendResolution={(resolution) => setVideoSendResolution(resolution)}
                                isRecordPluginInstalled={isRecordPluginInstalled}
                                startRecord={()=>startRecord()}
                                stopRecord={()=>stopRecord()}
                                handleEffectsOpen={(open) => handleEffectsOpen(open)}
                                setBecomePublisherConfirmationDialogOpen={(open)=>setBecomePublisherConfirmationDialogOpen(open)}
                                handleStartBecomePublisher={()=>handleStartBecomePublisher()}
                                isBecomePublisherConfirmationDialogOpen={isBecomePublisherConfirmationDialogOpen}
                            />
                            <MessageDrawer
                                messages={messages}
                                sendMessage={(message) => handleSendMessage(message)}
                                handleSetMessages={(messages) => handleSetMessages(messages)}
                                messageDrawerOpen={messageDrawerOpen}
                                handleMessageDrawerOpen={(open) => handleMessageDrawerOpen(open)}
                                handleParticipantListOpen={(open) => handleParticipantListOpen(open)}
                                handleEffectsOpen={(open) => handleEffectsOpen(open)}
                                setPublisherRequestListDrawerOpen={(open) => setPublisherRequestListDrawerOpen(open)}
                            />
                            <ParticipantListDrawer
                                globals={globals}
                                isAdmin={isAdmin}
                                pinVideo={(streamId) => pinVideo(streamId)}
                                makeListenerAgain={(streamId) => makeListenerAgain(streamId)}
                                videoTrackAssignments={videoTrackAssignments}
                                presenterButtonStreamIdInProcess={presenterButtonStreamIdInProcess}
                                presenterButtonDisabled={presenterButtonDisabled}
                                makeParticipantPresenter={(streamId) => makeParticipantPresenter(streamId)}
                                makeParticipantUndoPresenter={(streamId) => makeParticipantUndoPresenter(streamId)}
                                participantCount={participantCount}
                                isMyMicMuted={isMyMicMuted}
                                publishStreamId={publishStreamId}
                                muteLocalMic={()=>muteLocalMic()}
                                turnOffYourMicNotification={(streamId) => turnOffYourMicNotification(streamId)}
                                setParticipantIdMuted={(participant) => setParticipantIdMuted(participant)}
                                pagedParticipants={pagedParticipants}
                                updateAllParticipantsPagination={(value) => updateAllParticipantsPagination(value)}
                                participantListDrawerOpen={participantListDrawerOpen}
                                handleMessageDrawerOpen={(open) => handleMessageDrawerOpen(open)}
                                handleParticipantListOpen={(open) => handleParticipantListOpen(open)}
                                handleEffectsOpen={(open) => handleEffectsOpen(open)}
                                setPublisherRequestListDrawerOpen={(open) => setPublisherRequestListDrawerOpen(open)}
                            />
                            <EffectsDrawer
                                effectsDrawerOpen={effectsDrawerOpen}
                                setVirtualBackgroundImage={(img)=>setVirtualBackgroundImage(img)}
                                handleBackgroundReplacement={(mode)=>handleBackgroundReplacement(mode)}
                                handleMessageDrawerOpen={(open) => handleMessageDrawerOpen(open)}
                                handleParticipantListOpen={(open) => handleParticipantListOpen(open)}
                                handleEffectsOpen={(open) => handleEffectsOpen(open)}
                                setPublisherRequestListDrawerOpen={(open) => setPublisherRequestListDrawerOpen(open)}
                            />
                            <PublisherRequestListDrawer
                                publisherRequestListDrawerOpen={publisherRequestListDrawerOpen}
                                approveBecomeSpeakerRequest={(streamId) => approveBecomeSpeakerRequest(streamId)}
                                rejectBecomeSpeakerRequest={(streamId) => rejectBecomeSpeakerRequest(streamId)}
                                requestSpeakerList={requestSpeakerList}
                                publishStreamId={publishStreamId}
                                handleMessageDrawerOpen={(open) => handleMessageDrawerOpen(open)}
                                handleParticipantListOpen={(open) => handleParticipantListOpen(open)}
                                handleEffectsOpen={(open) => handleEffectsOpen(open)}
                                setPublisherRequestListDrawerOpen={(open) => setPublisherRequestListDrawerOpen(open)}
                            />
                        </>
                    )}
                    </UnitTestContext.Provider>
            </Grid>
        </Grid>
    );
}

export default AntMedia;
