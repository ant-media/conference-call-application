import * as React from 'react';
import PropTypes from 'prop-types';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
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
    <Dialog onClose={handleClose} open={open}  maxWidth={'sm'}>
      <AntDialogTitle onClose={handleClose}>{t('Share this Url with Your Attendees')}</AntDialogTitle>
      <DialogContent>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
      <a
      href={url}
      title={url} // Tooltip showing the full URL on hover
      style={{
        color: '#fff',
        fontSize: '1em',
        cursor: 'pointer',
        display: 'inline-block',
        maxWidth: '350px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {url}
    </a>
      <span
        style={{ textDecoration: 'underline', cursor: 'pointer', fontSize: '1.5em', marginTop:'15px'}}
        onClick={copyToClipboard}
      >
        {copied ? 'Copied!' : 'Copy'}
      </span>
    </div>

        <Button
                  style={{marginTop:'35px'}}

            onClick={goToLobbyClicked}
            size='medium'
            color="secondary"
            variant="contained"
            type="submit"
            id="go_to_lobby_button"
        >
        {t("Go to Lobby")}
        </Button>


      </DialogContent>
    </Dialog>
  );
}

GoToLobbyDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
