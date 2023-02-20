import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import {SvgIcon} from "./SvgIcon";
import {SettingsContext} from "../pages/AntMedia";
import {styled} from "@mui/material/styles";
import Button from "@mui/material/Button";
import {useContext} from "react";
import {AntmediaContext} from "../App";

const ITEM_HEIGHT = 48;

function ParticipantOptionsButton(props) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const { videoId } = props;

    const antmedia = useContext(AntmediaContext);

    const settings = React.useContext(SettingsContext);

    const { pinnedVideoId, pinVideo } = settings;

    const Btn = styled(Button)(({ theme }) => ({
        "&:hover": {
            backgroundColor: theme.palette.green[50],
        },
    }));
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMuteParticipant = () => {
        let data = JSON.stringify({
            streamId: videoId,
            eventType: "REQUEST",
            command: "muteMicrophone",
            date: new Date().toString()
        });
        antmedia.handleSendModerateMessage(data);
        handleClose();
    }

    const handleCloseCamera = () => {
        let data = JSON.stringify({
            streamId: videoId,
            eventType: "REQUEST",
            command: "closeCamera",
            date: new Date().toString()
        });
        antmedia.handleSendModerateMessage(data);
        handleClose();
    }

    const handleRemoveFromMeeting = () => {
        let data = JSON.stringify({
            streamId: videoId,
            eventType: "REQUEST",
            command: "removeFromMeeting",
            date: new Date().toString()
        });
        antmedia.handleSendModerateMessage(data);
        handleClose();
    }

    return (
        <div sx={{ minWidth: "unset", pt: 1, pb: 1 }}>
            <IconButton
                aria-label="more"
                id="long-button"
                aria-controls={open ? 'long-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
                onClick={handleClick}
            >
                <SvgIcon size={28} name="morevert" color="#fff" />
            </IconButton>
            <Menu
                id="long-menu"
                MenuListProps={{
                    'aria-labelledby': 'long-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    style: {
                        maxHeight: ITEM_HEIGHT * 4.5,
                        width: '30ch',
                    },
                }}
            >
                {pinnedVideoId === videoId ? (
                    <Btn
                        sx={{ minWidth: "unset", pt: 1, pb: 1 }}
                        onClick={() => pinVideo(videoId)}
                    >
                        <SvgIcon size={28} name="unpin" color="#fff" /> <span style={{color: 'white'}}>Unpin Participant</span>
                    </Btn>
                ) : (
                    <Btn
                        sx={{ minWidth: "unset", pt: 1, pb: 1 }}
                        onClick={() => pinVideo(videoId)}
                    >
                        <SvgIcon size={28} name="pin" color="#fff" /> <span style={{color: 'white'}}>Pin Participant</span>
                    </Btn>
                )}

                <Btn
                    sx={{ minWidth: "unset", pt: 1, pb: 1 }}
                    onClick={() => handleMuteParticipant(videoId)}
                >
                    <SvgIcon size={28} name="muted-microphone" color="#fff" /> <span style={{color: 'white'}}>Mute Participant</span>
                </Btn>

                <Btn
                    sx={{ minWidth: "unset", pt: 1, pb: 1 }}
                    onClick={() => handleCloseCamera(videoId)}
                >
                    <SvgIcon size={28} name="camera-off" color="#fff" /> <span style={{color: 'white'}}>Close Camera</span>
                </Btn>

                <Btn
                    sx={{ minWidth: "unset", pt: 1, pb: 1 }}
                    onClick={() => handleRemoveFromMeeting(videoId)}
                >
                    <SvgIcon size={28} name="block" color="#fff" /> <span style={{color: 'white'}}>Remove from the meeting</span>
                </Btn>
            </Menu>
        </div>
    );
}

export default ParticipantOptionsButton;
