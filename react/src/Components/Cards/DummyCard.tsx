import React from "react";
import {Avatar, Grid} from "@mui/material";
import {useTheme} from "@mui/material/styles";
import {Theme} from "@mui/system";

const defaultAvatar = require("../../static/images/defaultAvatar.png") as string;

function DummyCard() {
  const theme: Theme = useTheme();

  return (
    <Grid
      container
      style={{
        background: theme.palette.themeColor[70],
        borderRadius: 4,
        height: "100%",
      }}
      justifyContent="center"
      alignItems={"center"}
    >
      <Avatar src={defaultAvatar}
              style={{width: '20%', height: 'auto', aspectRatio: '1 / 1', maxWidth: 128, maxHeight: 128}}/>{" "}
    </Grid>
  );
}

export default DummyCard;
