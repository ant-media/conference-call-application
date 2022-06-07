import React, { useContext } from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { SvgIcon } from "../../SvgIcon";
import { AntmediaContext } from "App";
import { MediaSettingsContext } from "pages/AntMedia";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

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

  const antmedia = useContext(AntmediaContext);
  const mediaSettings = useContext(MediaSettingsContext);

  const handleOff = (e) => {
    e.stopPropagation();
    if (!mediaSettings?.isScreenShared) {
      mediaSettings?.toggleSetCam({
        eventStreamId: "localVideo",
        isCameraOn: false,
      });
      if (props?.myLocalData?.streamId) {
        antmedia.turnOffLocalCamera(props.myLocalData.streamId);
        antmedia.handleSendNotificationEvent(
          "CAM_TURNED_OFF",
          props.myLocalData.streamId
        );
      } else {
        // if local
        antmedia.turnOffLocalCamera("localVideo");
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
      antmedia.turnOnLocalCamera(props.myLocalData.streamId);
      antmedia.handleSendNotificationEvent(
        "CAM_TURNED_ON",
        props.myLocalData.streamId
      );
    } else {
      // if local
      antmedia.turnOnLocalCamera("localVideo");
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
        <Tooltip title={t("Turn off camera")} placement="top">
          <CustomizedBtn
            className={footer ? "footer-icon-button" : ""}
            variant="contained"
            color="primary"
            sx={rounded ? roundStyle : {}}
            onClick={(e) => handleOff(e)}
          >
            <SvgIcon size={40} name={"camera"} />
          </CustomizedBtn>
        </Tooltip>
      ) : (
        <Tooltip title={t("Turn on camera")} placement="top">
          <CustomizedBtn
            className={footer ? "footer-icon-button" : ""}
            variant="contained"
            color="secondary"
            sx={rounded ? roundStyle : {}}
            onClick={(e) => handleOn(e)}
          >
            <SvgIcon size={40} name={"camera-off"} />
          </CustomizedBtn>
        </Tooltip>
      )}
    </>
  );
}

export default MicButton;
