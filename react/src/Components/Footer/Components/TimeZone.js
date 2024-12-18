import React from "react";

import { Typography } from "@mui/material";
import {useTheme} from "@mui/material/styles";

function TimeZone({ isBroadcasting }) {
  const theme = useTheme();

  let time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  let [currentTime, changeTime] = React.useState(time);
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
      {process.env.REACT_APP_TIME_ZONE_LIVE_TEXT_VISIBILITY === "true" && isBroadcasting === true ? (
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
