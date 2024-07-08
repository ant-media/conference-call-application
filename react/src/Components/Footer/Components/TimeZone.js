import React, { useState } from "react";

import { Typography } from "@mui/material";

function TimeZone(props) {
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
    <Typography color="#ffffff" variant="h6">
      {currentTime}
    </Typography>
  );
}

export default TimeZone;
