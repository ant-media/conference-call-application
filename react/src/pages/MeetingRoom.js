/* eslint-disable react-hooks/exhaustive-deps */
import VideoCard from "Components/Cards/VideoCard";
import React, { useEffect } from "react";
import Footer from "Components/Footer/Footer";
import { ConferenceContext } from "./AntMedia";
import LayoutPinned from "./LayoutPinned";
import LayoutTiled from "./LayoutTiled";


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

      console.log("***** gallerySize:"+gallerySize.w+"-"+gallerySize.h);
    }
  }

  const pinLayout = conference.pinnedVideoId !== null ? true : false;
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
            }
            </>
          </div>
          <Footer {...props} />
        </>
    )
});

export default MeetingRoom;
