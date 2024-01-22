/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import {styled, useTheme} from "@mui/material/styles";
import {ConferenceContext} from "pages/AntMedia";
import {Theme} from "@mui/system";
import {t} from "i18next";

const CustomizedAvatar = styled(Avatar)((theme: Theme) => ({
  border: `3px solid ${theme.palette.themeColor[85]} !important`,
  color: "#fff",
  width: 44,
  height: 44,
  [theme.breakpoints.down("md")]: {
    width: 34,
    height: 34,
    fontSize: 16,
  },
}));

const CustomizedAvatarGroup = styled(AvatarGroup)((theme: Theme) => ({
  "& div:not(.regular-avatar)": {
    border: `3px solid ${theme.palette.themeColor[85]} !important`,
    backgroundColor: theme.palette.themeColor[80],
    color: "#fff",
    width: 44,
    height: 44,
    [theme.breakpoints.down("md")]: {
      width: 34,
      height: 34,
      fontSize: 14,
    },
  },
}));


function OthersCard(props: { playingParticipants: any[]; }) {
  const conference = React.useContext(ConferenceContext)
  const theme: Theme = useTheme();

  const othersNames = [];

  for (const [streamId, broadcastObject] of Object.entries(conference.allParticipants)) {
    if (streamId !== conference.publishStreamId && !props.playingParticipants.find(e => e.streamId === streamId)) {
      othersNames.push(broadcastObject.name);
    }
  }

  const others = othersNames;//.sort();

  return (
    <div className="others-tile-inner" style={{background: theme.palette.themeColor[70]}}>
      <CustomizedAvatarGroup sx={{justifyContent: "center"}}>
        {others.map(({username}, index) => {
          if (username?.length > 0) {
            const nameArr = username.split(" ");
            const secondLetter = nameArr.length > 1 ? nameArr[1][0] : "";
            const initials =
              `${nameArr[0][0]}${secondLetter}`.toLocaleUpperCase();

            return (
              <CustomizedAvatar
                key={index}
                alt={username}
                className="regular-avatar"
                sx={{
                  bgcolor: "green.50",
                  color: "#fff",
                  fontSize: {xs: 16, md: 22},
                }}
              >
                {initials}
              </CustomizedAvatar>
            );
          } else {
            return null;
          }
        })}
      </CustomizedAvatarGroup>
      <Typography sx={{mt: 2, color: "#ffffff"}}>
        {others.length} {others.length > 1 ? t("Others") : t("Other")}
      </Typography>
    </div>
  );
};

export default OthersCard;
