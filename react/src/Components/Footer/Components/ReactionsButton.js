import React, { useContext, useCallback } from 'react';
import { SvgIcon } from '../../SvgIcon';
import { ConferenceContext } from 'pages/AntMedia';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CustomizedButton from './CustomizedButton';

export const roundStyle = {
  width: { xs: 36, md: 46 },
  height: { xs: 36, md: 46 },
  minWidth: 'unset',
  maxWidth: { xs: 36, md: 46 },
  maxHeight: { xs: 36, md: 46 },
  borderRadius: '50%',
  padding: '4px',
};


const ReactionsButton = React.memo((props) => {
  const { rounded, footer } = props;
  const conference = useContext(ConferenceContext);
  const { t } = useTranslation();

  const handleButtonClick = useCallback(() => {
    conference.setShowEmojis(!conference.showEmojis);
  }, [conference]);

  return (
    <Tooltip title={t('Emoji')} placement="top">
      <CustomizedButton
        className={footer ? 'footer-icon-button' : ''}
        variant="contained"
        color={conference.showEmojis ? 'primary' :'secondary'}
        sx={rounded ? roundStyle : {}}
        onClick={handleButtonClick}
      >
        <SvgIcon size={40} name={'smiley-face'} color={conference.showEmojis ? '#000' : '#fff'} />
      </CustomizedButton>
    </Tooltip>
  );
});

export default ReactionsButton;
