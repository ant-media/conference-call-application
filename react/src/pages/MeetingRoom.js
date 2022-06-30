/* eslint-disable react-hooks/exhaustive-deps */
import VideoCard from 'Components/Cards/VideoCard';
import React, { useContext, useEffect } from 'react';

import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Footer from 'Components/Footer/Footer';
import { AntmediaContext } from 'App';
import { SettingsContext } from 'pages/AntMedia';
import { styled } from '@mui/material/styles';

const CustomizedAvatar = styled(Avatar)(({ theme }) => ({
  border: `3px solid ${theme.palette.green[85]} !important`,
}));
const CustomizedAvatarGroup = styled(AvatarGroup)(({ theme }) => ({
  '& div[class*="MuiAvatar-root-MuiAvatarGroup-avatar"]': {
    border: `3px solid ${theme.palette.green[85]} !important`,
    backgroundColor: theme.palette.green[80],
    color: '#fff',
    width: 64,
    height: 64,
    [theme.breakpoints.down('md')]: {
      width: 44,
      height: 44,
      fontSize: 16,
    },
  },
}));

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
  const { drawerOpen, pinnedVideoId, pinVideo, audioTracks } = settings;
  const { participants, allParticipants,myLocalData } = props;
  // console.log('myLocalData: ', myLocalData);
  //  console.log('xxx ALL Participants: ', allParticipants);
  //  console.log('xxx VIDEO participants: ', participants);
  const allParticipantsExceptLocal = allParticipants.filter(p => p.streamId !== myLocalData?.streamId )
  const filterAndSortOthersTile = (all, showing) => {
    const participantIds = showing.map(({ id }) => id);
    const othersIds = all.filter(p => !participantIds.includes(p.streamId));
    return othersIds.sort((a, b) => a.streamName.localeCompare(b.streamName));
  };

  useEffect(() => {
    let localVid = document.getElementById('localVideo');
    if (localVid) {
      antmedia.mediaManager.localVideo = document.getElementById('localVideo');
      antmedia.mediaManager.localVideo.srcObject = antmedia.mediaManager.localStream;
    }
  }, [pinnedVideoId]);

  function handleGalleryResize(calcDrawer) {
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
    return filtered;
  };

  const OthersTile = (maxGroup, small) => {
    const others = filterAndSortOthersTile(allParticipantsExceptLocal, participants);
    //test purposes
    //others = [...others, ...others, ...others];
    const sidebarStyle = small ? { width: { xs: 44, md: 64 }, height: { xs: 44, md: 64 } } : { width: { xs: 44, md: 54 }, height: { xs: 44, md: 54 } };
    return (
      <div className="others-tile-inner">
        <CustomizedAvatarGroup max={maxGroup} sx={{ justifyContent: 'center' }}>
          {others.map(({ name, streamName }, index) => {
            let username = name || streamName;
            if (username?.length > 0) {
              const nameArr = username.split(' ');
              const secondLetter = nameArr.length > 1 ? nameArr[1][0] : '';
              const initials = `${nameArr[0][0]}${secondLetter}`.toLocaleUpperCase();

              return (
                <CustomizedAvatar
                  key={index}
                  alt={username}
                  sx={{
                    bgcolor: 'green.50',
                    color: '#fff',
                    ...sidebarStyle,
                    fontSize: { xs: 16, md: 22 },
                  }}
                >
                  {initials}
                </CustomizedAvatar>
              );
            } else {
              return null;
            }
          })}
        </CustomizedAvatarGroup>
        <Typography sx={{ mt: 2, color: '#ffffff' }}>
          {others.length} other{others.length > 1 ? 's' : ''}
        </Typography>
      </div>
    );
  };

  const returnUnpinnedGallery = () => {
    //pinned tile
    const unpinnedParticipants = getUnpinnedParticipants();

    const showAsOthersLimitPinned = 5;
    const showAsOthersSliceIndexPinned = showAsOthersLimitPinned - 2;

    const slicePinnedTiles = unpinnedParticipants.length + 1 > showAsOthersLimitPinned;

    let slicedParticipants = [];
    if (slicePinnedTiles) {
      slicedParticipants = unpinnedParticipants.slice(0, showAsOthersSliceIndexPinned);
    } else {
      slicedParticipants = unpinnedParticipants;
    }

    return (
      slicedParticipants.length > 0 ? <>
        {slicedParticipants.map(({ id, videoLabel, track, name }, index) => {
          if (id !== 'localVideo') {
            return (
              <div className="unpinned" key={index}>
                <div className="single-video-container">
                  <VideoCard
                    onHandlePin={() => {
                      pinVideo(id, videoLabel);
                    }}
                    id={id}
                    track={track}
                    autoPlay
                    name={name}
                  />
                </div>
              </div>
            );
          } else {
            return (
              <div className="unpinned">
                <div className="single-video-container " key={index}>
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
              </div>
            );
          }
        })}
        {sliceTiles && participants.length > 0 && (
          <div className="unpinned">
            <div className="single-video-container  others-tile-wrapper">{OthersTile(2)}</div>
          </div>
        )}
      </>:
    <Typography variant="body2" sx={{color: 'green.50',mt:3}}>No other participants.</Typography>
    );
  };

  //main tile other limit set, max count
  const showAsOthersLimit = 3; // the total video cards i want to see on screen including my local video card and excluding the others tile. if this is set to 2, user will see 3 people and 1 "others card" totaling to 4 cards and 2x2 grid.
  //with 2 active video participants + 1 me + 1 card
  const sliceTiles = allParticipantsExceptLocal.length + 1 > showAsOthersLimit; //plus 1 is me


  const pinLayout = pinnedVideoId !== null ? true : false;

  return (
    <>
      {audioTracks.map((audio, index) => (
        <VideoCard key={index} onHandlePin={() => {}} id={audio.streamId} track={audio.track} autoPlay name={''} style={{ display: 'none' }} />
      ))}
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
                hidePin={participants.length === 0}
              />
            </div>
            {participants.map(({ id, videoLabel, track, name }, index) => (
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
                      pinVideo(id, videoLabel);
                    }}
                    id={id}
                    track={track}
                    autoPlay
                    name={name}
                  />
                </div>
              </>
            ))}

            {sliceTiles && participants.length > 0 && (
              <div
                className="single-video-container not-pinned others-tile-wrapper"
                style={{
                  width: 'var(--width)',
                  height: 'var(--height)',
                  maxWidth: 'var(--maxwidth)',
                }}
              >
                {OthersTile(4)}
              </div>
            )}
          </>
        )}
        {pinLayout && (
          <>
            {pinnedVideoId === 'localVideo' ? (
              // pinned myself
              // ${participants.length === 0 ? ' no-participants ' : ''}
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
                .map(({ id, videoLabel, track, name }, index) => (
                  <>
                    <div className="single-video-container pinned keep-ratio" key={`pin-${index}`}>
                      <VideoCard
                        id={id}
                        track={track}
                        autoPlay
                        name={name}
                        pinned
                        onHandlePin={() => {
                          pinVideo(id, videoLabel);
                        }}
                      />
                    </div>
                  </>
                ))
            )}
            <div id="unpinned-gallery">{returnUnpinnedGallery()}</div>
          </>
        )}
      </div>
      <Footer {...props} />
    </>
  );
});

export default MeetingRoom;
