/* eslint-disable react-hooks/exhaustive-deps */
import VideoCard from 'Components/Cards/VideoCard';
import React, { useContext, useEffect } from 'react';

import Footer from 'Components/Footer/Footer';
import { AntmediaContext } from 'App';
import { SettingsContext } from 'pages/AntMedia';

function debounce(fn, ms) {
  let timer;
  return _ => {
    clearTimeout(timer);
    timer = setTimeout(_ => {
      timer = null;
      fn.apply(this, arguments);
    }, ms);
  };
}
function calculateLayout(containerWidth, containerHeight, videoCount, aspectRatio) {
  let bestLayout = {
    area: 0,
    cols: 0,
    rows: 0,
    width: 0,
    height: 0,
  };
  // brute-force search layout where video occupy the largest area of the container
  for (let cols = 1; cols <= videoCount; cols++) {
    const rows = Math.ceil(videoCount / cols);
    const hScale = containerWidth / (cols * aspectRatio);
    const vScale = containerHeight / rows;
    let width;
    let height;
    if (hScale <= vScale) {
      width = Math.floor(containerWidth / cols);
      height = Math.floor(width / aspectRatio);
    } else {
      height = Math.floor(containerHeight / rows);
      width = Math.floor(height * aspectRatio);
    }
    const area = width * height;
    if (area > bestLayout.area) {
      bestLayout = {
        area,
        width,
        height,
        rows,
        cols,
      };
    }
  }
  return bestLayout;
}

