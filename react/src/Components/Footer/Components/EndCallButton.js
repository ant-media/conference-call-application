import React from "react";
import Button from "@mui/material/Button";
import { SvgIcon } from "../../SvgIcon";
// import { AntmediaContext } from "App";
import { Tooltip } from "@mui/material";
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from "react-router-dom";

const CustomizedBtn = styled(Button)(({ theme }) => ({
  '&.footer-icon-button': {

    height: '100%',
    [theme.breakpoints.down('sm')]: {
      padding: 8,
      minWidth: 'unset',
      width: '100%',
    },
    '& > svg': {
      width: 26
    },
  }
}));


function EndCallButton({ footer, ...props }) {
  // const antmedia = useContext(AntmediaContext);
  const { id } = useParams();
  const { t } = useTranslation();
  // const exit = () => {
  //   antmedia.handleLeaveFromRoom();

  // }
  return (
    <Tooltip title={t('Leave call')} placement="top">
      <CustomizedBtn component={Link} to={`/${id}/left-the-room`} className={footer ? 'footer-icon-button' : ''} variant="contained" color="error">
        <SvgIcon size={28} name={"end-call"} />
      </CustomizedBtn>
    </Tooltip>
  );
}

export default EndCallButton;
