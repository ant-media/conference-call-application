import React from "react";
import {Avatar, Grid} from "@mui/material";
import defaultAvatar from "../../static/images/defaultAvatar.png";
import {useTheme} from "@mui/material/styles";

function DummyCard() {
  const theme = useTheme();

  return (
    <Grid
      container
      style={{
        background: theme.palette.themeColor?.[72],
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
