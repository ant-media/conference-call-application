import React, { useContext } from 'react';
import { SvgIcon } from '../../SvgIcon';
import { ConferenceContext } from 'pages/AntMedia';
import { Tooltip, Badge } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CustomizedButton from './CustomizedButton';


const MessageButton = React.memo(({ footer }) => {
  const {t} = useTranslation();
  const conference = useContext(ConferenceContext);

  const toggleMessageDrawerOpen = React.useCallback(() => {
    if (!conference?.messageDrawerOpen) {
      conference?.toggleSetNumberOfUnreadMessages(0);
    }
    conference?.handleMessageDrawerOpen(!conference?.messageDrawerOpen);
  }, [conference]);


  return (
    <Badge
      badgeContent={conference?.numberOfUnReadMessages}
      color="primary"
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      style={{height: '100%',width:'100%'}}
    >
      <Tooltip title={t('Chat with everyone')} placement="top">
        <CustomizedButton
          onClick={toggleMessageDrawerOpen}
          variant="contained"
          className={footer ? 'footer-icon-button' : ''}
          color={conference?.messageDrawerOpen ? 'primary' : 'secondary'}
        >
          <SvgIcon size={40} color={conference?.messageDrawerOpen ? 'black' : 'white'} name={'message-off'} />
        </CustomizedButton>
      </Tooltip>
    </Badge>
  );
})

export default MessageButton;
