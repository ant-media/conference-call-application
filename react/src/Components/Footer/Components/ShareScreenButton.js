import React, { useContext, useCallback } from "react";
import { SvgIcon } from "../../SvgIcon";
import { ConferenceContext } from "pages/AntMedia";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import CustomizedButton from "./CustomizedButton";


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
      <CustomizedButton
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
      </CustomizedButton>
    </Tooltip>
  );
});

export default ShareScreenButton;
