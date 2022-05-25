import React, { useContext } from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { SvgIcon } from '../../SvgIcon';
import { SettingsContext } from 'pages/AntMedia';
import { Tooltip, Badge } from '@mui/material';

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
      <Tooltip title="Chat with everyone" placement="top">
        <CustomizedBtn
          onClick={() => {
            if (!settings?.drawerOpen) {
              settings?.toggleSetNumberOfUnreadMessages(0);
            }
            settings?.handleDrawerOpen(!settings?.drawerOpen);
          }}
          variant="contained"
          className={footer ? 'footer-icon-button' : ''}
          color={settings?.drawerOpen ? 'primary' : 'secondary'}
        >
          <SvgIcon size={40} color={settings?.drawerOpen ? 'black' : 'white'} name={'message-off'} />
        </CustomizedBtn>
      </Tooltip>
    </Badge>
  );
}

export default MessageButton;
