import {useTranslation} from "react-i18next";
import {Button, Container, Grid, TextField, Typography} from "@mui/material";
import {SettingsDialog} from "../Footer/Components/SettingsDialog";
import React from "react";
import {SvgIcon} from "../SvgIcon";
import {AntmediaContext} from "../../App";
import {useSnackbar} from "notistack";
import {useParams} from "react-router-dom";

function PlayOnlyModeWaitingRoom(props) {

    const { id } = useParams();
    const { t } = useTranslation();

    const roomName = id;
    const antmedia = React.useContext(AntmediaContext);
    const { enqueueSnackbar } = useSnackbar();

    function makeid(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    function joinRoom(e) {
        if (antmedia.mediaManager.localStream === null && antmedia.isPlayMode === false) {
            e.preventDefault();
            enqueueSnackbar(
                {
                    message: t(
                        "You need to allow microphone and camera permissions before joining"
                    ),
                    variant: "info",
                    icon: <SvgIcon size={24} name={"muted-microphone"} color="#fff" />,
                },
                {
                    autoHideDuration: 1500,
                }
            );
            return;
        }
        var generatedStreamId = props.streamName.replace(/[\W_]/g, "") + "_" + makeid(10);

        console.log("generatedStreamId:"+generatedStreamId);

        antmedia.joinRoom(roomName, generatedStreamId);
        props.handleChangeRoomStatus("meeting");
    }

    const { dialogOpen, setDialogOpen, selectFocus, setSelectFocus } = props;

    const handleDialogClose = (value) => {
        setDialogOpen(false);
    };

    return (
        <Container>
            <SettingsDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                selectFocus={selectFocus}
                handleBackgroundReplacement={props.handleBackgroundReplacement}
            />

            <Grid container justifyContent={"center"}>
                <Grid container justifyContent={"center"}>
                    <Typography variant="h5" align="center">
                        {t("What's your name?")}
                    </Typography>
                </Grid>
                <Grid
                    container
                    justifyContent={"center"}
                    sx={{mt: {xs: 1, md: 2.5}}}
                >
                    <Typography
                        variant="h6"
                        align="center"
                        fontWeight={"400"}
                        style={{fontSize: 18}}
                    >
                        {t(
                            "Please enter your name. This will be visible to the host and other participants."
                        )}{" "}
                    </Typography>
                </Grid>

                <form
                    onSubmit={(e) => {
                        joinRoom(e);
                    }}
                >
                    <Grid item xs={12} sx={{mt: 3, mb: 4}}>
                        <TextField
                            autoFocus
                            required
                            fullWidth
                            color="primary"
                            value={props.streamName}
                            variant="outlined"
                            onChange={(e) => props.handleStreamName(e.target.value)}
                            placeholder={t("Your name")}
                            id="participant_name"
                        />
                    </Grid>
                    <Grid container justifyContent={"center"}>
                        <Grid item sm={6} xs={12}>
                            <Button
                                fullWidth
                                color="secondary"
                                variant="contained"
                                type="submit"
                                id="room_join_button"
                            >
                                {t("I'm ready to join")}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Grid>
        </Container>
    );
}

export default PlayOnlyModeWaitingRoom;
