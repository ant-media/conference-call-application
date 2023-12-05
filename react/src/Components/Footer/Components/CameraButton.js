import React, { useContext } from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { SvgIcon } from "../../SvgIcon";
import { AntmediaContext } from "App";
import { MediaSettingsContext } from "pages/AntMedia";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";


const CustomizedBtn = styled(Button)(({ theme }) => ({
  "&.footer-icon-button": {
    height: "100%",
    [theme.breakpoints.down("sm")]: {
      padding: 8,
      minWidth: "unset",
      width: "100%",
    },
    "& > svg": {
      width: 36,
    },
  },
}));

function MicButton(props) {
  const { rounded, footer } = props;
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const antmedia = useContext(AntmediaContext);
  const mediaSettings = useContext(MediaSettingsContext);
  const { isScreenShared } = mediaSettings;

  const handleOff = (e) => {
    e.stopPropagation();
    if (antmedia.mediaManager.localStream === null) {
      enqueueSnackbar({
        message: t('You need to allow camera and microphone permissions turning off your camera'),
        variant: 'info',
        icon: <SvgIcon size={24} name={'muted-microphone'} color="#fff" />
      }, {
        autoHideDuration: 1500,
      });
      return
    }
    if (!isScreenShared) {
      mediaSettings?.toggleSetCam({
        eventStreamId: "localVideo",
        isCameraOn: false,
      });
      if (props?.myLocalData?.streamId) {
        antmedia.checkAndTurnOffLocalCamera(props.myLocalData.streamId);
        antmedia.handleSendNotificationEvent(
          "CAM_TURNED_OFF",
          props.myLocalData.streamId
        );
      } else {
        // if local
        antmedia.checkAndTurnOffLocalCamera("localVideo");
      }
    }
  };
  const handleOn = (e) => {
    e.stopPropagation();
    mediaSettings?.toggleSetCam({
      eventStreamId: "localVideo",
      isCameraOn: true,
    });

    if (props?.myLocalData?.streamId) {
      antmedia.checkAndTurnOnLocalCamera(props.myLocalData.streamId);
      antmedia.handleSendNotificationEvent(
        "CAM_TURNED_ON",
        props.myLocalData.streamId
      );
    } else {
      // if local
      antmedia.checkAndTurnOnLocalCamera("localVideo");
    }
  };
  const roundStyle = {
    width: { xs: 36, md: 46 },
    height: { xs: 36, md: 46 },
    minWidth: "unset",
    maxWidth: { xs: 36, md: 46 },
    maxHeight: { xs: 36, md: 46 },
    borderRadius: "50%",
    padding: "4px",
  };

  const cam = mediaSettings?.cam?.find((m) => m.eventStreamId === "localVideo");

  return (
    <>
      {cam && cam.isCameraOn ? (
        <Tooltip title={isScreenShared ? t('Camera is disabled while screensharing') : t('Turn off camera')} placement="top">
          <CustomizedBtn className={footer ? 'footer-icon-button' : ''} variant="contained" color="primary" sx={rounded ? roundStyle : {}} disabled={isScreenShared} onClick={(e) => handleOff(e)}>
            <SvgIcon size={40} name={'camera'} color='inherit' />
          </CustomizedBtn>
        </Tooltip>
      ) : (
        <Tooltip title={isScreenShared ? t('Camera is disabled while screensharing') : t('Turn on camera')} placement="top">
          <CustomizedBtn className={footer ? 'footer-icon-button' : ''} variant="contained" color="error" sx={rounded ? roundStyle : {}} disabled={isScreenShared} onClick={(e) => handleOn(e)}>
            <SvgIcon size={40} name={'camera-off'} color="#fff" />
          </CustomizedBtn>
        </Tooltip>
      )}
    </>
  );
}

export default MicButton;
