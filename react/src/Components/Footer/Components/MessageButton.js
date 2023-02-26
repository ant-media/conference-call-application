import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { SvgIcon } from '../../SvgIcon';
import { SettingsContext } from 'pages/AntMedia';
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
  const settings = useContext(SettingsContext);
  return (
    <Badge
      badgeContent={settings?.numberOfUnReadMessages}
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
            if (!settings?.messageDrawerOpen) {
              settings?.toggleSetNumberOfUnreadMessages(0);
            }
            settings?.handleMessageDrawerOpen(!settings?.messageDrawerOpen);
          }}
          variant="contained"
          className={footer ? 'footer-icon-button' : ''}
          color={settings?.messageDrawerOpen ? 'primary' : 'secondary'}
        >
          <SvgIcon size={40} color={settings?.messageDrawerOpen ? 'black' : 'white'} name={'message-off'} />
        </CustomizedBtn>
      </Tooltip>
    </Badge>
  );
}

export default MessageButton;
