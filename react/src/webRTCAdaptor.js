/* eslint-disable eqeqeq */
import { WebRTCAdaptor } from "./antmedia/webrtc_adaptor.js"
import { getUrlParameter } from "./antmedia/fetch.stream.js"

/**
* This page accepts 3 arguments through url parameter
* 1. "streamId": the stream id to publish stream. It's optional. ?streamId=stream1
* 2. "playOnly": If it's true, user does not publish stream. It only play streams in the room.
* 3. "token": It's experimental. 
*/

var token = getUrlParameter("token");
var streamId = getUrlParameter("streamId");
var playOnly = getUrlParameter("playOnly");
if (playOnly == null) {
    playOnly = false;
}

var volume_change_input = document.getElementById("volume_change_input");
volume_change_input.addEventListener("change", changeVolume);

function changeVolume() {
    /**
          * Change the gain levels on the input selector.
          */
    if (document.getElementById('volume_change_input') != null) {
        webRTCAdaptor.currentVolume = this.value;
        if (webRTCAdaptor.soundOriginGainNode != null) {
            webRTCAdaptor.soundOriginGainNode.gain.value = this.value; // Any number between 0 and 1.
        }

        if (webRTCAdaptor.secondStreamGainNode != null) {
            webRTCAdaptor.secondStreamGainNode.gain.value = this.value; // Any number between 0 and 1.
        }
    }
}

var join_publish_button = document.getElementById("join_publish_button");
join_publish_button.addEventListener("click", joinRoom, false);
var stop_publish_button = document.getElementById("stop_publish_button");
stop_publish_button.addEventListener("click", leaveRoom, false);
var turn_off_camera_button = document.getElementById("turn_off_camera_button");
turn_off_camera_button.addEventListener("click", turnOffLocalCamera, false)
var turn_on_camera_button = document.getElementById("turn_on_camera_button");
turn_on_camera_button.addEventListener("click", turnOnLocalCamera, false)
var mute_mic_button = document.getElementById("mute_mic_button");
mute_mic_button.addEventListener("click", muteLocalMic, false)
var unmute_mic_button = document.getElementById("unmute_mic_button");
unmute_mic_button.addEventListener("click", unmuteLocalMic, false)
var mcuChbx = document.getElementById("enableMCU");

var dominantSpeakerFinderId = null;
var checkSpeakingStreamIds = new Array();

//Handles radio buttons for screen share feature
if (document.querySelector('input[name="videoSource"]')) {
    document.querySelectorAll('input[name="videoSource"]').forEach((elem) => {
        elem.addEventListener("change", function (event) {
            var item = event.target;
            switchVideoMode(item)
        });
    });
}

var mutedAlertPresent = false;
// $("#notification").append('Are you talking? Microphone is muted');

var roomNameBox = document.getElementById("roomName");

var roomOfStream = new Array();
var streamsList = new Array();

var publishStreamId;
var isDataChannelOpen = false;
var isMicMuted = false;
var isCameraOff = false;
var roomTimerId = -1;

function switchVideoMode(chbx) {
    if (chbx.value == "screen") {
        webRTCAdaptor.switchDesktopCapture(publishStreamId);
    }
    else if (chbx.value == "screen+camera") {
        webRTCAdaptor.switchDesktopCaptureWithCamera(publishStreamId);
    }
    else {
        webRTCAdaptor.switchVideoCameraCapture(publishStreamId);
    }
}

function turnOffLocalCamera() {
    webRTCAdaptor.turnOffLocalCamera(publishStreamId);
    isCameraOff = true;
    handleCameraButtons();
    sendNotificationEvent("CAM_TURNED_OFF");
}

function turnOnLocalCamera() {
    webRTCAdaptor.turnOnLocalCamera(publishStreamId);
    isCameraOff = false;
    handleCameraButtons();
    sendNotificationEvent("CAM_TURNED_ON");
}

function muteLocalMic() {
    webRTCAdaptor.muteLocalMic();
    isMicMuted = true;
    handleMicButtons();
    sendNotificationEvent("MIC_MUTED");
    webRTCAdaptor.enableAudioLevelWhenMuted()
}

function unmuteLocalMic() {
    webRTCAdaptor.unmuteLocalMic();
    isMicMuted = false;
    handleMicButtons();
    sendNotificationEvent("MIC_UNMUTED");
    webRTCAdaptor.disableAudioLevelWhenMuted();
}

