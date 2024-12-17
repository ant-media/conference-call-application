import React from "react";
import Button from "@mui/material/Button";
import { styled, useTheme } from "@mui/material/styles";
import { SvgIcon } from "../../SvgIcon";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack-v2-maintained";

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

function CameraButton(props) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const handleCameraToggle = (e, isTurningOff) => {
    e.stopPropagation();

    enqueueSnackbar({
      message: isTurningOff
          ? t("Camera turned off")
          : t("Camera turned on"),
      variant: "info",
      icon: (
          <SvgIcon
              size={24}
              name={isTurningOff ? "camera-off" : "camera"}
              color="#fff"
          />
      ),
    }, {
      autoHideDuration: 1500,
    });

    if (isTurningOff) {
        props?.onTurnOnCamera();
    } else {
        props?.onTurnOffCamera();
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
            className={props?.footer ? "footer-icon-button" : ""}
            variant="contained"
            color={props?.isCamTurnedOff ? "error" : "primary"}
            sx={props?.rounded ? roundStyle : {}}
            disabled={props?.cameraButtonDisabled}
            onClick={(e) => handleCameraToggle(e, props?.isCamTurnedOff)}
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
