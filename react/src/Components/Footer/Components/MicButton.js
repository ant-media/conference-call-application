import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from '../../SvgIcon';
import { AntmediaContext } from 'App';
import { MediaSettingsContext } from 'pages/AntMedia';
import { Tooltip } from '@mui/material';
import { useSnackbar } from 'notistack';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const CustomizedBtn = styled(Button)(({ theme }) => ({
  '&.footer-icon-button':{
    
    height: '100%',
    [theme.breakpoints.down('sm')]:{
      padding:8,
      minWidth: 'unset',
      width: '100%',
    },
    '& > svg': {
      width: 36
    },
  }
}));


function MicButton(props) {
  const { rounded,footer } = props;
  const antmedia = useContext(AntmediaContext);
  const settings = useContext(MediaSettingsContext);
  const { enqueueSnackbar } = useSnackbar();
  const {t} = useTranslation();

  const handleMute = (e) => {
    e.stopPropagation();
    enqueueSnackbar({
      message: t('MicOffNoti'),
      variant: 'info',
      icon: <SvgIcon size={24} name={'muted-microphone'} color="#fff" />
    }, {
      autoHideDuration: 1500,
    });
    settings?.toggleSetMic({
      eventStreamId: 'localVideo',
      isMicMuted: true,
    });
    antmedia.muteLocalMic();
    if (settings?.myLocalData?.streamId) {
      antmedia.handleSendNotificationEvent('MIC_MUTED', settings?.myLocalData?.streamId);
    }


  };
  const handleUnmute = (e) => {
    e.stopPropagation();
    enqueueSnackbar({
      message: t('MicOnNoti'),
      variant: 'info',
      icon: <SvgIcon size={24} name={'microphone'} color="#fff" />
    }, {
      autoHideDuration: 1500,
    });
    settings?.toggleSetMic({
      eventStreamId: 'localVideo',
      isMicMuted: false,
    });
    antmedia.unmuteLocalMic();
    if (settings?.myLocalData?.streamId) {
      antmedia.handleSendNotificationEvent('MIC_UNMUTED', settings?.myLocalData?.streamId);

    }
  };
  const roundStyle = {
    width: {xs:36,md:46},
    height: {xs:36,md:46},
    minWidth: 'unset',
    maxWidth: {xs:36,md:46},
    maxHeight: {xs:36,md:46},
    borderRadius: '50%',
    padding: '4px',
  };

  const mic = settings?.mic?.find(m => m.eventStreamId === 'localVideo');

  return (
    <>
      {mic && mic.isMicMuted ? (
        <Tooltip title={t('MicOnTooltip')} placement="top">
          <CustomizedBtn className={footer ? 'footer-icon-button' : ''} variant="contained" sx={rounded ? roundStyle : {}} color="secondary" onClick={(e)=>{handleUnmute(e)}}>
            <SvgIcon size={40} name={'muted-microphone'} color="#fff" />
          </CustomizedBtn>
        </Tooltip>
      ) : (
        <Tooltip title={t('MicOffTooltip')} placement="top">
          <CustomizedBtn className={footer ? 'footer-icon-button' : ''} variant="contained" color="primary" sx={rounded ? roundStyle : {}} onClick={(e)=>{handleMute(e)}}>
            <SvgIcon size={40} name={'microphone'} />
          </CustomizedBtn>
        </Tooltip>
      )}
    </>
  );
}

export default MicButton;
