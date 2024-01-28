import React, { useContext } from "react";
import { SvgIcon } from "../../SvgIcon";
import { Tooltip } from "@mui/material";
import { useTranslation } from 'react-i18next';
import { ConferenceContext } from "pages/AntMedia";
import CustomizedButton from "./CustomizedButton";



const EndCallButton = React.memo(({ footer, ...props }) => {
  const conference = useContext(ConferenceContext);
  const { t } = useTranslation();
 
  return (
    <Tooltip title={t('Leave call')} placement="top">
      <CustomizedButton 
        id="leave-room-button"
        onClick={() => conference.setLeftTheRoom(true)} className={footer ? 'footer-icon-button' : ''} variant="contained" color="error">
        <SvgIcon size={28} name={"end-call"} />
      </CustomizedButton>
    </Tooltip>
  );
})

export default EndCallButton;
