import React, { useContext, useCallback } from "react";
import Button from "@mui/material/Button";
import { SvgIcon } from "../../SvgIcon";
import { ConferenceContext } from "pages/AntMedia";
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

const ShareScreenButton = React.memo(({ footer, ...props }) => {
  const { t } = useTranslation();
  const conference = useContext(ConferenceContext);

  // Memoized event handlers to avoid recreation on each render
  const toggleScreenShare = useCallback(() => {
    if (conference.isScreenShared) {
      conference.handleStopScreenShare();
    } else {
      conference.handleStartScreenShare();
      // send other that you are sharing screen.
    }
  }, [conference]);

  return (
    <Tooltip
      title={
        conference.isScreenShared ? t("You are presenting") : t("Present now")
      }
      placement="top"
    >
      <CustomizedBtn
        className={footer ? "footer-icon-button" : ""}
        id="share-screen-button"
        onClick={toggleScreenShare}
        variant="contained"
        color={conference.isScreenShared ? "primary" : "secondary"}
      >
        <SvgIcon
          color={conference.isScreenShared ? "black" : "white"}
          size={40}
          name={"share-screen-off"}
        />
      </CustomizedBtn>
    </Tooltip>
  );
});

export default ShareScreenButton;
