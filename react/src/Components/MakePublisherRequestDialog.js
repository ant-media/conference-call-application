import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {AntmediaContext} from "../App";

function MakePublisherRequestDialog(participantId, participantName) {
    const [open, setOpen] = React.useState(false);
    const antmedia = React.useContext(AntmediaContext);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleApprove = () => {
        let data = JSON.stringify({
            streamId: participantId,
            eventType: "REQUEST",
            command: "approvePublisherRequest",
            date: new Date().toString()
        });
        antmedia.handleSendModerateMessage(data);
        setOpen(false);
    }

    const handleDeny = () => {
        let data = JSON.stringify({
            streamId: participantId,
            eventType: "REQUEST",
            command: "denyPublisherRequest",
            date: new Date().toString()
        });
        antmedia.handleSendModerateMessage(data);
        setOpen(false);
    }

    return (
        <div>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Publisher Request"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Participant {participantName} wants to be a publisher.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeny}>Deny</Button>
                    <Button onClick={handleApprove} Approve>
                        Agree
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default MakePublisherRequestDialog;
