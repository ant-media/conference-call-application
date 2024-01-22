import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { SvgIcon } from '../../SvgIcon';
import { ConferenceContext } from 'pages/AntMedia';
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

function MessageButton({ footer, ...props }) {
  const {t} = useTranslation();
  const conference = useContext(ConferenceContext);
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
        <CustomizedBtn
          onClick={() => {
            if (!conference?.messageDrawerOpen) {
              conference?.toggleSetNumberOfUnreadMessages(0);
            }
            conference?.handleMessageDrawerOpen(!conference?.messageDrawerOpen);
          }}
          variant="contained"
          className={footer ? 'footer-icon-button' : ''}
          color={conference?.messageDrawerOpen ? 'primary' : 'secondary'}
        >
          <SvgIcon size={40} color={conference?.messageDrawerOpen ? 'black' : 'white'} name={'message-off'} />
        </CustomizedBtn>
      </Tooltip>
    </Badge>
  );
}

export default MessageButton;
