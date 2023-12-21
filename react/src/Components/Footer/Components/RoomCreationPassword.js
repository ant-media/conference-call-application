import * as React from 'react';
import PropTypes from 'prop-types';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import Input from '@mui/material/Input';
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
          <SvgIcon size={30} name={'close'} color={'white'} />
        </Button>
      ) : null}
    </DialogTitle>
  );
};

export function RoomCreationPassword(props) {
  const { t } = useTranslation();
  const { onClose, password, onPasswordChange, open, onCreateRoomClicked, roomName, onRoomNameChange } = props;

  const handleClose = (event, reason) => {
    onClose();
  };
 

  const handlePasswordChange = (event) => {
    onPasswordChange(event.target.value); // Update password state in the parent
  };

  const handleRoomNameChange = (event) =>{
    onRoomNameChange(event.target.value)
  }

  const createRoomClicked = (e) =>{
    onCreateRoomClicked()

  }

  return (
    <Dialog onClose={handleClose} open={open}  maxWidth={'sm'}>
      <AntDialogTitle onClose={handleClose}>{t('Room creation requires password. Type room name and room creation password')}</AntDialogTitle>
      <DialogContent>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Input
          type='text'
          value={roomName}
          onChange={handleRoomNameChange}
          placeholder="Enter room name"
        />
      <Input
          style={{marginTop:'15px'}}
          type='password'
          value={password}
          onChange={handlePasswordChange}
          placeholder="Enter password"
        />

        </div>
   

        <Button
                  style={{marginTop:'35px'}}

            onClick={createRoomClicked}
            size='medium'
            color="secondary"
            variant="contained"
            type="submit"
            id="create_room_button"
        >
        {t("Create Room")}
        </Button>


      </DialogContent>
    </Dialog>
  );
}

RoomCreationPassword.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