function sendNotificationEvent(eventType) {
    if (isDataChannelOpen) {
        var notEvent = { streamId: publishStreamId, eventType: eventType };

        webRTCAdaptor.sendData(publishStreamId, JSON.stringify(notEvent));
    } else {
        console.log("Could not send the notification because data channel is not open.");
    }
}

function handleCameraButtons() {
    if (isCameraOff) {
        turn_off_camera_button.disabled = true;
        turn_on_camera_button.disabled = false;
    } else {
        turn_off_camera_button.disabled = false;
        turn_on_camera_button.disabled = true;
    }
}

function handleMicButtons() {
    if (isMicMuted) {
        mute_mic_button.disabled = true;
        unmute_mic_button.disabled = false;
    } else {
        mute_mic_button.disabled = false;
        unmute_mic_button.disabled = true;
    }
}
function findDominantSpeaker(streamSoundList) {
    var tmpMax = 0;
    var tmpStreamId = null;
    var threshold = 0.01;

    for (let i = 0; i < streamsList.length; i++) {
        let nextStreamId = streamsList[i];
        let tmpValue = streamSoundList[nextStreamId]
        if (tmpValue > threshold) {
            if (tmpValue > tmpMax) {
                tmpMax = tmpValue;
                tmpStreamId = nextStreamId;
            }
        }
    }
    if (tmpStreamId != null) {
        if (checkSpeakingStreamIds[tmpStreamId] == null || typeof checkSpeakingStreamIds[tmpStreamId] == "undefined") {
            var icon = document.getElementById("audio" + tmpStreamId);
            icon.style.visibility = "visible";
            checkSpeakingStreamIds[tmpStreamId] = true;
            setTimeout(() => {
                var icon = document.getElementById("audio" + tmpStreamId);
                icon.style.visibility = "hidden";
                checkSpeakingStreamIds[tmpStreamId] = null;
            }, 1000)
        }
    }
}

function handleNotificationEvent(obj) {
    console.log("Received data : ", obj.data);
    var notificationEvent = JSON.parse(obj.data);
    if (notificationEvent != null && typeof (notificationEvent) == "object") {
        var eventStreamId = notificationEvent.streamId;
        var eventTyp = notificationEvent.eventType;

        if (eventTyp == "CAM_TURNED_OFF") {
            console.log("Camera turned off for : ", eventStreamId);
        } else if (eventTyp == "CAM_TURNED_ON") {
            console.log("Camera turned on for : ", eventStreamId);
        } else if (eventTyp == "MIC_MUTED") {
            console.log("Microphone muted for : ", eventStreamId);
        } else if (eventTyp == "MIC_UNMUTED") {
            console.log("Microphone unmuted for : ", eventStreamId);
        }
    }
}

function joinRoom() {
    var mode = mcuChbx.checked ? "mcu" : "legacy";
    webRTCAdaptor.joinRoom(roomNameBox.value, streamId, mode);
}

function leaveRoom() {
    webRTCAdaptor.leaveFromRoom(roomNameBox.value);

    for (var node in document.getElementById("players").childNodes) {
        if (node.tagName == 'DIV' && node.id != "localVideo") {
            document.getElementById("players").removeChild(node);
        }
    }
}

function publish(streamName, token) {
    publishStreamId = streamName;
    webRTCAdaptor.publish(streamName, token);
}

function streamInformation(obj) {
    webRTCAdaptor.play(obj.streamId, token, roomNameBox.value);
}

function playVideo(obj) {
    var room = roomOfStream[obj.streamId];
    console.log("new stream available with id: "
        + obj.streamId + "on the room:" + room);

    var video = document.getElementById("remoteVideo" + obj.streamId);

    if (video == null) {
        createRemoteVideo(obj.streamId);
        video = document.getElementById("remoteVideo" + obj.streamId);
    }

    video.srcObject = obj.stream;

    webRTCAdaptor.enableAudioLevel(obj.stream, obj.streamId)
}

function createRemoteVideo(streamId) {
    var player = document.createElement("div");
    player.className = "col-sm-3";
    player.id = "player" + streamId;
    player.innerHTML = '<img id="audio' + streamId + '"src="images/audio.png" style="visibility: hidden;"></image>' + '<video id="remoteVideo' + streamId + '"controls autoplay playsinline></video>';
    document.getElementById("players").appendChild(player);
}

