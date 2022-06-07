import React, { useContext } from "react";
import Button from "@mui/material/Button";
import { SvgIcon } from "../../SvgIcon";
import { AntmediaContext } from "App";
import { MediaSettingsContext } from "pages/AntMedia";
import { Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
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

function ShareScreenButton({ footer, ...props }) {
  const { t } = useTranslation();
  const antmedia = useContext(AntmediaContext);
  const { isScreenShared } = useContext(MediaSettingsContext);

  return (
    <Tooltip
      title={isScreenShared ? t("You are presenting") : t("Present now")}
      placement="top"
    >
      <CustomizedBtn
        className={footer ? "footer-icon-button" : ""}
        onClick={() => {
          if (isScreenShared) {
            antmedia.handleStopScreenShare();
          } else {
            antmedia.handleStartScreenShare();
            // send other that you are sharing screen.
          }
        }}
        variant="contained"
        color={isScreenShared ? "primary" : "secondary"}
      >
        <SvgIcon
          color={isScreenShared ? "black" : "white"}
          size={40}
          name={"share-screen-off"}
        />
      </CustomizedBtn>
    </Tooltip>
  );
}

export default ShareScreenButton;
