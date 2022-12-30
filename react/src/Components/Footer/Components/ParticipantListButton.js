import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { SvgIcon } from '../../SvgIcon';
import { SettingsContext } from 'pages/AntMedia';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

const CustomizedBtn = styled(Button)(({ theme }) => ({
  '&.footer-icon-button':{
    height: '100%',
    [theme.breakpoints.down('sm')]:{
      padding: 8,
      minWidth: 'unset',
      width: '100%',
      '& > svg': {
        width: 36
      },
    },
  }
}));

function ParticipantListButton({ footer, ...props }) {
  const {t} = useTranslation();
  const settings = useContext(SettingsContext);
  const {allParticipants } = settings;
  return (
      <Tooltip title={t('Participant List')} placement="top">
        <CustomizedBtn
          onClick={() => {
            if (!settings?.drawerOpen) {
              settings?.toggleSetNumberOfUnreadMessages(0);
            }
            settings?.handleDrawerOpen(!settings?.drawerOpen);
          }}
          variant="contained"
          className={footer ? 'footer-icon-button' : ''}
          color={settings?.drawerOpen ? 'primary' : 'secondary'}
        >
          <SvgIcon size={32} color={settings?.drawerOpen ? 'black' : 'white'} name={'participants'} />
            {allParticipants.length + 1}
        </CustomizedBtn>
      </Tooltip>
  );
}

export default ParticipantListButton;
