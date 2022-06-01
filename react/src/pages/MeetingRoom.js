/* eslint-disable react-hooks/exhaustive-deps */
import VideoCard from 'Components/Cards/VideoCard';
import React, { useContext, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Footer from 'Components/Footer/Footer';
import { AntmediaContext } from 'App';
import { SettingsContext } from 'pages/AntMedia';

import IconButton from '@mui/material/IconButton';
import ArrowPrev from '@mui/icons-material/ArrowBackIosRounded';

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

  const getUnpinnedParticipants = () => {
    const array = [pinnedVideoId !== 'localVideo' && { id: 'localVideo' }, ...participants.filter(v => v.id !== pinnedVideoId)];
    const filtered = array.filter(Boolean);
    return [...filtered];
  };
  // const paginateUnpinnedParticipants = (participants,perPageCount) => {
  //   total_pages = Math.ceil(participants.length / per_page);
  //   return {
  //     total: participants.length,
  //   total_pages: total_pages,
  //   }
  // }

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
                hidePin={participants.length===0}
              />
            </div>
            {participants.map(({ id, tracks, name }, index) => (
              <>
                <div
                  className="single-video-container not-pinned"
                  key={index}
                  style={{
                    width: 'var(--width)',
                    height: 'var(--height)',
                    maxWidth: 'var(--maxwidth)',
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
            <Grid container id="unpinned-gallery" >
              <Grid item xs='auto' style={{display: 'none'}}>
                {' '}
                <IconButton
                  sx={{
                    color: '#ffffff',
                    opacity: '60%',
                    bgcolor: '#808E8C',
                    width: { xs: 24, md: 34 },
                    height: { xs: 24, md: 34 },
                    minWidth: 'unset',
                    maxWidth: { xs: 24, md: 34 },
                    maxHeight: { xs: 36, md: 46 },
                    borderRadius: '50%',
                    padding: '4px',
                  }}
                >
                  <ArrowPrev sx={{ width: { xs: 14, md: 16 } }} />
                </IconButton>
              </Grid>
              <Grid item xs={11} >
                <Grid container >
                  {getUnpinnedParticipants().map(({ id, tracks, name }, index) => {
                    if (id !== 'localVideo') {
                      return (
                        <Grid item lg={2} className="single-video-container unpinned" key={index} style={{ width: 'var(--width)', height: 'var(--height)' }}>
                          <VideoCard
                            onHandlePin={() => {
                              pinVideo(id);
                            }}
                            id={id}
                            tracks={tracks}
                            autoPlay
                            name={name}
                          />
                        </Grid>
                      );
                    } else {
                      return (
                        <Grid item lg={2} className="single-video-container unpinned" key={index}>
                          <VideoCard
                            onHandlePin={() => {
                              pinVideo('localVideo');
                            }}
                            id="localVideo"
                            autoPlay
                            name="You"
                            muted
                          />
                        </Grid>
                      );
                    }
                  })}
                </Grid>
              </Grid>
              <Grid item xs='auto' style={{display: 'none'}}>
                {' '}
                <IconButton
                  sx={{
                    color: '#ffffff',
                    opacity: '60%',
                    bgcolor: '#808E8C',
                    width: { xs: 24, md: 34 },
                    height: { xs: 24, md: 34 },
                    minWidth: 'unset',
                    maxWidth: { xs: 24, md: 34 },
                    maxHeight: { xs: 36, md: 46 },
                    borderRadius: '50%',
                    padding: '4px',
                  }}
                >
                  <ArrowPrev sx={{ width: { xs: 14, md: 16 } }} />
                </IconButton>
              </Grid>
            </Grid>
          </>
        )}
      </div>

      <Footer {...props} />
    </>
  );
});

export default MeetingRoom;
