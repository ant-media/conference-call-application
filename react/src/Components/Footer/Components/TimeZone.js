import React, { useState } from "react";

import { Typography } from "@mui/material";
import {AntmediaContext} from "../../../App";

function TimeZone(props) {
  const antmedia = React.useContext(AntmediaContext);

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
        {antmedia.isBroadcasting === true ? (
        <Typography color="#FF0000" variant="h6">
          Live
        </Typography>) : null}
        <Typography color="#ffffff" variant="h6">
          {currentTime}
        </Typography>
      </div>
  );
}

export default TimeZone;
