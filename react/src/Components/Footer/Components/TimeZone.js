import React, { useState } from "react";

import { Typography } from "@mui/material";
import { ConferenceContext } from "pages/AntMedia";
import {useTheme} from "@mui/material/styles";

function TimeZone(props) {
  const conference = React.useContext(ConferenceContext);
  const theme = useTheme();

  let time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  let [currentTime, changeTime] = useState(time);
  function checkTime() {
    time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    changeTime(time);
  }
  setInterval(checkTime, 1000);
  return (
    <div>
      {conference?.isRecordPluginActive === true ? (
            <Typography color="#FF0000" variant="h6">
              Meeting is being recorded
            </Typography>) : null}
      {process.env.REACT_APP_TIME_ZONE_LIVE_TEXT_VISIBILITY === "true" && conference?.isBroadcasting === true ? (
          <Typography color="#FF0000" variant="h6">
            Live
          </Typography>) : null}
    <Typography color={theme.palette.text.primary} variant="h6">
      {currentTime}
    </Typography>
    </div>
  );
}

export default TimeZone;
