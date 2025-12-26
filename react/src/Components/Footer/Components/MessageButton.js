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

function MessageButton(props) {
  const {t} = useTranslation();
  return (
    <Badge
      badgeContent={isNaN(props?.numberOfUnReadMessages) ? 0 : props?.numberOfUnReadMessages}
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
            if (!props?.messageDrawerOpen) {
                props?.toggleSetNumberOfUnreadMessages(0);
            }
              props?.handleMessageDrawerOpen(!props?.messageDrawerOpen);
          }}
          variant="contained"
          className={props?.footer ? 'footer-icon-button' : ''}
          color={props?.messageDrawerOpen ? 'primary' : 'secondary'}
          id="messages-button"
        >
          <SvgIcon size={40} color={props?.messageDrawerOpen ? '#000' : '#fff'} name={'message-off'} />
        </CustomizedBtn>
      </Tooltip>
    </Badge>
  );
}

export default MessageButton;
