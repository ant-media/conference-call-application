import React, { useContext } from "react";
import { SvgIcon } from "../../SvgIcon";
import { ConferenceContext } from "pages/AntMedia";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import CustomizedButton from "./CustomizedButton";



function CameraButton(props) {
  const { rounded, footer } = props;
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const conference = useContext(ConferenceContext);

  const handleOff = React.useCallback((e) => {
    e.stopPropagation();
    if (conference.isPlayOnly === null) {
      enqueueSnackbar({
        message: t('You need to allow camera and microphone permissions turning off your camera'),
        variant: 'info',
        icon: <SvgIcon size={24} name={'muted-microphone'} color="#fff" />
      }, {
        autoHideDuration: 1500,
      });
      return
    }
    if (!conference.isScreenShared) {
      if (conference.publishStreamId) {
        conference.checkAndTurnOffLocalCamera(conference.publishStreamId);
        conference.handleSendNotificationEvent(
          "CAM_TURNED_OFF",
          conference.publishStreamId
        );
      } else {
        // if local
        conference.checkAndTurnOffLocalCamera("localVideo");
      }
    }
  }, [conference, enqueueSnackbar, t]);

  const handleOn = React.useCallback((e) => {
    e.stopPropagation();
    if (conference.publishStreamId) {
      conference.checkAndTurnOnLocalCamera(conference.publishStreamId);
      conference.handleSendNotificationEvent(
        "CAM_TURNED_ON",
        conference.publishStreamId
      );
    } else {
      // if local
      conference.checkAndTurnOnLocalCamera("localVideo");
    }
  },[conference]);
  
  const roundStyle = {
    width: { xs: 36, md: 46 },
    height: { xs: 36, md: 46 },
    minWidth: "unset",
    maxWidth: { xs: 36, md: 46 },
    maxHeight: { xs: 36, md: 46 },
    borderRadius: "50%",
    padding: "4px",
  };

  return (
    <>
      {conference?.isMyCamTurnedOff ? (
        <Tooltip title={conference.isScreenShared ? t('Camera is disabled while screensharing') : t('Turn on camera')} placement="top">
          <CustomizedButton 
            id="camera-button"
            className={footer ? 'footer-icon-button' : ''} variant="contained" color="error" sx={rounded ? roundStyle : {}} disabled={conference.isScreenShared} onClick={handleOn}>
            <SvgIcon size={40} name={'camera-off'} color="#fff" />
          </CustomizedButton>
        </Tooltip>
      ) : (
        <Tooltip title={conference.isScreenShared ? t('Camera is disabled while screensharing') : t('Turn off camera')} placement="top">
          <CustomizedButton 
            id="camera-button"
            className={footer ? 'footer-icon-button' : ''} variant="contained" color="primary" sx={rounded ? roundStyle : {}} disabled={conference.isScreenShared} onClick={handleOff}>
            <SvgIcon size={40} name={'camera'} color='inherit' />
          </CustomizedButton>
        </Tooltip>
      )}
    </>
  );
}

export default CameraButton;
