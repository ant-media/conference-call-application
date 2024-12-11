import React from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from 'Components/SvgIcon';
import {styled, useTheme} from '@mui/material/styles';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack-v2-maintained';
import { ConferenceContext } from 'pages/AntMedia';

const StyledListItemText = styled(ListItemText)(({ theme }) => ({
  '& .MuiListItemText-primary': {
    fontSize: 14,
  },
}));
const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  cursor: 'default',
  padding:'8px 12px',
  paddingTop: 4
}));

function InfoButton(props) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const conference = React.useContext(ConferenceContext);
  const theme = useTheme();

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const meetingLink = window.location.href;

  const getResolution = () => {
      // Sometimes, it takes some time to get the video track. So, we have to try catch it.
    try {
        const {width, height} = document.getElementById('localVideo').srcObject.getVideoTracks()[0].getSettings();
        return width + ' x ' + height;
    } catch (e) {
        return "";
    }
  }

  return (
        <>
          <Tooltip title={t('Info')} placement="top">
            <Button
                id="info-button"
                variant="text"
                aria-controls={open ? 'info-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                sx={{ml: 0.5, px: 1, py: 1.5, minWidth: 'unset'}}
            >
              <SvgIcon size={20} name={'info'} viewBox="0 0 500 500" color={theme.palette.text.primary}/>
            </Button>
          </Tooltip>
          <Menu
              id="info-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
                sx: {bgcolor: 'gray.90', minWidth: 275},
              }}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
          >
            <Typography variant="body2" sx={{px: 1.5, py: 0.5, fontSize: 14, fontWeight: 700}} color="#fff">
              {t('Meeting link')}
            </Typography>
            <StyledMenuItem>
              <StyledListItemText>{meetingLink.replace(/^https?:\/\//, '').split('?')[0]}</StyledListItemText>
              <ListItemIcon sx={{pl: 1, cursor: 'pointer'}}>
                <Tooltip title={t('Copy meeting link')} placement="top">
                  <Button
                      sx={{minWidth: 'unset', px: 1.5, py: 0.5}}
                      variant="text"
                      onClick={() => {
                        navigator.clipboard.writeText(meetingLink);
                        enqueueSnackbar(
                            {
                              message: t('Link copied'),
                              variant: 'info',
                            },
                            {
                              autoHideDuration: 1500,
                            }
                        );
                      }}
                  >
                    <SvgIcon size={14} viewBox="0 0 500 1000" name={'copy'} color={'#fff'}/>
                  </Button>
                </Tooltip>
              </ListItemIcon>
            </StyledMenuItem>

              {conference.isPlayOnly === false ?
            <Typography variant="body2" sx={{px: 1.5, py: 0.5, fontSize: 14, fontWeight: 700}} color="#fff">
              {t('Resolution')}
            </Typography>
                  :
                  <Typography variant="body2" sx={{px: 1.5, py: 0.5, fontSize: 14, fontWeight: 700}} color="#fff">
                      {t('You are in play only mode')}
                  </Typography>}

              {conference.isPlayOnly === false ?
            <StyledMenuItem>
              <StyledListItemText>{getResolution()}</StyledListItemText>
            </StyledMenuItem>
                    : null}

          </Menu>
        </>
    );
}

export default InfoButton;
