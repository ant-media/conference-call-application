import React, { useContext } from 'react';
import { ConferenceContext } from 'pages/AntMedia';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CustomizedButton from './CustomizedButton';


function FakeParticipantButton({ footer, increment, ...props }) {
  const {t} = useTranslation();
  const conference = useContext(ConferenceContext);
  return (
      <Tooltip title={t((increment?'Add':'Remove')+' Fake Participant')} placement="top">
        <CustomizedButton
          onClick={() => {
            console.log("add/remove");
            if(increment) {
              conference?.addFakeParticipant();
            }
            else {
              conference?.removeFakeParticipant();
            }
          }}
          variant="contained"
          className={footer ? 'footer-icon-button' : ''}
          color='secondary'
        >
          {increment ? "+" : "-"}
        </CustomizedButton>
      </Tooltip>
  );
}

export default FakeParticipantButton;
