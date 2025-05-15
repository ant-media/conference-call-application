import * as React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { Grid, Hidden, MenuItem, useMediaQuery } from '@mui/material';
import { SvgIcon } from 'Components/SvgIcon';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AntDialogTitle = props => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle {...other}>
      {children}
      {onClose ? (
        <Button
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 26,
            top: 27,
          }}
        >
          <SvgIcon size={30} name={'close'} color={'#fff'} />
        </Button>
      ) : null}
    </DialogTitle>
  );
};

export default function SettingsDialog(props) {
  const { t } = useTranslation();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const handleClose = (event, reason) => {
    props?.onClose(props?.selectedValue);
  };
  function switchVideoMode(value) {
    props?.cameraSelected(value);
  }

  function switchAudioMode(value) {
    props?.microphoneSelected(value);
  }

  React.useEffect(() => {
    if (props?.devices) {
      const camera = props?.devices.find(d => d.kind === 'videoinput');
      const audio = props?.devices.find(d => d.kind === 'audioinput');
      if (camera && (props?.selectedCamera === '' || props?.selectedCamera === null)) props?.cameraSelected(camera.deviceId);
      if (audio && (props?.selectedMicrophone === '' || props?.selectedMicrophone === null)) props?.microphoneSelected(audio.deviceId);
      if (props?.selectedBackgroundMode === '') props?.setSelectedBackgroundMode('none');
    }
    // eslint-disable-next-line
  }, [props?.devices]);

  return (
    <Dialog onClose={handleClose} open={props?.open} fullScreen={fullScreen} maxWidth={'sm'} id="settings-dialog">
      <AntDialogTitle onClose={handleClose}>{t('Set Camera and Microphone')}</AntDialogTitle>
      <DialogContent>
        <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap' }}>
          <Grid container>
            <Grid container>
              <InputLabel>{t('Camera')}</InputLabel>
            </Grid>
            <Grid container alignItems={'center'} spacing={2}>
              <Grid item xs={10}>
                <Select
                  autoFocus={props?.selectFocus === 'camera'}
                  fullWidth
                  id="setting-dialog-camera-select"
                  variant="outlined"
                  value={props?.selectedCamera}
                  onChange={e => switchVideoMode(e.target.value)}
                  sx={{ color: '#fff' }}
                >
                  {props?.devices && props?.devices?.length > 0 && props?.devices
                    .filter(device => device.kind === 'videoinput')
                    .map(device => (
                      <MenuItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </MenuItem>
                    ))}
                </Select>
              </Grid>
              <Hidden xsDown>
                <Grid item>
                  <SvgIcon size={30} name={'camera'} color={'#fff'} />
                </Grid>
              </Hidden>
            </Grid>
          </Grid>
          <Grid container sx={{ mt: 4 }}>
            <Grid container>
              <InputLabel>{t('Video Send resolution (maximum)')}</InputLabel>
            </Grid>
            <Grid container alignItems={'center'} spacing={2}>
              <Grid item xs={10}>
                <Select
                    variant="outlined"
                    fullWidth
                    value={props?.videoSendResolution}
                    onChange={e => props?.setVideoSendResolution(e.target.value)}
                    sx={{ color: '#fff' }}
                    id="setting-dialog-resolution-select"
                >
                  <MenuItem key="auto" value="auto">
                    {t('Auto')}
                  </MenuItem>
                  <MenuItem key="high-definition" value="highDefinition">
                    {t('High definition (720p)')}
                  </MenuItem>
                  <MenuItem key="standart-definition" value="standardDefinition">
                    {t('Standard definition (360p)')}
                  </MenuItem>
                  <MenuItem key="low-definition" value="lowDefinition">
                    {t('Low definition (180p)')}
                  </MenuItem>
                </Select>
              </Grid>
              <Hidden xsDown>
                <Grid item>
                  <SvgIcon size={36} name={'resolution'} color={'#fff'} />
                </Grid>
              </Hidden>
            </Grid>
          </Grid>
          <Grid container sx={{ mt: 4 }}>
            <Grid container>
              <InputLabel>{t('Microphone')}</InputLabel>
            </Grid>
            <Grid container alignItems={'center'} spacing={2}>
              <Grid item xs={10}>
                <Select
                    autoFocus={props?.selectFocus === 'audio'}
                    variant="outlined"
                    fullWidth
                    value={props?.selectedMicrophone}
                    onChange={e => switchAudioMode(e.target.value)}
                    sx={{ color: '#fff' }}
                    id="setting-dialog-mic-select"
                >
                  {props?.devices && props?.devices?.length > 0 && props?.devices
                    .filter(device => device.kind === 'audioinput')
                    .map(device => (
                      <MenuItem key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </MenuItem>
                    ))}
                </Select>
              </Grid>
              <Hidden xsDown>
                <Grid item>
                  <SvgIcon size={36} name={'microphone'} color={'#fff'} />
                </Grid>
              </Hidden>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
