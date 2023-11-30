/* eslint-disable react-hooks/exhaustive-deps */
import VideoCard from "Components/Cards/VideoCard";
import React from "react";
import Footer from "Components/Footer/Footer";
import { ConferenceContext } from "./AntMedia";
import LayoutPinned from "./LayoutPinned";
import LayoutTiled from "./LayoutTiled";
import {ReactionBarSelector} from "@charkour/react-reactions";


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
  const [gallerySize, setGallerySize] = React.useState({"w":100, "h":100});

  React.useEffect(() => {
    handleGalleryResize(false);
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
      {label: "Love It", node: <div>💖</div>, key: "sparkling_heart"},
      {label: "Like", node: <div>👍🏼</div>, key: "thumbs_up"},
      {label: "Tada", node: <div>🎉</div>, key: "party_popper"},
      {label: "Applause", node: <div>👏🏼</div>, key: "clapping_hands"},
      {label: "Haha", node: <div>😂</div>, key: "face_with_tears_of_joy"},
      {label: "Surprised", node: <div>😮</div>, key: "open_mouth"},
      {label: "Sad", node: <div>😢</div>, key: "sad_face"},
      {label: "Thinking", node: <div>🤔</div>, key: "thinking_face"},
      {label: "Dislike", node: <div>👎🏼</div>, key: "thumbs_down"}
    ];

  function handleGalleryResize(calcDrawer) {
    
    const gallery = document.getElementById("meeting-gallery");

    if(gallery) {
      if (calcDrawer) {
        if (conference.messageDrawerOpen || conference.participantListDrawerOpen) {
          gallery.classList.add("drawer-open");
        } else {
          gallery.classList.remove("drawer-open");
        }
      }
      const screenWidth = gallery.getBoundingClientRect().width;
      const screenHeight = gallery.getBoundingClientRect().height;
  
      setGallerySize({"w":screenWidth, "h":screenHeight});

      //console.log("***** gallerySize:"+gallerySize.w+"-"+gallerySize.h);
    }
  }

  const pinLayout = conference.pinnedVideoId !== undefined ? true : false;
  return (
        <>
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
                width = {gallerySize.w}
                height = {gallerySize.h}
              />)
            :
              (<LayoutTiled
                width = {gallerySize.w}
                height = {gallerySize.h}
              />)  
            }ß
            </>
          </div>

          {conference.showEmojis && (
            <div id="meeting-reactions" style={{
              position: "fixed",
              bottom: 80,
              display: "flex",
              alignItems: "center",
              padding: 16,
              zIndex: 2,
              height: 46,
              }}>
              <ReactionBarSelector reactions={reactionList} iconSize={32} style={{backgroundColor: "#003935"}} onSelect={sendEmoji} />
            </div>)
          }
          <Footer {...props} />
        </>
    )
});

export default MeetingRoom;