function removeRemoteVideo(streamId) {
    var video = document.getElementById("remoteVideo" + streamId);
    if (video != null) {
        var player = document.getElementById("player" + streamId);
        video.srcObject = null;
        document.getElementById("players").removeChild(player);
    }
    webRTCAdaptor.stop(streamId);
    streamsList = streamsList.filter(item => item !== streamId);
}

function checkVideoTrackStatus(streamsList) {
    streamsList.forEach(function (item) {
        var video = document.getElementById("remoteVideo" + item);
        if (video != null && !video.srcObject.active) {
            removeRemoteVideo(item);
            playVideo(item);
        }
    });
}

// function startAnimation() {

//     $("#broadcastingInfo")
//         .fadeIn(
//             800,
//             function () {
//                 $("#broadcastingInfo")
//                     .fadeOut(
//                         800,
//                         function () {
//                             var state = webRTCAdaptor
//                                 .signallingState(publishStreamId);
//                             if (state != null
//                                 && state != "closed") {
//                                 var iceState = webRTCAdaptor
//                                     .iceConnectionState(publishStreamId);
//                                 if (iceState != null
//                                     && iceState != "failed"
//                                     && iceState != "disconnected") {
//                                     startAnimation();
//                                 }
//                             }
//                         });
//             });

// }
var pc_config = {
    'iceServers': [{
        'urls': 'stun:stun1.l.google.com:19302'
    }]
};

var sdpConstraints = {
    OfferToReceiveAudio: false,
    OfferToReceiveVideo: false

};

var mediaConstraints = {
    video: true,
    audio: true
};
var websocketURL = "wss://meet.antmedia.io:5443/WebRTCAppEE/websocket"


