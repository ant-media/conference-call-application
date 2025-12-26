import * as React from 'react';
import PropTypes from 'prop-types';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import { SvgIcon } from 'Components/SvgIcon';
import { useTranslation } from 'react-i18next';

const AntDialogTitle = props => {
  const { children, onClose, ...other } = props;


  return (
    <DialogTitle {...other}>
      {children}
      {onClose ? (
        <Button
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 26,
            top: 27,
          }}
        >
          <SvgIcon size={30} name={'close'} color={'#fff'} />
        </Button>
      ) : null}
    </DialogTitle>
  );
};

export function GoToLobbyDialog(props) {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);
  const { onClose, url, open, onGoToLobbyClicked } = props;

  React.useEffect(() => {
    if (open) {
      setCopied(false);
    }
  }, [open, url]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
  };

  const handleClose = (event, reason) => {
    onClose();
  };

  const goToLobbyClicked = (e) =>{
    onGoToLobbyClicked()
  }

  return (
    <Dialog onClose={handleClose} open={open} maxWidth={'sm'} fullWidth>
      <AntDialogTitle onClose={handleClose}>{t('Share this Url with Your Attendees')}</AntDialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {t('Anyone with this link can join the room.')}
          </Typography>
          <TextField
            value={url || ''}
            fullWidth
            variant="outlined"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    onClick={copyToClipboard}
                    color="secondary"
                    variant={copied ? "contained" : "outlined"}
                  >
                    {copied ? t('Copied!') : t('Copy')}
                  </Button>
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Button
              onClick={goToLobbyClicked}
              size='medium'
              color="secondary"
              variant="contained"
              type="submit"
              id="go_to_lobby_button"
            >
              {t("Go to Lobby")}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

GoToLobbyDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
