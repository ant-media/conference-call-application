import React from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from '../../SvgIcon';
import { useSnackbar } from 'notistack';
import { Tooltip } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
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
      width: 36,
    },
  },
}));

function MicButton({ isMicMuted, toggleMic, microphoneButtonDisabled, rounded, footer }) {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const theme = useTheme();

  const handleMicToggle = (e, mute) => {
    e.stopPropagation();
    enqueueSnackbar({
      message: mute ? t('Microphone off') : t('Microphone on'),
      variant: 'info',
      icon: (
          <SvgIcon
              size={24}
              name={mute ? 'muted-microphone' : 'microphone'}
              color="#fff"
          />
      ),
    }, {
      autoHideDuration: 1500,
    });
    toggleMic(!mute);
  };

  return (
      <Tooltip title={t(isMicMuted ? 'Turn on microphone' : 'Turn off microphone')} placement="top">
        <CustomizedBtn
            id="mic-button"
            disabled={microphoneButtonDisabled}
            className={footer ? 'footer-icon-button' : ''}
            variant="contained"
            sx={rounded ? roundStyle : {}}
            color={isMicMuted ? 'error' : 'primary'}
            onClick={(e) => handleMicToggle(e, isMicMuted)}
        >
          <SvgIcon
              size={40}
              name={isMicMuted ? 'muted-microphone' : 'microphone'}
              color={isMicMuted ? theme.palette.iconColor.primary : theme.palette.darkIconColor.primary}
          />
        </CustomizedBtn>
      </Tooltip>
  );
}

export default MicButton;
