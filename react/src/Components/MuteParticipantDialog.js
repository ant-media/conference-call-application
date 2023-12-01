import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import {useContext} from "react";
import {ConferenceContext} from "../pages/AntMedia";
import {useTranslation} from "react-i18next";

export default function MuteParticipantDialog() {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const conference = useContext(ConferenceContext);
    const { t } = useTranslation();

    const handleClose = () => {
        conference?.setMuteParticipantDialogOpen(false);
        conference?.setParticipantNameMuted("-");
    };

    const handleMute = () => {
        conference?.setMuteParticipantDialogOpen(false);
        conference?.turnOffYourMicNotification(conference?.participantNameMuted);
        conference?.setParticipantNameMuted("-");
    }

    return (
            <Dialog
                fullScreen={fullScreen}
                open={conference?.isMuteParticipantDialogOpen}
                onClose={handleClose}
                aria-labelledby="responsive-dialog-title"
            >
                <DialogContent>
                    <DialogContentText>
                        Mute {conference?.participantNameMuted} for everyone in the call? Only {conference?.participantNameMuted} can unmute themselves.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button autoFocus onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleMute} autoFocus>
                        Mute
                    </Button>
                </DialogActions>
            </Dialog>
    );
}