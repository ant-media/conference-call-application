import React from "react";
import { SvgIcon } from "../../SvgIcon";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import {CustomizedBtn} from "../../CustomizedBtn";

function EndCallButton(props) {
  const { t } = useTranslation();

  return (
      <Tooltip title={t("Leave call")} placement="top">
        <CustomizedBtn
            id="leave-room-button"
            onClick={props?.onLeaveRoom}
            className={props?.footer ? "footer-icon-button" : ""}
            variant="contained"
            color="error"
        >
          <SvgIcon size={28} name={"end-call"} />
        </CustomizedBtn>
      </Tooltip>
  );
}

export default EndCallButton;
