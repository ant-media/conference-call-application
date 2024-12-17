import React from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from '../../SvgIcon';
import { useSnackbar } from 'notistack-v2-maintained';
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

function MicButton(props) {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const theme = useTheme();

  const handleMicToggle = (e, mute) => {
    e.stopPropagation();

    const notificationContent = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SvgIcon
              size={24}
              name={mute ? 'muted-microphone' : 'microphone'}
              color="#fff"
          />
          {mute ? t('Microphone off') : t('Microphone on')}
        </div>
    );

    enqueueSnackbar(notificationContent, {
      variant: 'info',
      autoHideDuration: 1500,
    });

    props?.toggleMic(!mute);
  };

  return (
      <Tooltip title={t(props?.isMicMuted ? 'Turn on microphone' : 'Turn off microphone')} placement="top">
        <CustomizedBtn
            id="mic-button"
            disabled={props?.microphoneButtonDisabled}
            className={props?.footer ? 'footer-icon-button' : ''}
            variant="contained"
            sx={props?.rounded ? roundStyle : {}}
            color={props?.isMicMuted ? 'error' : 'primary'}
            onClick={(e) => handleMicToggle(e, props?.isMicMuted)}
        >
          <SvgIcon
              size={40}
              name={props?.isMicMuted ? 'muted-microphone' : 'microphone'}
              color={props?.isMicMuted ? theme.palette.iconColor.primary : theme.palette.darkIconColor.primary}
          />
        </CustomizedBtn>
      </Tooltip>
  );
}

export default MicButton;
