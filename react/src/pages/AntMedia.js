import React, {useEffect, useState} from "react";
import {Box, CircularProgress, Grid, Backdrop, Typography} from "@mui/material";
import {useBeforeUnload, useParams} from "react-router-dom";
import WaitingRoom from "./WaitingRoom";
import _ from "lodash";
import MeetingRoom from "./MeetingRoom";
import MessageDrawer from "Components/MessageDrawer";
import {useSnackbar} from "notistack";
import LeftTheRoom from "./LeftTheRoom";
import {getUrlParameter, VideoEffect, WebRTCAdaptor} from "@antmedia/webrtc_adaptor";
import {SvgIcon} from "../Components/SvgIcon";
import ParticipantListDrawer from "../Components/ParticipantListDrawer";
import EffectsDrawer from "../Components/EffectsDrawer";
import {useTranslation} from "react-i18next";

import {getRoomNameAttribute, getWebSocketURLAttribute, isComponentMode} from "../utils";
import floating from "../external/floating.js";
import {UnauthrorizedDialog} from "Components/Footer/Components/UnauthorizedDialog";
import {useWebSocket} from 'Components/WebSocketProvider';
import {useTheme} from "@mui/material/styles";

export const ConferenceContext = React.createContext(null);

const globals = {
    //this settings is to keep consistent with the sdk until backend for the app is setup
    // maxVideoTrackCount is the tracks i can see excluding my own local video.so the use is actually seeing 3 videos when their own local video is included.
    maxVideoTrackCount: 6, desiredMaxVideoTrackCount: 6, trackEvents: [],
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

function getPlayToken() {
    const dataPlayToken = document.getElementById("root")?.getAttribute("data-play-token");
    return (dataPlayToken) ? dataPlayToken : getUrlParameter("playToken");
}

function getPublishToken() {
    const dataPublishToken = document.getElementById("root")?.getAttribute("data-publish-token");
    return (dataPublishToken) ? dataPublishToken : getUrlParameter("publishToken");
}

var playToken = getPlayToken();
var publishToken = getPublishToken();
var token = getUrlParameter("token")
var InitialStreamId = getUrlParameter("streamId");
var playOnly = getUrlParameter("playOnly");
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


if (playOnly) {
    mediaConstraints = {
        video: false, audio: false,
    };
}

let websocketURL = process.env.REACT_APP_WEBSOCKET_URL;

if (!websocketURL) {

    websocketURL = getWebSocketURLAttribute();

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

if (playOnly == null) {
    playOnly = false;
}

if (playToken == null || typeof playToken === "undefined") {
    playToken = "";
}

if (publishToken == null || typeof publishToken === "undefined") {
    publishToken = "";
}

if (token == null || typeof token === "undefined") {
    token = "";
}

var roomOfStream = [];

var audioListenerIntervalJob = null;
var videoTrackAssignmentsIntervalJob = null;


var room = null;
var reconnecting = false;
var publishReconnected;
var playReconnected;

function AntMedia(props) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const id = (isComponentMode()) ? getRoomNameAttribute() : useParams().id;
    const roomName = id;

    // drawerOpen for message components.
    const [messageDrawerOpen, setMessageDrawerOpen] = useState(false);

    // drawerOpen for participant list components.
    const [participantListDrawerOpen, setParticipantListDrawerOpen] = useState(false);

    // drawerOpen for effects components.
    const [effectsDrawerOpen, setEffectsDrawerOpen] = useState(false);

    const [publishStreamId, setPublishStreamId] = useState(InitialStreamId);


    // this is my own name when i enter the room.
    const [streamName, setStreamName] = useState("");

    // this is for checking if i am sharing my screen with other participants.
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

    const [isAdmin, setIsAdmin] = React.useState(false);
    const [approvedSpeakerRequestList, setApprovedSpeakerRequestList] = React.useState([]);
    const [presenters, setPresenters] = React.useState([]);
    const [presenterButtonDisabled, setPresenterButtonDisabled] = React.useState(false);
    const [microphoneButtonDisabled, setMicrophoneButtonDisabled] = React.useState(false);
    const [cameraButtonDisabled, setCameraButtonDisabled] = React.useState(false);

    const [screenSharingInProgress, setScreenSharingInProgress] = React.useState(false);

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

    const {sendMessage, latestMessage, isWebSocketConnected} = useWebSocket();

    const [videoTrackAssignments, setVideoTrackAssignments] = useState([]);

    /*
     * allParticipants: is a dictionary of (streamId, broadcastObject) for all participants in the room.
     * It determines the participants list in the participants drawer.
     * broadcastObject callback (which is return of getBroadcastObject request) for roomName has subtrackList and
     * we use it to fill this dictionary.
     */
    const [allParticipants, setAllParticipants] = useState({});

    const [audioTracks, setAudioTracks] = useState([]);

    const [talkers, setTalkers] = useState([]);
    const [isPublished, setIsPublished] = useState(false);
    const [isPlayed, setIsPlayed] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const [selectedCamera, setSelectedCamera] = React.useState(localStorage.getItem('selectedCamera'));
    const [selectedMicrophone, setSelectedMicrophone] = React.useState(localStorage.getItem('selectedMicrophone'));
    const [selectedBackgroundMode, setSelectedBackgroundMode] = React.useState("");
    const [isVideoEffectRunning, setIsVideoEffectRunning] = React.useState(false);
    const [virtualBackground, setVirtualBackground] = React.useState(null);
    const timeoutRef = React.useRef(null);
    const screenShareWebRtcAdaptor = React.useRef(null)
    const screenShareStreamId = React.useRef(null)
    const {enqueueSnackbar, closeSnackbar} = useSnackbar();
    const [fakeParticipantCounter, setFakeParticipantCounter] = React.useState(1);

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
    const speedTestCounter = React.useRef(0);
    const speedTestForPlayWebRtcAdaptor = React.useRef(null);

    // video send resolution for publishing
    // possible values: "auto", "highDefinition", "standartDefinition", "lowDefinition"
    const [videoSendResolution, setVideoSendResolution] = React.useState(localStorage.getItem("videoSendResolution") ? localStorage.getItem("videoSendResolution") : "auto");

    const [messages, setMessages] = React.useState([]);

    const [devices, setDevices] = React.useState([]);

    const [isPlayOnly, setIsPlayOnly] = React.useState(playOnly);

    const [isEnterDirectly] = React.useState(enterDirectly);

    const [localVideo, setLocalVideo] = React.useState(null);

    const [webRTCAdaptor, setWebRTCAdaptor] = React.useState();
    const [leaveRoomWithError, setLeaveRoomWithError] = React.useState(null);


    const [initialized, setInitialized] = React.useState(!!props.isTest);
    const [recreateAdaptor, setRecreateAdaptor] = React.useState(true);
    const [publisherRequestListDrawerOpen, setPublisherRequestListDrawerOpen] = React.useState(false);

    const [publishStats, setPublishStats] = React.useState(null);

    const [isReconnectionInProgress, setIsReconnectionInProgress] = React.useState(false);

    const [highResourceUsageWarningCount, setHighResourceUsageWarningCount] = React.useState(0);

    const [isNoSreamExist, setIsNoSreamExist] = React.useState(false);


    const {t} = useTranslation();

    const theme = useTheme();


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
        if (isPlayOnly === "true" || isPlayOnly === true) {
            createSpeedTestForPublishWebRtcAdaptorPlayOnly();
        } else {
            createSpeedTestForPublishWebRtcAdaptor();
        }

        createSpeedTestForPlayWebRtcAdaptor();
    }

    function stopSpeedTest() {
        if (speedTestForPublishWebRtcAdaptor.current) {
            speedTestForPublishWebRtcAdaptor.current.stop("speedTestStream" + speedTestStreamId.current);
        }
        if (speedTestForPlayWebRtcAdaptor.current) {
            speedTestForPlayWebRtcAdaptor.current.stop("speedTestStream" + speedTestStreamId.current);
        }
        speedTestForPublishWebRtcAdaptor.current = null;
        speedTestForPlayWebRtcAdaptor.current = null;
    }

    function parseWebSocketURL(url) {
        // sample url: ws://localhost:5080/WebRTCAppEE/websocket

        if (!url) {
            return '';
        }

        let parsedURL = url.split("/");
        let protocol = parsedURL[0];
        if (protocol === "wss:") {
            protocol = "https:";
        } else {
            protocol = "http:";
        }
        let host = parsedURL[2];
        let appName = parsedURL[3];
        return protocol + "//" + host + "/" + appName;
    }

    function createSpeedTestForPublishWebRtcAdaptorPlayOnly() {
        // create video element and get the stream
        let videoElement = document.createElement("video");
        videoElement.id = "speedTestVideoElement";
        videoElement.style.display = "none";
        videoElement.autoplay = true;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.controls = false;
        videoElement.width = 640;
        videoElement.height = 360;
        videoElement.loop = true;
        videoElement.crossOrigin = "anonymous"

        let videoElementUrl = parseWebSocketURL(websocketURL) + "/speed-test-sample-video.mp4";
        videoElement.src = videoElementUrl;
        document.body.appendChild(videoElement);

        setTimeout(() => {
            let videoStream = videoElement.captureStream();

            speedTestForPublishWebRtcAdaptor.current = new WebRTCAdaptor({
                websocket_url: websocketURL,
                localStream: videoStream,
                sdp_constraints: {
                    OfferToReceiveAudio: false, OfferToReceiveVideo: false,
                },
                debug: true,
                callback: speedTestForPublishWebRtcAdaptorInfoCallback,
                callbackError: speedTestForPublishWebRtcAdaptorErrorCallback,
                purposeForTest: "publish-speed-test-play-only"
            })
        }, 3000);

    }

    function createSpeedTestForPublishWebRtcAdaptor() {
        speedTestForPublishWebRtcAdaptor.current = new WebRTCAdaptor({
            websocket_url: websocketURL,
            mediaConstraints: {video: true, audio: false},
            sdp_constraints: {
                OfferToReceiveAudio: false, OfferToReceiveVideo: false,
            },
            debug: true,
            callback: speedTestForPublishWebRtcAdaptorInfoCallback,
            callbackError: speedTestForPublishWebRtcAdaptorErrorCallback,
            purposeForTest: "publish-speed-test"
        })

    }

    function speedTestForPublishWebRtcAdaptorInfoCallback(info, obj) {
        if (info === "initialized") {
            speedTestCounter.current = 0;
            let tempSpeedTestObject = {};
            tempSpeedTestObject.message = speedTestObject.message;
            tempSpeedTestObject.isfinished = false;
            tempSpeedTestObject.isfailed = false;
            tempSpeedTestObject.errorMessage = "";
            tempSpeedTestObject.progressValue = 10;
            setSpeedTestObject(tempSpeedTestObject);
            speedTestForPublishWebRtcAdaptor.current.publish("speedTestStream" + speedTestStreamId.current, token, subscriberId, subscriberCode, "speedTestStream" + speedTestStreamId.current, "", "")
        } else if (info === "publish_started") {
            speedTestCounter.current = 0;
            console.log("speed test publish started");
            let tempSpeedTestObject = {};
            tempSpeedTestObject.message = speedTestObject.message;
            tempSpeedTestObject.isfinished = false;
            tempSpeedTestObject.isfailed = false;
            tempSpeedTestObject.errorMessage = "";
            tempSpeedTestObject.progressValue = 20;
            setSpeedTestObject(tempSpeedTestObject);
            speedTestForPublishWebRtcAdaptor.current.enableStats("speedTestStream" + speedTestStreamId.current);
        } else if (info === "updated_stats") {
            speedTestCounter.current = speedTestCounter.current + 1;

            let tempSpeedTestObject = {};
            tempSpeedTestObject.message = speedTestObject.message;
            tempSpeedTestObject.isfinished = false;
            tempSpeedTestObject.isfailed = false;
            tempSpeedTestObject.errorMessage = "";
            tempSpeedTestObject.progressValue = 20 + (speedTestCounter.current * 30);
            setSpeedTestObject(tempSpeedTestObject);

            if (speedTestCounter.current > 2) {
                speedTestForPublishWebRtcAdaptor.current?.stop("speedTestStream" + speedTestStreamId.current);
                let rtt = ((parseFloat(obj.videoRoundTripTime) + parseFloat(obj.audioRoundTripTime)) / 2).toPrecision(3);
                let packetLost = parseInt(obj.videoPacketsLost) + parseInt(obj.audioPacketsLost);
                let jitter = ((parseFloat(obj.videoJitter) + parseInt(obj.audioJitter)) / 2).toPrecision(3);
                let outgoingBitrate = parseInt(obj.currentOutgoingBitrate);
                let bandwidth = parseInt(speedTestForPublishWebRtcAdaptor.current.mediaManager.bandwidth);
                console.log("* rtt: " + rtt);
                console.log("* packetLost: " + packetLost);
                console.log("* jitter: " + jitter);
                console.log("* outgoingBitrate: " + outgoingBitrate);
                console.log("* bandwidth: " + bandwidth);

                let speedTestResult = {};

                if (rtt >= 150 || packetLost >= 2.5 || jitter >= 80 || ((outgoingBitrate / 100) * 80) >= bandwidth) {
                    console.log("-> Your connection quality is poor. You may experience interruptions");
                    speedTestResult.message = "Your connection quality is poor. You may experience interruptions";
                } else if (rtt >= 50 || packetLost >= 1 || jitter >= 30 || outgoingBitrate >= bandwidth) {
                    console.log("-> Your connection is fair, but you may experience interruptions");
                    speedTestResult.message = "Your connection is fair, but you may experience interruptions";
                } else {
                    console.log("-> Your connection is good");
                    speedTestResult.message = "Your connection is optimal";
                }

                speedTestResult.isfailed = false;
                speedTestResult.errorMessage = "";
                speedTestResult.progressValue = 100;

                speedTestResult.isfinished = true;
                setSpeedTestObject(speedTestResult);

                stopSpeedTest();
            } else {
                let tempSpeedTestObject = {};
                tempSpeedTestObject.message = speedTestObject.message;
                tempSpeedTestObject.isfinished = false;
                tempSpeedTestObject.isfailed = false;
                tempSpeedTestObject.errorMessage = "";
                tempSpeedTestObject.progressValue = 20 + (speedTestCounter.current * 30);
                setSpeedTestObject(tempSpeedTestObject);
            }
        } else if (info === "ice_connection_state_changed") {
            console.log("speed test ice connection state changed")
        }
    }

    function speedTestForPublishWebRtcAdaptorErrorCallback(error, message) {
        console.log("error from speed test webrtc adaptor callback")
        //some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
        console.log("error:" + error + " message:" + message);

        let tempSpeedTestObject = {};
        tempSpeedTestObject.message = speedTestObject.message;
        tempSpeedTestObject.isfinished = speedTestObject.isfinished;
        tempSpeedTestObject.isfailed = true;
        tempSpeedTestObject.errorMessage = "Error occurred while testing your connection speed.";
        tempSpeedTestObject.progressValue = 0;
        setSpeedTestObject(tempSpeedTestObject);
    }

    function createSpeedTestForPlayWebRtcAdaptor() {
        speedTestForPlayWebRtcAdaptor.current = new WebRTCAdaptor({
            websocket_url: websocketURL,
            mediaConstraints: {video: false, audio: false},
            playOnly: true,
            sdp_constraints: {
                OfferToReceiveAudio: false, OfferToReceiveVideo: false,
            },
            debug: true,
            callback: speedTestForPlayWebRtcAdaptorInfoCallback,
            callbackError: speedTestForPlayWebRtcAdaptorErrorCallback,
            purposeForTest: "play-speed-test"
        })

    }

    function speedTestForPlayWebRtcAdaptorInfoCallback(info, obj) {
        if (info === "initialized") {
            speedTestForPlayWebRtcAdaptor.current.play("speedTestStream" + speedTestStreamId.current, "", "", [], "", "", "");
        } else if (info === "publish_started") {
            console.log("speed test publish started")
        } else if (info === "updated_stats") {
            console.log("speed test updated stats")
        } else if (info === "ice_connection_state_changed") {
            console.log("speed test ice connection state changed")
        }
    }

    function speedTestForPlayWebRtcAdaptorErrorCallback(error, message) {
        console.log("error from speed test webrtc adaptor callback")
        //some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
        console.log("error:" + error + " message:" + message);

        if (speedTestCounter.current > 0) {
            let tempSpeedTestObject = {};
            tempSpeedTestObject.message = speedTestObject.message;
            tempSpeedTestObject.isfinished = speedTestObject.isfinished;
            tempSpeedTestObject.isfailed = true;
            tempSpeedTestObject.errorMessage = "Error occurred while testing your connection speed.";
            tempSpeedTestObject.progressValue = 0;
            setSpeedTestObject(tempSpeedTestObject);
        }
    }

    function checkAndUpdateVideoAudioSources() {
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

        if (webRTCAdaptor !== null && currentCameraDeviceId !== selectedDevices.videoDeviceId && typeof publishStreamId != 'undefined') {
            webRTCAdaptor?.switchVideoCameraCapture(publishStreamId, selectedDevices.videoDeviceId);
        }
        if (webRTCAdaptor !== null && (currentAudioDeviceId !== selectedDevices.audioDeviceId || selectedDevices.audioDeviceId === 'default') && typeof publishStreamId != 'undefined') {
            webRTCAdaptor?.switchAudioInputSource(publishStreamId, selectedDevices.audioDeviceId);
        }
    }

    function reconnectionInProgress() {
        //reset UI releated states
        removeAllRemoteParticipants();

        setIsReconnectionInProgress(true);
        reconnecting = true;
        publishReconnected = isPlayOnly;
        playReconnected = false;

        displayWarning("Connection lost. Trying reconnect...");
    }

    function joinRoom(roomName, generatedStreamId) {
        room = roomName;
        roomOfStream[generatedStreamId] = room;

        globals.maxVideoTrackCount = 6; //FIXME
        setPublishStreamId(generatedStreamId);

        token = getUrlParameter("token") || publishToken; // can be used for both publish and play. at the moment only used on room creation password scenario

        if (!playOnly && token === undefined) {
            token = publishToken;
        }

        if (!playOnly) {
            handlePublish(generatedStreamId, token, subscriberId, subscriberCode);
        }

        if (token === undefined) {
            token = playToken;
        }

        webRTCAdaptor?.play(roomName, token, roomName, null, subscriberId, subscriberCode);
    }

    function requestVideoTrackAssignmentsInterval() {
        if (videoTrackAssignmentsIntervalJob === null) {
            videoTrackAssignmentsIntervalJob = setInterval(() => {
                webRTCAdaptor?.requestVideoTrackAssignments(roomName);
            }, 3000);
        }
    }

    async function checkDevices() {
        let devices = await navigator.mediaDevices.enumerateDevices();
        let audioDeviceAvailable = false
        let videoDeviceAvailable = false
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

        let allParticipantsTemp = allParticipants;
        let broadcastObject = {
            name: "name_" + suffix,
            streamId: "streamId_" + suffix,
            metaData: JSON.stringify({isCameraOn: false}),
            isPinned: undefined,
            isScreenShared: undefined,
            isFake: true
        };
        allParticipantsTemp["streamId_" + suffix] = broadcastObject;
        setAllParticipants(allParticipantsTemp);

        if (Object.keys(allParticipantsTemp).length <= globals.maxVideoTrackCount) {
            let newVideoTrackAssignment = {
                videoLabel: "label_" + suffix, track: null, streamId: "streamId_" + suffix,
            };
            let temp = videoTrackAssignments;
            temp.push(newVideoTrackAssignment);
            setVideoTrackAssignments(temp);
        }

        console.log("fake participant added");
        setParticipantUpdated(!participantUpdated);
    }

    function removeFakeParticipant() {
        let tempCount = fakeParticipantCounter - 1;
        let suffix = "fake" + tempCount;
        setFakeParticipantCounter(tempCount);

        let tempVideoTrackAssignments = videoTrackAssignments.filter(el => el.streamId !== "streamId_" + suffix)
        setVideoTrackAssignments(tempVideoTrackAssignments);

        let allParticipantsTemp = allParticipants;
        delete allParticipantsTemp["streamId_" + suffix];
        setAllParticipants(allParticipantsTemp);

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

        let participantIds = broadcastObject.subTrackStreamIds;

        //find and remove not available tracks
        const temp = allParticipants;
        let currentTracks = Object.keys(temp);
        currentTracks.forEach(trackId => {
            if (!allParticipants[trackId].isFake && !participantIds.includes(trackId)) {
                console.log("stream removed:" + trackId);

                delete temp[trackId];
            }
        });
        setAllParticipants(temp);
        setParticipantUpdated(!participantUpdated);

        //request broadcast object for new tracks
        participantIds.forEach(pid => {
            if (allParticipants[pid] === undefined) {
                webRTCAdaptor?.getBroadcastObject(pid);
            }
        });
    }


    function handleSubtrackBroadcastObject(broadcastObject) {
        let allParticipantsTemp = allParticipants;
        let metaData = JSON.parse(broadcastObject.metaData);
        broadcastObject.isScreenShared = metaData.isScreenShared;
        allParticipantsTemp[broadcastObject.streamId] = broadcastObject; //TODO: optimize
        setAllParticipants(allParticipantsTemp);
        setParticipantUpdated(!participantUpdated);
    }

    useEffect(() => {
        async function createWebRTCAdaptor() {
            console.log("++ createWebRTCAdaptor");
            //here we check if audio or video device available and wait result
            //according to the result we modify mediaConstraints
            await checkDevices();
            if (recreateAdaptor && webRTCAdaptor == null) {
                var adaptor = new WebRTCAdaptor({
                    websocket_url: websocketURL,
                    mediaConstraints: mediaConstraints, //placeholder for peerconnection_config
                    isPlayMode: playOnly, // onlyDataChannel: playOnly,
                    debug: true,
                    callback: infoCallback,
                    callbackError: errorCallback,
                    purposeForTest: "main-adaptor"
                });
                setWebRTCAdaptor(adaptor)

                setRecreateAdaptor(false);
            }
        }

        createWebRTCAdaptor();
    }, [recreateAdaptor]);  // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (devices.length > 0) {
            checkAndUpdateVideoAudioSources();
        }
    }, [devices]); // eslint-disable-line react-hooks/exhaustive-deps

    if (webRTCAdaptor) {
        webRTCAdaptor.callback = infoCallback;
        webRTCAdaptor.callbackError = errorCallback;
        webRTCAdaptor.localStream = localVideo;
    }

    function makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
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
                    mediaConstraints: getMediaConstraints("screenConstraints", 20), //placeholder for peerconnection_config
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

        var token = getUrlParameter("token") || publishToken; // can be used for both publish and play. at the moment only used on room creation password scenario

        if (token === undefined) {
            token = publishToken;
        }

        var metaData = {
            isMicMuted: false, isCameraOn: true, isScreenShared: true, playOnly: false
        }

        let currentStreamName = streamName + " - Screen Share";

        screenShareStreamId.current = publishStreamId + "_presentation"

        screenShareWebRtcAdaptor.current.publish(screenShareStreamId.current, token, subscriberId, subscriberCode, currentStreamName, roomName, JSON.stringify(metaData))

        setScreenSharingInProgress(true);

        setTimeout(() => {
            setScreenSharingInProgress(false);
        }, 5000);
    }

    React.useEffect(() => {
        if (playOnly && enterDirectly && initialized) {
            let streamId = makeid(10);
            setStreamName("Anonymous");

            // if play only mode and enter directly flags are true, then we will enter the meeting room directly
            setWaitingOrMeetingRoom("meeting");

            joinRoom(roomName, streamId);
        }


        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialized]);

    function infoCallback(info, obj) {
        if (info === "initialized") {
            setInitialized(true);
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
        } else if (info === "newStreamAvailable") {
            handlePlayVideo(obj);
            console.log("newStreamAvailable:", obj);
        } else if (info === "publish_started") {
            setIsPublished(true);
            console.log("**** publish started:" + reconnecting);

            if (reconnecting) {
                // we need to set the local video again after the reconnection
                let newLocalVideo = document.getElementById((typeof publishStreamId === "undefined") ? "localVideo" : publishStreamId);
                localVideoCreate(newLocalVideo);
                // we need to set the setVideoCameraSource to be able to update sender source after the reconnection
                webRTCAdaptor.mediaManager.setVideoCameraSource(publishStreamId, webRTCAdaptor.mediaManager.mediaConstraints, null, true);
                webRTCAdaptor?.getBroadcastObject(roomName); // FIXME: maybe this is not needed, check it
                publishReconnected = true;
                reconnecting = !(publishReconnected && playReconnected);
                setIsReconnectionInProgress(reconnecting);

                return;
            }
            console.log("publish started");
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
            requestVideoTrackAssignmentsInterval();

            if (reconnecting) {
                playReconnected = true;
                reconnecting = !(publishReconnected && playReconnected);
                setIsReconnectionInProgress(reconnecting);
            }
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
            checkConnectionQuality(obj);
        } else if (info === "debugInfo") {
            handleDebugInfo(obj.debugInfo);
        } else if (info === "ice_connection_state_changed") {
            console.log("iceConnectionState Changed: ", JSON.stringify(obj))
        } else if (info === "reconnection_attempt_for_player") {
            if (playOnly && isNoSreamExist) {
                console.log("reconnection_attempt_for_player but no stream exist")
            } else {
                reconnectionInProgress();
            }
        }
    }

    function checkConnectionQuality(obj) {
        let rtt = ((parseFloat(obj.videoRoundTripTime) + parseFloat(obj.audioRoundTripTime)) / 2).toPrecision(3);
        let jitter = ((parseFloat(obj.videoJitter) + parseInt(obj.audioJitter)) / 2).toPrecision(3);
        //let outgoingBitrate = parseInt(obj.currentOutgoingBitrate);

        let packageLost = parseInt(obj.videoPacketsLost) + parseInt(obj.audioPacketsLost);
        let packageSent = parseInt(obj.totalVideoPacketsSent) + parseInt(obj.totalAudioPacketsSent);

        let packageLostPercentage = 0;
        console.log("publishStats:", publishStats);
        if (publishStats !== null) {
            let deltaPackageLost = packageLost - publishStats.packageLost;
            let deltaPackageSent = packageSent - publishStats.packageSent;

            if (deltaPackageLost > 0) {
                packageLostPercentage = ((deltaPackageLost / parseInt(deltaPackageSent)) * 100).toPrecision(3);
            }
        }

        if (rtt >= 150 || packageLostPercentage >= 2.5 || jitter >= 80) { //|| ((outgoingBitrate / 100) * 80) >= obj.availableOutgoingBitrate
            console.warn("rtt:" + rtt + " packageLostPercentage:" + packageLostPercentage + " jitter:" + jitter); // + " Available Bandwidth kbps :", obj.availableOutgoingBitrate, "Outgoing Bandwidth kbps:", outgoingBitrate);
            displayPoorNetworkConnectionWarning("Network connection is weak. You may encounter connection drop!");
        } else if (rtt >= 100 || packageLostPercentage >= 1.5 || jitter >= 50) {
            console.warn("rtt:" + rtt + " packageLostPercentage:" + packageLostPercentage + " jitter:" + jitter);
            displayPoorNetworkConnectionWarning("Network connection is not stable. Please check your connection!");
        }

        setPublishStats({packageLost: packageLost, packageSent: packageSent});
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
                    handlePublish(publishStreamId, publishToken, subscriberId, subscriberCode);
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
                    if (!playOnly) {
                        webRTCAdaptor?.stop(publishStreamId);
                    }
                    webRTCAdaptor?.stop(roomName);
                    webRTCAdaptor?.checkWebSocketConnection();
                    joinRoom(roomName, publishStreamId);
                }, 3000);
            }
        } else if ((error === "publishTimeoutError") && (!reconnecting)) {
            setLeaveRoomWithError("Firewall might be blocking your connection. Please report this.");
            setLeftTheRoom(true);
            setIsJoining(false);
        } else if (error === "license_suspended_please_renew_license") {
            setLeaveRoomWithError("Licence error. Please report this.");
            setLeftTheRoom(true);
            setIsJoining(false);
        } else if (error === "notSetRemoteDescription") {
            setLeaveRoomWithError("System is not compatible to connect. Please report this.");
            setLeftTheRoom(true);
            setIsJoining(false);

        }
        console.log("***** " + error)
    }

    function pinVideo(streamId) {
        // id is for pinning user.
        let videoLabel;
        let broadcastObject = allParticipants[streamId];

        if (broadcastObject === undefined) {
            console.error("Cannot find broadcast object for streamId: " + streamId);
            return;
        }

        // if we already pin the targeted user then we are going to remove it from pinned video.
        if ((typeof broadcastObject.isPinned !== "undefined") && (broadcastObject.isPinned === true)) {
            broadcastObject.isPinned = false; // false means user unpin manually
            allParticipants[streamId] = broadcastObject;
            handleNotifyUnpinUser(streamId !== publishStreamId ? streamId : publishStreamId);
            setParticipantUpdated(!participantUpdated);
            return;
        }

        // if there is no pinned video we are going to pin the targeted user.
        // and we need to inform pinned user.
        if (streamId === publishStreamId) {
            videoLabel = "localVideo";
        }

        if (videoLabel !== "localVideo" && videoTrackAssignments.length > 0) {
            videoLabel = videoTrackAssignments[1]?.videoLabel;
            webRTCAdaptor?.assignVideoTrack(videoLabel, streamId, true);
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

    function handleSetMaxVideoTrackCount(maxTrackCount) {
        globals.desiredMaxVideoTrackCount = maxTrackCount;
    }

    function updateMaxVideoTrackCount(newCount) {
        if (publishStreamId && globals.maxVideoTrackCount !== newCount) {
            globals.maxVideoTrackCount = newCount;
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

    function sendReactions(reaction) {
        handleSendNotificationEvent("REACTIONS", publishStreamId, {
            reaction: reaction, senderStreamId: publishStreamId,
        });
        showReactions(publishStreamId, reaction);
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
        }
    }

    function handleParticipantListOpen(open) {
        setParticipantListDrawerOpen(open);
        if (open) {
            setMessageDrawerOpen(false);
            setEffectsDrawerOpen(false);
        }
    }

    function handleEffectsOpen(open) {
        setEffectsDrawerOpen(open);
        if (open) {
            setMessageDrawerOpen(false);
            setParticipantListDrawerOpen(false);
        }
    }

    function handleSendMessage(message) {
        if (publishStreamId) {
            let iceState = webRTCAdaptor?.iceConnectionState(publishStreamId);
            if (iceState !== null && iceState !== "failed" && iceState !== "disconnected") {
                if (message === "debugme") {
                    webRTCAdaptor?.getDebugInfo(publishStreamId);
                    return;
                } else if (message === "clearme") {
                    setMessages([]);
                    return;
                }


                webRTCAdaptor?.sendData(publishStreamId, JSON.stringify({
                    eventType: "MESSAGE_RECEIVED",
                    message: message,
                    name: streamName,
                    senderId: publishStreamId,
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

    function handleNotificationEvent(obj) {
        var notificationEvent = JSON.parse(obj.data);
        if (notificationEvent != null && typeof notificationEvent == "object") {
            var eventStreamId = notificationEvent.streamId;
            var eventType = notificationEvent.eventType;

            if (eventType === "CAM_TURNED_OFF" || eventType === "CAM_TURNED_ON" || eventType === "MIC_MUTED" || eventType === "MIC_UNMUTED") {
                webRTCAdaptor?.getBroadcastObject(eventStreamId);
            } else if (eventType === "RECORDING_TURNED_ON") {
                setIsRecordPluginActive(true);
            } else if (eventType === "RECORDING_TURNED_OFF") {
                setIsRecordPluginActive(false);
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
                        return [...oldMessages]; // dont make this "return oldMessages;" this is to trigger the useEffect for scroll bottom and get over showing the last prev state do
                    } else {
                        return [...oldMessages, notificationEvent];
                    }
                });
            } else if (eventType === "REACTIONS" && notificationEvent.senderStreamId !== publishStreamId) {
                showReactions(notificationEvent.senderStreamId, notificationEvent.reaction);
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
                let videoTrackAssignmentList = notificationEvent.payload;

                console.info("VIDEO_TRACK_ASSIGNMENT_LIST -> ", JSON.stringify(videoTrackAssignmentList));

                let tempVideoTrackAssignments = videoTrackAssignments;

                let tempVideoTrackAssignmentsNew = [];

                tempVideoTrackAssignments.forEach(tempVideoTrackAssignment => {
                    let assignment;

                    videoTrackAssignmentList.forEach(videoTrackAssignment => {
                        if (tempVideoTrackAssignment.videoLabel === videoTrackAssignment.videoLabel) {
                            assignment = videoTrackAssignment;
                        }
                    });

                    if (tempVideoTrackAssignment.isMine || assignment !== undefined) {
                        if (isVideoLabelExsist(tempVideoTrackAssignment.videoLabel, tempVideoTrackAssignmentsNew)) {
                            console.error("Video label is already exist: " + tempVideoTrackAssignment.videoLabel);
                        } else {
                            tempVideoTrackAssignmentsNew.push(tempVideoTrackAssignment);
                        }

                    } else {
                        console.log("---> Removed video track assignment: " + tempVideoTrackAssignment.videoLabel);
                    }
                });

                tempVideoTrackAssignments = tempVideoTrackAssignmentsNew;

                //add and/or update participants according to current assignments
                videoTrackAssignmentList.forEach((vta) => {
                    tempVideoTrackAssignments.forEach((oldVTA) => {
                        if (oldVTA.videoLabel === vta.videoLabel) {
                            oldVTA.streamId = vta.trackId;
                        }
                    });
                });

                setVideoTrackAssignments(tempVideoTrackAssignments);

                checkScreenSharingStatus();

                setParticipantUpdated(!participantUpdated);
            } else if (eventType === "AUDIO_TRACK_ASSIGNMENT") {
                clearInterval(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    setTalkers([]);
                }, 1000);
                //console.log(JSON.stringify(notificationEvent.payload));
                setTalkers((oldTalkers) => {
                    const newTalkers = notificationEvent.payload
                        .filter((p) => p.trackId !== "" && p.audioLevel < 60)
                        .map((p) => p.trackId);
                    return _.isEqual(oldTalkers, newTalkers) ? oldTalkers : newTalkers;
                });
            } else if (eventType === "TRACK_LIST_UPDATED") {
                console.info("TRACK_LIST_UPDATED -> ", obj);

                webRTCAdaptor?.getBroadcastObject(roomName);
            }
        }
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
            playOnly: playOnly
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

        clearInterval(audioListenerIntervalJob);
        audioListenerIntervalJob = null;

        if (!playOnly) {
            webRTCAdaptor?.stop(publishStreamId);
        }
        webRTCAdaptor?.stop(roomName);

        if (!playOnly) {
            webRTCAdaptor?.turnOffLocalCamera(publishStreamId);
        }

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
            videoLabel: "localVideo", track: null, streamId: publishStreamId, isMine: true
        };

        let tempVideoTrackAssignments = [];
        if (!playOnly) {
            tempVideoTrackAssignments.push(newVideoTrackAssignment);
        }
        setVideoTrackAssignments(tempVideoTrackAssignments);

        let allParticipantsTemp = {};
        if (!playOnly) {
            allParticipantsTemp[publishStreamId] = {name: "You"};
        }
        setAllParticipants(allParticipantsTemp);
    }

    function addMeAsParticipant(publishStreamId) {
        let isParticipantExist = videoTrackAssignments.find((vta) => vta.label === "localVideo");

        if (isParticipantExist || playOnly) {
            return;
        }

        let newVideoTrackAssignment = {
            videoLabel: "localVideo", track: null, streamId: publishStreamId, isMine: true
        };
        let tempVideoTrackAssignments = videoTrackAssignments;
        tempVideoTrackAssignments.push(newVideoTrackAssignment);
        setVideoTrackAssignments(tempVideoTrackAssignments);

        let allParticipantsTemp = allParticipants;
        allParticipantsTemp[publishStreamId] = {
            streamId: publishStreamId, name: "You", isPinned: false, isScreenShared: false
        };
        setAllParticipants(allParticipantsTemp);
    }


    function handlePublish(publishStreamId, token, subscriberId, subscriberCode) {
        let userStatusMetadata = getUserStatusMetadata(isMyMicMuted, !isMyCamTurnedOff, isScreenShared);

        addMeAsParticipant(publishStreamId);

        let currentStreamName = streamName;
        if (streamName === "" || streamName === undefined || streamName === null) {
            currentStreamName = "Anonymous"
        }

        webRTCAdaptor?.publish(publishStreamId, token, subscriberId, subscriberCode, currentStreamName, roomName, JSON.stringify(userStatusMetadata));
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
                videoLabel: index, track: obj.track, streamId: obj.streamId
            };

            let tempVideoTrackAssignments = videoTrackAssignments;
            if (isVideoLabelExsist(newVideoTrackAssignment.videoLabel, tempVideoTrackAssignments)) {
                console.error("Video label is already exist: " + newVideoTrackAssignment.videoLabel);
            } else {
                tempVideoTrackAssignments.push(newVideoTrackAssignment);
            }
            setVideoTrackAssignments(tempVideoTrackAssignments);
        }
    }

    function isVideoLabelExsist(videoLabel, assignments) {
        let isExist = false;
        assignments.forEach((vta) => {
            if (vta.videoLabel === videoLabel) {
                isExist = true;
            }
        });
        return isExist;
    }

    function setAndEnableVirtualBackgroundImage(imageUrl) {
        let virtualBackgroundImage = document.createElement("img");
        virtualBackgroundImage.id = "virtualBackgroundImage";
        virtualBackgroundImage.style.visibility = "hidden";
        virtualBackgroundImage.alt = "virtual-background";

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

            webRTCAdaptor?.enableEffect(VideoEffect.VIRTUAL_BACKGROUND).then(() => {
                console.log("Effect: " + VideoEffect.VIRTUAL_BACKGROUND + " is enabled");
                setIsVideoEffectRunning(true);
            }).catch(err => {
                console.error("Effect: " + VideoEffect.VIRTUAL_BACKGROUND + " is not enabled. Error is " + err);
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
        webRTCAdaptor?.enableEffect(effectName).then(() => {
            console.log("Effect: " + effectName + " is enabled");
        }).catch(err => {
            console.error("Effect: " + effectName + " is not enabled. Error is " + err);
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

    function getSelectedDevices() {
        let devices = {
            videoDeviceId: selectedCamera, audioDeviceId: selectedMicrophone
        }
        return devices;
    }

    function setSelectedDevices(devices) {
        if (devices.videoDeviceId !== null && devices.videoDeviceId !== undefined) {
            setSelectedCamera(devices.videoDeviceId);
            localStorage.setItem("selectedCamera", devices.videoDeviceId);
        }
        if (devices.audioDeviceId !== null && devices.audioDeviceId !== undefined) {
            setSelectedMicrophone(devices.audioDeviceId);
            localStorage.setItem("selectedMicrophone", devices.audioDeviceId);
        }
    }

    function cameraSelected(value) {
        if (selectedCamera !== value) {
            setSelectedDevices({videoDeviceId: value});
            // When we first open home page, React will call this function and local stream is null at that time.
            // So, we need to catch the error.
            try {
                webRTCAdaptor?.switchVideoCameraCapture(publishStreamId, value);
            } catch (e) {
                console.log("Local stream is not ready yet.");
            }
        }
    }

    function microphoneSelected(value) {
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
    }

    function showReactions(streamId, reactionRequest) {
        let reaction = '😀';
        let streamName = '';

        if (reactions[reactionRequest] !== undefined) {
            reaction = reactions[reactionRequest];
        }

        if (streamId === publishStreamId) {
            streamName = 'You';
        } else if (allParticipants[streamId]?.name !== undefined) {
            streamName = allParticipants[streamId].name;
        }

        floating({
            content: '<div>' + reaction + '<br><span style="background-color: darkgray;color: white;padding: 1px 2px;text-align: center;border-radius: 5px;font-size: 0.675em;">' + streamName + '</span></div>',
            number: 1,
            duration: 5,
            repeat: 1,
            direction: 'normal',
            size: 2
        });
    }

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

    React.useEffect(() => {
        //gets the setting from the server through websocket
        if (isWebSocketConnected) {
            var jsCmd = {
                command: "getSettings",
            };
            sendMessage(JSON.stringify(jsCmd));
        }
    }, [isWebSocketConnected, sendMessage]);

    React.useEffect(() => {
        if (!latestMessage) {
            return;
        }
        var obj = JSON.parse(latestMessage);
        var definition;
        if (obj.command === "setSettings") {
            var localSettings = JSON.parse(obj.settings);
            console.log("--isRecordingFeatureAvailable: ", localSettings.isRecordingFeatureAvailable);
            setIsRecordPluginInstalled(localSettings.isRecordingFeatureAvailable);
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
                displayMessage("Recording cannot be stoped due to error: " + definition.message, "white")
            }
        }
    }, [latestMessage, publishStreamId, displayMessage, handleSendNotificationEvent, updateRoomRecordingStatus]);

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
                <ConferenceContext.Provider
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
                        handleSetMaxVideoTrackCount,
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
                        approvedSpeakerRequestList,
                        setApprovedSpeakerRequestList,
                        presenters,
                        setPresenters,
                        presenterButtonDisabled,
                        setPresenterButtonDisabled,
                        effectsDrawerOpen,
                        handleEffectsOpen,
                        setAndEnableVirtualBackgroundImage,
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
                        speedTestObject,
                        setSpeedTestObject,
                        speedTestStreamId,
                        startSpeedTest,
                        stopSpeedTest,
                        parseWebSocketURL,
                        createSpeedTestForPublishWebRtcAdaptorPlayOnly,
                        createSpeedTestForPublishWebRtcAdaptor,
                        createSpeedTestForPlayWebRtcAdaptor,
                        speedTestForPlayWebRtcAdaptorInfoCallback,
                        speedTestForPlayWebRtcAdaptorErrorCallback,
                        speedTestForPublishWebRtcAdaptorInfoCallback,
                        speedTestForPublishWebRtcAdaptorErrorCallback
                    }}
                >
                    {props.children}
                    <UnauthrorizedDialog
                        onClose={handleUnauthorizedDialogExitClicked}
                        open={unAuthorizedDialogOpen}
                        onExitClicked={handleUnauthorizedDialogExitClicked}

                    />

                    {isJoining ? (<Backdrop
                            sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
                            open={isJoining}
                            //onClick={handleClose}
                        >
                            <Grid container alignItems='center' justify='center' alignContent='center'>
                                <Grid item xs={12} align='center'>
                                    <CircularProgress/>
                                </Grid>
                                <Grid item xs={12} align='center'>
                                    {isNoSreamExist && isPlayOnly ? <Typography
                                        style={{color: theme.palette.themeColor10}}><b>{t("The room is currently empty.")}</b><br></br><b>{t("You will automatically join the room once it is ready.")}</b>
                                    </Typography> : <Typography
                                        style={{color: theme.palette.themeColor10}}><b>{t("Joining the room...")}</b></Typography>}
                                </Grid>
                            </Grid>
                        </Backdrop>) : null}

                    {isReconnectionInProgress ? (<Backdrop
                            sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
                            open={isReconnectionInProgress}
                            //onClick={handleClose}
                        >
                            <Grid container alignItems='center' justify='center' alignContent='center'>
                                <Grid item xs={12} align='center'>
                                    <CircularProgress/>
                                </Grid>
                                <Grid item xs={12} align='center'>
                                    <Typography
                                        style={{color: theme.palette.themeColor10}}><b>{t("Reconnecting...")}</b></Typography>
                                </Grid>
                            </Grid>
                        </Backdrop>) : null}

                    {screenSharingInProgress ? (<Backdrop
                            sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
                            open={screenSharingInProgress}
                            //onClick={handleClose}
                        >
                            <Grid container alignItems='center' justify='center' alignContent='center'>
                                <Grid item xs={12} align='center'>
                                    <CircularProgress/>
                                </Grid>
                                <Grid item xs={12} align='center'>
                                    <Typography
                                        style={{color: theme.palette.themeColor10}}><b>{t("Starting Screen Share...")}</b></Typography>
                                </Grid>
                            </Grid>
                        </Backdrop>) : null}

                    {leftTheRoom ? (
                        <LeftTheRoom withError={leaveRoomWithError}/>) : waitingOrMeetingRoom === "waiting" ? (
                        <WaitingRoom/>) : (<>
                            <MeetingRoom/>
                            <MessageDrawer/>
                            <ParticipantListDrawer/>
                            <EffectsDrawer/>
                        </>)}
                </ConferenceContext.Provider>
            </Grid>
        </Grid>);
}

export default AntMedia;