const MeetingRoom = React.memo(props => {
  const antmedia = useContext(AntmediaContext);
  const settings = useContext(SettingsContext);
  const { drawerOpen, pinnedVideoId, pinVideo } = settings;
  const { participants } = props;

  useEffect(() => {
    console.log('call use effect for localvideo');
    if (document.getElementById('localVideo')) {
      antmedia.mediaManager.localVideo = document.getElementById('localVideo');
      antmedia.mediaManager.localVideo.srcObject = antmedia.mediaManager.localStream;
    }
  }, [pinnedVideoId, participants]);

  function handleGalleryResize(calcDrawer) {
    console.log('handleGalleryResize');
    const gallery = document.getElementById('meeting-gallery');

    if (calcDrawer) {
      if (drawerOpen) {
        gallery.classList.add('drawer-open');
      } else {
        gallery.classList.remove('drawer-open');
      }
    }
    const aspectRatio = 16 / 9;
    const screenWidth = gallery.getBoundingClientRect().width;

    const screenHeight = gallery.getBoundingClientRect().height;
    const videoCount = document.querySelectorAll('#meeting-gallery .single-video-container.not-pinned').length;
    console.log('videoCount: ', videoCount);

    const { width, height, cols } = calculateLayout(screenWidth, screenHeight, videoCount, aspectRatio);

    let Width = width - 8;
    let Height = height - 8;

    gallery.style.setProperty('--width', `calc(100% / ${cols})`);
    gallery.style.setProperty('--maxwidth', Width + 'px');
    gallery.style.setProperty('--height', Height + 'px');
    gallery.style.setProperty('--cols', cols + '');
    console.log('cols: ', cols);
  }

  React.useEffect(() => {
    handleGalleryResize(false);
  }, [participants, pinnedVideoId]);

  React.useEffect(() => {
    handleGalleryResize(true);
  }, [drawerOpen]);

  React.useEffect(() => {
    const debouncedHandleResize = debounce(handleGalleryResize, 500);
    window.addEventListener('resize', debouncedHandleResize);

    return _ => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  });

  const pinLayout = pinnedVideoId !== null ? true : false;
  console.log('pinnedVideoIdpinnedVideoIdpinnedVideoIdpinnedVideoId', pinnedVideoId);
  return (
    <>
      <div id="meeting-gallery" style={{ height: 'calc(100vh - 80px)' }}>
        {!pinLayout && ( // if not pinned layout show me first as a regular video
          <>
            <div
              className="single-video-container not-pinned"
              style={{
                width: 'var(--width)',
                height: 'var(--height)',
                maxWidth: 'var(--maxwidth)',
              }}
            >
              <VideoCard
                onHandlePin={() => {
                  pinVideo('localVideo');
                }}
                id="localVideo"
                autoPlay
                name="You"
                muted
              />
            </div>
            {participants.map(({ id, tracks, name }, index) => (
              <>
                
                <div
                className="single-video-container not-pinned"
                key={index}
                style={{
                  width: "var(--width)",
                  height: "var(--height)",
                  maxWidth: "var(--maxwidth)",
                }}
              >
                <VideoCard
                  onHandlePin={() => {
                    pinVideo(id);
                  }}
                  id={id}
                  tracks={tracks}
                  autoPlay
                  name={name}
                />
              </div>
              </>
            ))}
          </>
        )}

        {pinLayout && ( // if not pinned layout show me first as a regular video
          <>
            {pinnedVideoId === 'localVideo' ? (
              // pinned myself
              <div className="single-video-container pinned keep-ratio">
                <VideoCard
                  onHandlePin={() => {
                    pinVideo('localVideo');
                  }}
                  id="localVideo"
                  autoPlay
                  name="You"
                  muted
                  pinned
                />
              </div>
            ) : (
              //pinned participant
              participants
                .filter(v => v.id === pinnedVideoId)
                .map(({ id, tracks, name }, index) => (
                  <>
                    <div className="single-video-container pinned keep-ratio" key={`pin-${index}`}>
                      <VideoCard
                        id={id}
                        tracks={tracks}
                        autoPlay
                        name={name}
                        pinned
                        onHandlePin={() => {
                          pinVideo(id);
                        }}
                      />
                    </div>
                  </>
                ))
            )}
            <div id="unpinned-gallery">
              {pinnedVideoId !== 'localVideo' && (
                // participant is pinned show me on the slider
                <div className="single-video-container unpinned keep-ratio">
                  <VideoCard
                    onHandlePin={() => {
                      pinVideo('localVideo');
                    }}
                    id="localVideo"
                    autoPlay
                    name="You"
                    muted
                  />
                </div>
              )}
              {participants
                .filter(v => v.id !== pinnedVideoId)
                .map(({ id, tracks, name }, index) => (
                  // show all participants except if anyone is pinned
                  <>
                    <div className="single-video-container unpinned keep-ratio" key={index} style={{ width: 'var(--width)', height: 'var(--height)' }}>
                      <VideoCard
                        onHandlePin={() => {
                          pinVideo(id);
                        }}
                        id={id}
                        tracks={tracks}
                        autoPlay
                        name={name}
                      />
                    </div>
                    <div className="single-video-container unpinned keep-ratio" key={index} style={{ width: 'var(--width)', height: 'var(--height)' }}>
                      <VideoCard
                        onHandlePin={() => {
                          pinVideo(id);
                        }}
                        id={id}
                        tracks={tracks}
                        autoPlay
                        name={name}
                      />
                    </div>
                    <div className="single-video-container unpinned keep-ratio" key={index} style={{ width: 'var(--width)', height: 'var(--height)' }}>
                      <VideoCard
                        onHandlePin={() => {
                          pinVideo(id);
                        }}
                        id={id}
                        tracks={tracks}
                        autoPlay
                        name={name}
                      />
                    </div>
                    <div className="single-video-container unpinned keep-ratio" key={index} style={{ width: 'var(--width)', height: 'var(--height)' }}>
                      <VideoCard
                        onHandlePin={() => {
                          pinVideo(id);
                        }}
                        id={id}
                        tracks={tracks}
                        autoPlay
                        name={name}
                      />
                    </div>
                    <div className="single-video-container unpinned keep-ratio" key={index} style={{ width: 'var(--width)', height: 'var(--height)' }}>
                      <VideoCard
                        onHandlePin={() => {
                          pinVideo(id);
                        }}
                        id={id}
                        tracks={tracks}
                        autoPlay
                        name={name}
                      />
                    </div>
                    <div className="single-video-container unpinned keep-ratio" key={index} style={{ width: 'var(--width)', height: 'var(--height)' }}>
                      <VideoCard
                        onHandlePin={() => {
                          pinVideo(id);
                        }}
                        id={id}
                        tracks={tracks}
                        autoPlay
                        name={name}
                      />
                    </div>
                  </>
                ))}
            </div>
          </>
        )}
      </div>

      <Footer {...props} />
    </>
  );
});

export default MeetingRoom;
