import React from "react";
import Button from "@mui/material/Button";
import { SvgIcon } from "../../SvgIcon";
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

function ShareScreenButton(props) {
  const { t } = useTranslation();

  return (
    <Tooltip
      title={props?.isScreenShared ? t("You are presenting") : t("Present now")}
      placement="top"
    >
      <CustomizedBtn
        className={props?.footer ? "footer-icon-button" : ""}
        id = "share-screen-button"
        onClick={() => {
          if (props?.isScreenShared) {
            props?.handleStopScreenShare();
          } else {
            props?.handleStartScreenShare();
            // send other that you are sharing screen.
          }
        }}
        variant="contained"
        color={props?.isScreenShared ? "primary" : "secondary"}
      >
        <SvgIcon
          color={props?.isScreenShared ? "#000" : "#fff"}
          size={40}
          name={"share-screen-off"}
        />
      </CustomizedBtn>
    </Tooltip>
  );
}

export default ShareScreenButton;
