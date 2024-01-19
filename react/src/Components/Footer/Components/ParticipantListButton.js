import React from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { SvgIcon } from '../../SvgIcon';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ConferenceContext } from 'pages/AntMedia';

const CustomizedBtn = styled(Button)(({ theme }) => ({
  '&.footer-icon-button': {
    height: '100%',
    [theme.breakpoints.down('sm')]: {
      padding: 8,
      minWidth: 'unset',
      width: '100%',
      '& > svg': {
        width: 36,
      },
    },
  },
}));

const ParticipantListButton = React.memo(({ footer, ...props }) => {
  const conference = React.useContext(ConferenceContext);
  const { t } = useTranslation();

  const handleButtonClick = React.useCallback(() => {
    conference?.handleParticipantListOpen(!conference?.participantListDrawerOpen);
  }, [conference]);

  return (
    <Tooltip title={t('Participant List')} placement="top">
      <CustomizedBtn
        onClick={handleButtonClick}
        variant="contained"
        className={footer ? 'footer-icon-button' : ''}
        color={conference?.participantListDrawerOpen ? 'primary' : 'secondary'}
      >
        <SvgIcon size={32} color={conference?.participantListDrawerOpen ? 'black' : 'white'} name={'participants'} />
        {Object.keys(conference.allParticipants).length}
      </CustomizedBtn>
    </Tooltip>
  );
});

export default ParticipantListButton;
