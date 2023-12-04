import * as React from 'react';
import PropTypes from 'prop-types';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { ConferenceContext } from 'pages/AntMedia';
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
          <SvgIcon size={30} name={'close'} color={'white'} />
        </Button>
      ) : null}
    </DialogTitle>
  );
};

export function SettingsDialog(props) {
  const { t } = useTranslation();
  const { onClose, selectedValue, open, selectFocus } = props;
  const conference = React.useContext(ConferenceContext);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const handleClose = (event, reason) => {
    onClose(selectedValue);
  };
  function switchVideoMode(value) {
    conference.cameraSelected(value);
  }

  function switchAudioMode(value) {
    conference.microphoneSelected(value);
  }

  function setBackground(value) {
    conference.setSelectedBackgroundMode(value);
    conference.handleBackgroundReplacement(value);
  }

  React.useEffect(() => {
    if (conference.devices) {
      const camera = conference.devices.find(d => d.kind === 'videoinput');
      const audio = conference.devices.find(d => d.kind === 'audioinput');
      if (camera && conference.selectedCamera === '') conference.cameraSelected(camera.deviceId);
      if (audio && conference.selectedMicrophone === '') conference.microphoneSelected(audio.deviceId);
      if (conference.selectedBackgroundMode === '') conference.setSelectedBackgroundMode('none');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conference.devices]);

  return (
    <Dialog onClose={handleClose} open={open} fullScreen={fullScreen} maxWidth={'sm'}>
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
                  autoFocus={selectFocus === 'camera'}
                  fullWidth
                  id="demo-dialog-native"
                  variant="outlined"
                  value={conference.selectedCamera}
                  onChange={e => switchVideoMode(e.target.value)}
                  sx={{ color: 'white' }}
                >
                  {conference.devices && conference.devices?.length > 0 && conference.devices
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
                  <SvgIcon size={30} name={'camera'} color={'white'} />
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
                <Select autoFocus={selectFocus === 'audio'} variant="outlined" fullWidth value={conference.selectedMicrophone} onChange={e => switchAudioMode(e.target.value)} sx={{ color: 'white' }}>
                  {conference.devices && conference.devices?.length > 0 && conference.devices
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
                  <SvgIcon size={36} name={'microphone'} color={'white'} />
                </Grid>
              </Hidden>
            </Grid>
          </Grid>
          <Grid container sx={{ mt: 4 }}>
            <Grid container>
              <InputLabel>{t('Camera Resolution')}</InputLabel>
            </Grid>
            <Grid container alignItems={'center'} spacing={2}>
              <Grid item xs={10}>
                <Select variant="outlined" fullWidth value={conference.cameraResolution} onChange={e => conference.setCameraResolution(e.target.value)} sx={{ color: 'white' }}>
                  <MenuItem key="auto" value="auto">
                    Auto
                  </MenuItem>
                  <MenuItem key="high-definition" value="highDefinition">
                    High definition (720p)
                  </MenuItem>
                  <MenuItem key="standart-definition" value="standardDefinition">
                    Standard definition (360p)
                  </MenuItem>
                  <MenuItem key="low-definition" value="lowDefinition">
                    Low definition (180p)
                  </MenuItem>
                </Select>
              </Grid>
              <Hidden xsDown>
                <Grid item>
                  <SvgIcon size={36} name={'resolution'} color={'white'} />
                </Grid>
              </Hidden>
            </Grid>
          </Grid>
          <Grid container sx={{ mt: 4 }}>
            <Grid container>
              <InputLabel>{t('Background')}</InputLabel>
            </Grid>
            <Grid container alignItems={'center'} spacing={2}>
              <Grid item xs={10}>
                <Select variant="outlined" fullWidth value={conference.selectedBackgroundMode} onChange={e => setBackground(e.target.value)} sx={{ color: 'white' }}>
                  <MenuItem key="none" value="none">
                    None
                  </MenuItem>
                  <MenuItem key="blur" value="blur">
                    Blur
                  </MenuItem>
                  <MenuItem key="background" value="background">
                    Virtual Background
                  </MenuItem>
                </Select>
              </Grid>
              <Hidden xsDown>
                <Grid item>
                  <SvgIcon size={36} name={'background-replacement'} color={'white'} />
                </Grid>
              </Hidden>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

SettingsDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
