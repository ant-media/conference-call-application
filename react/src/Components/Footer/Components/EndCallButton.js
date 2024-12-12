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
      width: 26,
    },
  },
}));

function EndCallButton({ footer, onLeaveRoom }) {
  const { t } = useTranslation();

  return (
      <Tooltip title={t("Leave call")} placement="top">
        <CustomizedBtn
            id="leave-room-button"
            onClick={onLeaveRoom}
            className={footer ? "footer-icon-button" : ""}
            variant="contained"
            color="error"
        >
          <SvgIcon size={28} name={"end-call"} />
        </CustomizedBtn>
      </Tooltip>
  );
}

export default EndCallButton;
