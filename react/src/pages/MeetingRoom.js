/* eslint-disable react-hooks/exhaustive-deps */
import VideoCard from "Components/Cards/VideoCard";
import React from "react";
import Footer from "Components/Footer/Footer";
import {ConferenceContext} from "./AntMedia";
import LayoutPinned from "./LayoutPinned";
import LayoutTiled from "./LayoutTiled";
import {ReactionBarSelector} from "@charkour/react-reactions";
import MuteParticipantDialog from "../Components/MuteParticipantDialog";
import {useTheme} from "@mui/material/styles";
import {t} from "i18next";


function debounce(fn, ms) {
  let timer;
  return (_) => {
    clearTimeout(timer);
    timer = setTimeout((_) => {
      timer = null;
      fn.apply(this, arguments);
    }, ms);
  };
}


const MeetingRoom = React.memo((props) => {
  const conference = React.useContext(ConferenceContext)
  const [gallerySize, setGallerySize] = React.useState({"w": 100, "h": 100});

  const theme = useTheme();

  React.useEffect(() => {
    handleGalleryResize(false);
    window.conference = conference;

  }, [conference.participants, conference.pinnedVideoId, conference.participantUpdated]);

  React.useEffect(() => {
    handleGalleryResize(true);
  }, [conference.messageDrawerOpen, conference.participantListDrawerOpen]);

  React.useEffect(() => {
    const debouncedHandleResize = debounce(handleGalleryResize, 500);
    window.addEventListener("resize", debouncedHandleResize);

    return (_) => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  });

  function sendEmoji(emoji) {
    conference?.sendReactions(emoji);
    conference.setShowEmojis(!conference.showEmojis);
  }

  const reactionList = [
    {label: t("Love It"), node: <div>💖</div>, key: "sparkling_heart"},
    {label: t("Like"), node: <div>👍🏼</div>, key: "thumbs_up"},
    {label: t("Tada"), node: <div>🎉</div>, key: "party_popper"},
    {label: t("Applause"), node: <div>👏🏼</div>, key: "clapping_hands"},
    {label: t("Haha"), node: <div>😂</div>, key: "face_with_tears_of_joy"},
    {label: t("Surprised"), node: <div>😮</div>, key: "open_mouth"},
    {label: t("Sad"), node: <div>😢</div>, key: "sad_face"},
    {label: t("Thinking"), node: <div>🤔</div>, key: "thinking_face"},
    {label: t("Dislike"), node: <div>👎🏼</div>, key: "thumbs_down"}
  ];

  function handleGalleryResize(calcDrawer) {

    const gallery = document.getElementById("meeting-gallery");

    if (gallery) {
      if (calcDrawer) {
        if (conference.messageDrawerOpen || conference.participantListDrawerOpen) {
          gallery.classList.add("drawer-open");
        } else {
          gallery.classList.remove("drawer-open");
        }
      }
      const screenWidth = gallery.getBoundingClientRect().width;
      const screenHeight = gallery.getBoundingClientRect().height;

      setGallerySize({"w": screenWidth, "h": screenHeight});
    }
  }

  const pinLayout = conference.pinnedVideoId !== undefined;
  return (
    <>
      <MuteParticipantDialog/>
      {conference.audioTracks.map((audio, index) => (
        <VideoCard
          key={index}
          id={audio.streamId}
          track={audio.track}
          autoPlay
          name={""}
          style={{display: "none"}}
        />
      ))}
      <div id="meeting-gallery" style={{height: "calc(100vh - 80px)"}}>
        <>
          {pinLayout ?
            (<LayoutPinned
              width={gallerySize.w}
              height={gallerySize.h}
            />)
            :
            (<LayoutTiled
              width={gallerySize.w}
              height={gallerySize.h}
            />)
          }
        </>
      </div>

      {conference.showEmojis && (
        <div id="meeting-reactions" style={{
          position: "fixed",
          bottom: 80,
          display: "flex",
          alignItems: "center",
          padding: 16,
          zIndex: 666,
          height: 46,
        }}>
          <ReactionBarSelector reactions={reactionList} iconSize={32}
                               style={{backgroundColor: theme.palette.themeColor[70]}} onSelect={sendEmoji}/>
        </div>)
      }
      <Footer {...props} />
    </>
  )
});

export default MeetingRoom;
