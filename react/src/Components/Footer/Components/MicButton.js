import React, { useContext, useCallback } from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from '../../SvgIcon';
import { ConferenceContext } from 'pages/AntMedia';
import { Tooltip } from '@mui/material';
import { useSnackbar } from 'notistack';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

export const roundStyle = {
  width: { xs: 36, md: 46 },
  height: { xs: 36, md: 46 },
  minWidth: 'unset',
  maxWidth: { xs: 36, md: 46 },
  maxHeight: { xs: 36, md: 46 },
  borderRadius: '50%',
  padding: '4px',
};

export const CustomizedBtn = styled(Button)(({ theme }) => ({
  '&.footer-icon-button': {
    height: '100%',
    [theme.breakpoints.down('sm')]: {
      padding: 8,
      minWidth: 'unset',
      width: '100%',
    },
    '& > svg': {
      width: 36
    },
  }
}));

const MicButton = React.memo(({ rounded, footer }) => {
  const conference = useContext(ConferenceContext);
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const handleMute = useCallback((e) => {
    e.stopPropagation();
    if (!conference.localVideo) {
      enqueueSnackbar({
        message: t('You need to allow camera and microphone permissions before muting yourself'),
        variant: 'info',
        icon: <SvgIcon size={24} name={'muted-microphone'} color="#fff" />
      }, {
        autoHideDuration: 1500,
      });
      return;
    }
    enqueueSnackbar({
      message: t('Microphone off'),
      variant: 'info',
      icon: <SvgIcon size={24} name={'muted-microphone'} color="#fff" />
    }, {
      autoHideDuration: 1500,
    });
    conference?.muteLocalMic();
  }, [conference, enqueueSnackbar, t]);

  const handleUnmute = useCallback((e) => {
    e.stopPropagation();
    enqueueSnackbar({
      message: t('Microphone on'),
      variant: 'info',
      icon: <SvgIcon size={24} name={'microphone'} color="#fff" />
    }, {
      autoHideDuration: 1500,
    });
    conference?.unmuteLocalMic();
  }, [conference, enqueueSnackbar, t]);

  return (
    <>
      {conference.isMyMicMuted ? (
        <Tooltip title={t('Turn on microphone')} placement="top">
          <CustomizedBtn
            id="mic-button"
            className={footer ? 'footer-icon-button' : ''}
            variant="contained"
            sx={rounded ? roundStyle : {}}
            color="error"
            onClick={handleUnmute}
          >
            <SvgIcon size={40} name={'muted-microphone'} color="#fff" />
          </CustomizedBtn>
        </Tooltip>
      ) : (
        <Tooltip title={t('Turn off microphone')} placement="top">
          <CustomizedBtn
            id="mic-button"
            className={footer ? 'footer-icon-button' : ''}
            variant="contained"
            color="primary"
            sx={rounded ? roundStyle : {}}
            onClick={handleMute}
          >
            <SvgIcon size={40} name={'microphone'} color='inherit' />
          </CustomizedBtn>
        </Tooltip>
      )}
    </>
  );
});

export default MicButton;
