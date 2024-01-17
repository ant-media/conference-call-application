import React from "react";
import { useTheme } from "@mui/material/styles";
import { Routes, Route } from "react-router-dom";
import { Grid } from "@mui/material";
import Home from "pages/Home";
import AntMedia from "pages/AntMedia";
import { getRoomNameAttribute } from "utils";
import {ThemeList} from "./styles/themeList";

function isComponent() {
    return getRoomNameAttribute();
}

function CustomRoutes(props) {
  const theme = useTheme();

  console.log("CustomRoutes");

  if (isComponent()) {
      return (
          <Grid container style={{background: theme.palette.background}}>
              <Routes>
                  <Route path="/" element={<AntMedia/>}/>
              </Routes>
          </Grid>
      );
  } else {
      return (
          <Grid container style={{ background: theme.palette.background }}>
              <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/:id" element={<AntMedia />} />
              </Routes>
          </Grid>
      )
  }
}

export default CustomRoutes;
