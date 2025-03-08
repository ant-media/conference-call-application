import { useState, useRef, useCallback, useEffect } from 'react';
import { WebRTCAdaptor } from '@antmedia/webrtc_adaptor';

export default function useSpeedTest(props) {
  const {
    websocketURL,
    peerconnection_config,
    token,
    subscriberId,
    subscriberCode,
    isPlayOnly
  } = props;

  const [speedTestInProgress, setSpeedTestInProgress] = useState(false);

  const speedTestProgress = useRef(0);
  const speedTestForPublishWebRtcAdaptor = useRef(null);
  const speedTestForPlayWebRtcAdaptor = useRef(null);
  const speedTestStreamId = useRef(Date.now());
  const speedTestCounter = useRef(0);
  const speedTestPlayStarted = useRef(false);
  const statsList = useRef([]);
  const playStatsList = useRef([]);
  const [speedTestObject, setSpeedTestObject] = useState({
    message: "Please wait while we are testing your connection speed",
    isfinished: false,
    isfailed: false,
    errorMessage: "",
    progressValue: 10
});

  const startSpeedTest = useCallback(() => {
    console.log("Starting speed test");
    if (!speedTestInProgress) {
      setSpeedTestInProgress(true);
      speedTestStreamId.current = Date.now();
      
      if (isPlayOnly === "true" || isPlayOnly === true) {
        createSpeedTestForPlayWebRtcAdaptor();
      } else {
        createSpeedTestForPublishWebRtcAdaptor();
      }
      
      // Set a timeout to handle stuck tests
      setTimeout(() => {
        if (speedTestProgress < 40) {
          // It means that it's stuck before publish started
          stopSpeedTest();
          setSpeedTestObjectFailed("Speed test failed. It may be due to firewall, wi-fi or network restrictions. Change your network or Try again");
        }
      }, 15000);
    }
  }, [speedTestInProgress, isPlayOnly]);

  const stopSpeedTest = useCallback(() => {
    if (speedTestForPublishWebRtcAdaptor.current !== null) {
      speedTestForPublishWebRtcAdaptor.current.stop("speedTestStream" + speedTestStreamId.current);
      speedTestForPublishWebRtcAdaptor.current.closeStream();
      speedTestForPublishWebRtcAdaptor.current.closeWebSocket();
    }

    if (speedTestForPlayWebRtcAdaptor.current !== null) {
      speedTestForPlayWebRtcAdaptor.current.stop("speedTestSampleStream");
      speedTestForPlayWebRtcAdaptor.current.closeWebSocket();
    }

    speedTestForPublishWebRtcAdaptor.current = null;
    speedTestForPlayWebRtcAdaptor.current = null;

    setSpeedTestInProgress(false);
    speedTestProgress.current = 0;
  }, []);

  const setSpeedTestObjectProgress = useCallback((progressValue) => {
    // if progress value is more than 100, it means that speed test is failed, and we can not get or set the stat list properly
    console.log("setSpeedTestObjectProgress is called");
    console.log("progressValue: ", progressValue);

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
  }, []);

  const setSpeedTestObjectFailed = useCallback((errorMessage) => {
    console.error("Speed test failed: ", errorMessage);
    setSpeedTestInProgress(false);
    speedTestProgress.current = 0;

    setSpeedTestObject({
      message: errorMessage,
      isfinished: false,
      isfailed: true,
      errorMessage: errorMessage,
      progressValue: 0
    });
  }, []);

  const createSpeedTestForPublishWebRtcAdaptor = useCallback(() => {
    speedTestForPublishWebRtcAdaptor.current = new WebRTCAdaptor({
      websocket_url: websocketURL,
      mediaConstraints: { video: true, audio: false },
      sdp_constraints: {
        OfferToReceiveAudio: false, 
        OfferToReceiveVideo: false,
      },
      peerconnection_config: peerconnection_config,
      debug: true,
      callback: speedTestForPublishWebRtcAdaptorInfoCallback,
      callbackError: speedTestForPublishWebRtcAdaptorErrorCallback,
      purposeForTest: "publish-speed-test"
    });
  }, [websocketURL, peerconnection_config]);

  const speedTestForPublishWebRtcAdaptorInfoCallback = useCallback((info, obj) => {
    if (info === "initialized") {
      speedTestCounter.current = 0;
      setSpeedTestObjectProgress(10);
      speedTestForPublishWebRtcAdaptor.current.publish(
        "speedTestStream" + speedTestStreamId.current, 
        token, 
        subscriberId, 
        subscriberCode,
        "speedTestStream" + speedTestStreamId.current, 
        "", 
        ""
      );
    }
    else if (info === "publish_started") {
      speedTestCounter.current = 0;
      console.log("speed test publish started");
      setSpeedTestObjectProgress(20);
      speedTestForPublishWebRtcAdaptor.current.enableStats("speedTestStream" + speedTestStreamId.current);
    }
    else if (info === "updated_stats") {
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
        let tempSpeedTestObject = {};
        tempSpeedTestObject.message = speedTestObject.message;
        tempSpeedTestObject.isfinished = false;
        tempSpeedTestObject.isfailed = false;
        tempSpeedTestObject.errorMessage = "";
        tempSpeedTestObject.progressValue = 20 + (speedTestCounter.current * 20);
      }
    }
    else if (info === "ice_connection_state_changed") {
      console.log("speed test ice connection state changed");
    }
  }, [token, subscriberId, subscriberCode]);

  const setAndFillPublishStatsList = useCallback((obj) => {
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
  }, []);

  const calculateThePublishSpeedTestResult = useCallback(() => {
    if (statsList.current.length === 0) {
      setSpeedTestObjectFailed("No stats received");
      return;
    }
    
    let updatedStats = {};

    console.log("Calculating publish speed test result");

    updatedStats.videoRoundTripTime = parseFloat(statsList.current[statsList.current.length - 1].videoRoundTripTime); // we can use the last value
    updatedStats.videoRoundTripTime = (updatedStats.videoRoundTripTime === -1) ? 0 : updatedStats.videoRoundTripTime;

    updatedStats.audioRoundTripTime = parseFloat(statsList.current[statsList.current.length - 1].audioRoundTripTime); // we can use the last value
    updatedStats.audioRoundTripTime = (updatedStats.audioRoundTripTime === -1) ? 0 : updatedStats.audioRoundTripTime;

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

    updatedStats.videoJitter = (parseFloat(statsList.current[statsList.current.length - 1].videoJitter) + parseFloat(statsList.current[statsList.current.length - 2].videoJitter)) / 2.0;
    updatedStats.videoJitter = (updatedStats.videoJitter === -1) ? 0 : updatedStats.videoJitter;

    updatedStats.audioJitter = (parseFloat(statsList.current[statsList.current.length - 1].audioJitter) + parseFloat(statsList.current[statsList.current.length - 2].audioJitter)) / 2.0;
    updatedStats.audioJitter = (updatedStats.audioJitter === -1) ? 0 : updatedStats.audioJitter;

    updatedStats.currentOutgoingBitrate = parseInt(statsList.current[statsList.current.length - 1].currentOutgoingBitrate); // we can use the last value
    updatedStats.currentOutgoingBitrate = (updatedStats.currentOutgoingBitrate === -1) ? 0 : updatedStats.currentOutgoingBitrate;

    let rtt = ((parseFloat(updatedStats.videoRoundTripTime) + parseFloat(updatedStats.audioRoundTripTime)) / 2).toPrecision(3);
    let packetLost = parseInt(updatedStats.videoPacketsLost) + parseInt(updatedStats.audioPacketsLost);
    let packetLostPercentage = ((updatedStats.videoPacketsLost + updatedStats.audioPacketsLost) / (updatedStats.totalVideoPacketsSent + updatedStats.totalAudioPacketsSent)) * 100;
    let jitter = ((parseFloat(updatedStats.videoJitter) + parseInt(updatedStats.audioJitter)) / 2).toPrecision(3);
    let outgoingBitrate = parseInt(updatedStats.currentOutgoingBitrate);
    let bandwidth = speedTestForPublishWebRtcAdaptor.current?.mediaManager?.bandwidth ? parseInt(speedTestForPublishWebRtcAdaptor.current.mediaManager.bandwidth) : 0;
    
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
    
    speedTestProgress.current = 100;
    setSpeedTestObject(speedTestResult);
    stopSpeedTest();
  }, []);

  const speedTestForPublishWebRtcAdaptorErrorCallback = useCallback((error, message) => {
    console.error("Error in speed test publish: ", error, message);
    setSpeedTestObjectFailed("There is an error('" + error + "'). Please try again later...");
    stopSpeedTest();
  }, []);

  const createSpeedTestForPlayWebRtcAdaptor = useCallback(() => {
    speedTestPlayStarted.current = false;
    speedTestForPlayWebRtcAdaptor.current = new WebRTCAdaptor({
      websocket_url: websocketURL,
      mediaConstraints: { video: false, audio: false },
      playOnly: true,
      sdp_constraints: {
        OfferToReceiveAudio: false, 
        OfferToReceiveVideo: false,
      },
      peerconnection_config: peerconnection_config,
      debug: true,
      callback: speedTestForPlayWebRtcAdaptorInfoCallback,
      callbackError: speedTestForPlayWebRtcAdaptorErrorCallback,
      purposeForTest: "play-speed-test"
    });
  }, [websocketURL, peerconnection_config]);

  const speedTestForPlayWebRtcAdaptorInfoCallback = useCallback((info, obj) => {
    if (info === "initialized") {
      speedTestPlayStarted.current = false;
      speedTestForPlayWebRtcAdaptor.current.play("speedTestSampleStream", "", "", [], "", "", "");
    } else if (info === "play_started") {
      console.log("speed test play started");
      speedTestPlayStarted.current = true;
      setSpeedTestObjectProgress(20);
      speedTestForPlayWebRtcAdaptor.current?.enableStats("speedTestSampleStream");
    }
    else if (info === "updated_stats") {
      processUpdatedStatsForPlaySpeedTest(obj);
    } else if (info === "ice_connection_state_changed") {
      console.log("speed test ice connection state changed");
    }
  }, []);

  const speedTestForPlayWebRtcAdaptorErrorCallback = useCallback((error, message) => {
    console.error("Error in speed test play: ", error, message);
    setSpeedTestObjectFailed("There is an error('" + error + "'). Please try again later...");
    stopSpeedTest();
  }, []);

  const processUpdatedStatsForPlaySpeedTest = useCallback((statsObj) => {
    if (speedTestCounter.current === 0) {
      statsList.current = []; // reset stats list if it is the first time
    }
    setSpeedTestObjectProgress(20 + (speedTestCounter.current * 20));

    speedTestCounter.current = speedTestCounter.current + 1;
    setAndFillPlayStatsList(statsObj);

    if (speedTestCounter.current > 3 && statsList.current.length > 3) {
      calculateThePlaySpeedTestResult();
    } else {
      setSpeedTestObjectProgress(20 + (speedTestCounter.current * 20));
        let tempSpeedTestObject = {};
        tempSpeedTestObject.message = speedTestObject.message;
        tempSpeedTestObject.isfinished = false;
        tempSpeedTestObject.isfailed = false;
        tempSpeedTestObject.errorMessage = "";
        tempSpeedTestObject.progressValue = 20 + (speedTestCounter.current * 20);
        speedTestProgress.current = tempSpeedTestObject.progressValue;
        setSpeedTestObject(tempSpeedTestObject);
    }
  }, []);

  const setAndFillPlayStatsList = useCallback((obj) => {
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
  }, []);

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
    speedTestProgress.current = 100;
    setSpeedTestObject(speedTestResult);

    stopSpeedTest();
}
  return {
    startSpeedTest,
    stopSpeedTest,
    speedTestInProgress,
    speedTestProgress,
    speedTestStreamId,
    speedTestObject,
    setSpeedTestObject,
    setAndFillPlayStatsList,
    setAndFillPublishStatsList,
    speedTestCounter,
    statsList,
    calculateThePlaySpeedTestResult,
    processUpdatedStatsForPlaySpeedTest,
    setSpeedTestObjectFailed,
    setSpeedTestObjectProgress,
  };
} 