import React from 'react';
import { SvgIcon } from '../../SvgIcon';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ConferenceContext } from 'pages/AntMedia';
import CustomizedButton from './CustomizedButton';


const ParticipantListButton = React.memo(({ footer, ...props }) => {
  const conference = React.useContext(ConferenceContext);
  const { t } = useTranslation();

  const handleButtonClick = React.useCallback(() => {
    conference?.handleParticipantListOpen(!conference?.participantListDrawerOpen);
  }, [conference]);

  return (
    <Tooltip title={t('Participant List')} placement="top">
      <CustomizedButton
        onClick={handleButtonClick}
        variant="contained"
        className={footer ? 'footer-icon-button' : ''}
        color={conference?.participantListDrawerOpen ? 'primary' : 'secondary'}
      >
        <SvgIcon size={32} color={conference?.participantListDrawerOpen ? 'black' : 'white'} name={'participants'} />
        {Object.keys(conference.allParticipants).length}
      </CustomizedButton>
    </Tooltip>
  );
});

export default ParticipantListButton;
