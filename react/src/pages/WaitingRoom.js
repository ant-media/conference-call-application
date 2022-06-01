import React, { useContext } from 'react';
import { Grid, Typography, Button, TextField, Container } from '@mui/material';
import VideoCard from 'Components/Cards/VideoCard';
import MicButton from 'Components/Footer/Components/MicButton';
import CameraButton from 'Components/Footer/Components/CameraButton';
import { useParams } from 'react-router-dom';
import { AntmediaContext } from 'App';
import { useTranslation } from 'react-i18next';

function WaitingRoom(props) {
  const { id } = useParams();
  const {t} = useTranslation();

  const roomName = id;
  const antmedia = useContext(AntmediaContext);
  React.useEffect(() => {
    antmedia.mediaManager.localVideo = document.getElementById('localVideo');
    antmedia.mediaManager.localVideo.srcObject = antmedia.mediaManager.localStream;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function joinRoom() {
    antmedia.joinRoom(roomName, undefined);
    props.handleChangeRoomStatus('meeting');
  }
  return (
    <Container>
      <Grid container spacing={4} justifyContent="space-between" alignItems={'center'}>
        <Grid item md={7} alignSelf="stretch" >
          <Grid container className="waiting-room-video" sx={{  position: 'relative' }}>
            <VideoCard id="localVideo" autoPlay muted hidePin={true} />
            <Grid container columnSpacing={2} justifyContent="center" alignItems="center" sx={{ position: 'absolute', bottom: 0, left: 0, p: 2, zIndex: 10 }}>
              <Grid item>
                <CameraButton rounded />
              </Grid>
              <Grid item>
                <MicButton rounded />
              </Grid>
            </Grid>
          </Grid>
          <Typography align="center" color="#DDFFFC" sx={{ mt: 2 }}>
            {t('PreviewVideoTip')}
          </Typography>
        </Grid>
        <Grid item md={4}>
          <Grid container justifyContent={'center'}>
            <Grid container justifyContent={'center'}>
              <Typography variant="h5" align="center" color={'white'}>
              {t('AskName')}
              </Typography>
            </Grid>
            <Grid container justifyContent={'center'} sx={{ mt: {xs:1,md:2.5} }}>
              <Typography variant="h6" align="center" color={'white'} fontWeight={'400'}>
              {t('AskNameTip')}{' '}
              </Typography>
            </Grid>

            <form
              onSubmit={() => {
                joinRoom();
              }}
            >
              <Grid item xs={12} sx={{ mt: 3, mb: 4 }}>
                <TextField autoFocus required fullWidth color="primary" value={props.streamName} variant="outlined" onChange={e => props.handleStreamName(e.target.value)} placeholder={t('NamePlaceholder')} />
              </Grid>
              <Grid container justifyContent={'center'}>
                <Grid item sm={6} xs={12}>
                  <Button fullWidth color="secondary" variant="contained" type="submit">
                  {t('JoinRoomButton')}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}

export default WaitingRoom;
