import React, { useContext } from "react";
import Button from "@mui/material/Button";
import { SvgIcon } from "../../SvgIcon";
// import { AntmediaContext } from "App";
import { Tooltip } from "@mui/material";
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { MediaSettingsContext, SettingsContext } from "../../../pages/AntMedia";
import {

  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,

} from "@mui/material";
import { AntmediaContext, restBaseUrl } from "../../../App";

const CustomizedBtn = styled(Button)(({ theme }) => ({
  '&.footer-icon-button': {

    height: '100%',
    [theme.breakpoints.down('sm')]: {
      padding: 8,
      minWidth: 'unset',
      width: '100%',
    },
    '& > svg': {
      width: 26
    },
  }
}));


function EndCallButton({ footer, ...props }) {


  const webRTCAdaptor = useContext(AntmediaContext);
  const [openConfirmationDialog, setOpenConfirmationDialog] = React.useState(false);

  const { leftTheRoom, setLeftTheRoom, allParticipants } = useContext(MediaSettingsContext);

  const { presenters, makeListenerAgain, makeParticipantUndoPresenter, approvedSpeakerRequestList, setPresenters } = useContext(SettingsContext);


  const endCall = () => 
  {
    if (webRTCAdaptor.admin && (presenters.length > 0 || approvedSpeakerRequestList.length > 0)) 
    {
      setOpenConfirmationDialog(true);
    }
    else 
    {
      setLeftTheRoom(true);
    }
  };

  const handleClose = () => {
    setOpenConfirmationDialog(false); 
  };

  function deleteFromRoom(roomName, streamId) 
  {
      var requestOptions = {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      };

      return fetch(restBaseUrl + "/rest/v2/broadcasts/" + roomName + "/subtrack?id=" + streamId, requestOptions)
        .then((response) => response.json())
        .then((result) => 
        {
          console.log("subtrack remove status: " + result.success + " streamId: " + streamId);
          requestOptions = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          };

          return fetch( restBaseUrl + "/rest/v2/broadcasts/conference-rooms/" + roomName + "/delete?streamId=" + streamId, requestOptions)
          .then((response) => response.json())
          .then( (result) => {
            console.log("delete stream from room status: " + result.success + " streamId: " + streamId);
          });
        
      });
}

  const handleExitAllRooms = () => {
    //get streams from listener room
    
    //delete streams from listener room
    
   
    var listenerRoom = webRTCAdaptor.roomName + "listener";
    console.log("presenters.length: " + presenters.length)
    console.log("approved speaker list length: " + approvedSpeakerRequestList.length);
    //get streams from speaker room
    for (let presenter of presenters) 
    {
      makeParticipantUndoPresenter(presenter)
      console.log("presenter: " + presenter + " roomname: " + webRTCAdaptor.roomName);
    }

    for (let approvedSpeaker of approvedSpeakerRequestList) 
    {
      makeListenerAgain(approvedSpeaker)
      console.log("approvedSpeaker : " + approvedSpeaker + " roomname: " + webRTCAdaptor.roomName);
    }
    //delete streams from speaker room
    setPresenters([]);
    setOpenConfirmationDialog(false);
    setLeftTheRoom(true);
    
    
  }

  const { t } = useTranslation();
  // const exit = () => {
  //   antmedia.handleLeaveFromRoom();

  // }
  return (
    <>
    <Tooltip title={t('Leave call')} placement="top">
      <CustomizedBtn onClick={() => endCall() /*setLeftTheRoom(true)*/ } className={footer ? 'footer-icon-button' : ''} variant="contained" color="error">
        <SvgIcon size={28} name={"end-call"} />
      </CustomizedBtn>
    </Tooltip>
     <Dialog
          open={openConfirmationDialog}
          aria-labelledby="scroll-dialog-title"
          aria-describedby="scroll-dialog-description"
      >
        <DialogTitle> Closing Call </DialogTitle>
     <DialogContent
         id="scroll-dialog-description"
         ref={null}
         tabIndex={-1}
     >
      Speakers in the listener room will also be removed. Are you sure to proceed?
     </DialogContent>
   <DialogActions>
     <Button onClick={handleClose}>Cancel</Button>
     <Button onClick={handleExitAllRooms}>OK</Button>
   </DialogActions>
 </Dialog>
 </>
  );
}

export default EndCallButton;