export const webRTCAdaptor = new WebRTCAdaptor(
    {
        websocket_url: websocketURL,
        mediaConstraints: mediaConstraints,
        peerconnection_config: pc_config,
        sdp_constraints: sdpConstraints,
        localVideoId: "localVideo",
        isPlayMode: playOnly,
        debug: true,
        dataChannelEnabled: true,
        callback: (info, obj) => {
            if (info == "initialized") {
                console.log("initialized");
                join_publish_button.disabled = false;
                stop_publish_button.disabled = true;
                if (playOnly) {
                    isCameraOff = true;
                    handleCameraButtons();
                }
            }
            else if (info == "joinedTheRoom") {
                var room = obj.ATTR_ROOM_NAME;
                roomOfStream[obj.streamId] = room;
                console.log("joined the room: "
                    + roomOfStream[obj.streamId]);
                console.log(obj)

                publishStreamId = obj.streamId

                if (playOnly) {
                    join_publish_button.disabled = true;
                    stop_publish_button.disabled = false;
                    isCameraOff = true;
                    handleCameraButtons();
                }
                else {
                    publish(obj.streamId, token);
                }

                if (obj.streams != null) {
                    obj.streams.forEach(function (item) {
                        console.log("Stream joined with ID: " + item);
                        webRTCAdaptor.play(item, token,
                            roomNameBox.value);
                    });
                    streamsList = obj.streams;
                }
                roomTimerId = setInterval(() => {
                    webRTCAdaptor.getRoomInfo(roomNameBox.value, publishStreamId);
                }, 5000);

                if (streamsList.length > 0) {
                    dominantSpeakerFinderId = setInterval(() => {
                        webRTCAdaptor.getSoundLevelList(streamsList);
                    }, 200);
                }
            }
            else if (info == "newStreamAvailable") {
                playVideo(obj);
                if (dominantSpeakerFinderId == null) {
                    dominantSpeakerFinderId = setInterval(() => {
                        webRTCAdaptor.getSoundLevelList(streamsList);
                    }, 200);
                }
            }
            else if (info == "publish_started") {
                //stream is being published
                console.debug("publish started to room: "
                    + roomOfStream[obj.streamId]);
                join_publish_button.disabled = true;
                stop_publish_button.disabled = false;
                // startAnimation();
            }
            else if (info == "publish_finished") {
                //stream is being finished
                console.debug("publish finished");
            }
            else if (info == "screen_share_stopped") {
                console.log("screen share stopped");
            }
            else if (info == "gotSoundList") {
                findDominantSpeaker(obj);
            }
            else if (info == "browser_screen_share_supported") {
                // screen_share_checkbox.disabled = false;
                // camera_checkbox.disabled = false;
                // screen_share_with_camera_checkbox.disabled = false;
                console.log("browser screen share supported");
                // browser_screen_share_doesnt_support.style.display = "none";
            }
            else if (info == "leavedFromRoom") {
                var room = obj.ATTR_ROOM_NAME;
                console.debug("leaved from the room:" + room);
                if (roomTimerId != null) {
                    clearInterval(roomTimerId);
                    clearInterval(dominantSpeakerFinderId);
                }
                dominantSpeakerFinderId = null;

                join_publish_button.disabled = false;
                stop_publish_button.disabled = true;

                if (streamsList != null) {
                    streamsList.forEach(function (item) {
                        removeRemoteVideo(item);
                    });
                }
                // we need to reset streams list
                streamsList = new Array();
            }
            else if (info == "closed") {
                //console.log("Connection closed");
                if (typeof obj != "undefined") {
                    console.log("Connecton closed: "
                        + JSON.stringify(obj));
                }
            }
            else if (info == "play_finished") {
                console.log("play_finished");
                removeRemoteVideo(obj.streamId);
            }
            else if (info == "streamInformation") {
                streamInformation(obj);
            }
            else if (info == "roomInformation") {
                //Checks if any new stream has added, if yes, plays.
                for (let str of obj.streams) {
                    if (!streamsList.includes(str)) {
                        webRTCAdaptor.play(str, token,
                            roomNameBox.value);
                    }
                }
                // Checks if any stream has been removed, if yes, removes the view and stops webrtc connection.
                for (let str of streamsList) {
                    if (!obj.streams.includes(str)) {
                        removeRemoteVideo(str);
                    }
                }
                //Lastly updates the current streamlist with the fetched one.
                streamsList = obj.streams;

                //Check video tracks active/inactive status
                checkVideoTrackStatus(streamsList);
            }
            else if (info == "data_channel_opened") {
                console.log("Data Channel open for stream id", obj);
                isDataChannelOpen = true;
            }
            else if (info == "data_channel_closed") {
                console.log("Data Channel closed for stream id", obj);
                isDataChannelOpen = false;
            }
            else if (info == "data_received") {
                handleNotificationEvent(obj);
            }
            else if (info == "speaking_but_muted") {
                if (!mutedAlertPresent) {
                    mutedAlertPresent = true
                    // $("#notification").fadeIn("slow");
                    // $(".dismiss").click(function () {
                    //     $("#notification").fadeOut("slow");
                    //     mutedAlertPresent = false;
                    // });

                    // setTimeout(() => {
                    //     $("#notification").fadeOut("slow");
                    //     mutedAlertPresent = false;
                    // }, 3000)
                }
            }
            else if (info == "session_restored") {
                handleCameraButtons();
                // startAnimation();
                console.log(info + "notification received");
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
                errorMessage = "Camera or Mic are not found or not allowed in your device.";
            } else if (error.indexOf("NotReadableError") != -1
                || error.indexOf("TrackStartError") != -1) {
                errorMessage = "Camera or Mic is being used by some other process that does not not allow these devices to be read.";
            } else if (error.indexOf("OverconstrainedError") != -1
                || error.indexOf("ConstraintNotSatisfiedError") != -1) {
                errorMessage = "There is no device found that fits your video and audio constraints. You may change video and audio constraints."
            } else if (error.indexOf("NotAllowedError") != -1
                || error.indexOf("PermissionDeniedError") != -1) {
                errorMessage = "You are not allowed to access camera and mic.";
                // screen_share_checkbox.checked = false;
                // camera_checkbox.checked = false;
            } else if (error.indexOf("TypeError") != -1) {
                errorMessage = "Video/Audio is required.";
            } else if (error.indexOf("UnsecureContext") != -1) {
                errorMessage = "Fatal Error: Browser cannot access camera and mic because of unsecure context. Please install SSL and access via https";
            } else if (error.indexOf("WebSocketNotSupported") != -1) {
                errorMessage = "Fatal Error: WebSocket not supported in this browser";
            } else if (error.indexOf("no_stream_exist") != -1) {
                //TODO: removeRemoteVideo(error.streamId);
            } else if (error.indexOf("data_channel_error") != -1) {
                errorMessage = "There was a error during data channel communication";
            } else if (error.indexOf("ScreenSharePermissionDenied") != -1) {
                errorMessage = "You are not allowed to access screen share";
                // screen_share_checkbox.checked = false;
                // camera_checkbox.checked = true;
            }

            alert(errorMessage);
        }
    });