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

export function UnauthrorizedDialog(props) {
  const { t } = useTranslation();
  const { onClose, open, onExitClicked } = props;


  const handleClose = (event, reason) => {
    onClose();
  };



  const exitClicked = (e) =>{
    onExitClicked()

  }

  return (
    <Dialog onClose={handleClose} open={open}  maxWidth={'sm'}>
      <AntDialogTitle onClose={handleClose}>{t('You are unauthorized to join this room.')}</AntDialogTitle>
      <DialogContent>


        <Button
                  style={{marginTop:'35px'}}

            onClick={exitClicked}
            size='medium'
            color="secondary"
            variant="contained"
            type="submit"
            id="exit_button"
        >
        {t("Exit")}
        </Button>


      </DialogContent>
    </Dialog>
  );
}

UnauthrorizedDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
