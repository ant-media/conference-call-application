import React from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { SvgIcon } from '../../SvgIcon';
import { Tooltip, Badge } from '@mui/material';
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

function MessageButton({ footer, numberOfUnReadMessages, toggleSetNumberOfUnreadMessages, messageDrawerOpen, handleMessageDrawerOpen }) {
  const {t} = useTranslation();
  return (
    <Badge
      badgeContent={numberOfUnReadMessages}
      color="primary"
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      style={{height: '100%',width:'100%'}}
    >
      <Tooltip title={t('Chat with everyone')} placement="top">
        <CustomizedBtn
          onClick={() => {
            if (!messageDrawerOpen) {
              toggleSetNumberOfUnreadMessages(0);
            }
            handleMessageDrawerOpen(!messageDrawerOpen);
          }}
          variant="contained"
          className={footer ? 'footer-icon-button' : ''}
          color={messageDrawerOpen ? 'primary' : 'secondary'}
          id="messages-button"
        >
          <SvgIcon size={40} color={messageDrawerOpen ? '#000' : '#fff'} name={'message-off'} />
        </CustomizedBtn>
      </Tooltip>
    </Badge>
  );
}

export default MessageButton;
