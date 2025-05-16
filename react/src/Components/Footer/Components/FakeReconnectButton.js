import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { ConferenceContext } from 'pages/AntMedia';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

const CustomizedBtn = styled(Button)(({ theme }) => ({
  '&.footer-icon-button':{
    height: '100%',
    [theme.breakpoints.down('sm')]:{
      padding:8,
      minWidth: 'unset',
      width: '100%',
      '& > svg': {
        width: 36
      },
    },
  }
}));

function FakeReconnectButton({ footer, increment, ...props }) {
  const {t} = useTranslation();
  const conference = useContext(ConferenceContext);
  return (
      <Tooltip title={t('Fake Reconnect')} placement="top">
        <CustomizedBtn
          onClick={() => {
            console.log("fake reconnect");
            conference?.fakeReconnect();
          }}
          variant="contained"
          className={footer ? 'footer-icon-button' : ''}
          color='secondary'
        >
          "RC"
        </CustomizedBtn>
      </Tooltip>
  );
}

export default FakeReconnectButton;
