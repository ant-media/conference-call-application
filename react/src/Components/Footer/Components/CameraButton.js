import React from "react";
import Button from "@mui/material/Button";
import { styled, useTheme } from "@mui/material/styles";
import { SvgIcon } from "../../SvgIcon";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from 'notistack';
import {CustomizedBtn} from "../../CustomizedBtn";

function CameraButton(props) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const handleCameraToggle = (e, isTurningOff) => {
    e.stopPropagation();

    // Combine message and icon into a React Node
    const notificationContent = (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SvgIcon
              size={24}
              name={isTurningOff ? "camera-off" : "camera"}
              color="#fff"
          />
          {isTurningOff ? t("Camera turned off") : t("Camera turned on")}
        </div>
    );

    enqueueSnackbar(notificationContent, {
      variant: "info",
      autoHideDuration: 1500,
    });

    if (isTurningOff) {
      props?.onTurnOffCamera();
    } else {
      props?.onTurnOnCamera();
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

  return (
      <Tooltip
          title={t(props?.isCamTurnedOff ? "Turn on camera" : "Turn off camera")}
          placement="top"
      >
        <CustomizedBtn
            id="camera-button"
            data-testid="camera-button"
            className={props?.footer ? "footer-icon-button" : ""}
            variant="contained"
            color={props?.isCamTurnedOff ? "error" : "primary"}
            sx={props?.rounded ? roundStyle : {}}
            disabled={props?.cameraButtonDisabled}
            onClick={(e) => handleCameraToggle(e, !props?.isCamTurnedOff)}
        >
          <SvgIcon
              size={40}
              name={props?.isCamTurnedOff ? "camera-off" : "camera"}
              color={
                  props?.isCamTurnedOff
                    ? theme.palette?.iconColor?.primary
                    : theme.palette?.darkIconColor?.primary
              }
          />
        </CustomizedBtn>
      </Tooltip>
  );
}

export default CameraButton;
