import React, { useContext } from "react";
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

function ShareScreenButton({ footer, ...props }) {
  const { t } = useTranslation();
  const conference = useContext(ConferenceContext);

  return (
    <Tooltip
      title={conference.isScreenShared ? t("You are presenting") : t("Present now")}
      placement="top"
    >
      <CustomizedBtn
        className={footer ? "footer-icon-button" : ""}
        onClick={() => {
          if (conference.isScreenShared) {
            conference.handleStopScreenShare();
          } else {
            conference.handleStartScreenShare();
            // send other that you are sharing screen.
          }
        }}
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
}

export default ShareScreenButton;
