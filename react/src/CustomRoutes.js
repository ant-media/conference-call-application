import React from "react";
import {useTheme} from "@mui/material/styles";
import {Route, Routes} from "react-router-dom";
import {Grid} from "@mui/material";
import Home from "pages/Home";
import AntMedia from "pages/AntMedia";
import {isComponentMode} from "utils";

function CustomRoutes(props) {
  const theme = useTheme();

  console.log("CustomRoutes");

  if (isComponentMode()) {
    return (
      <Grid container style={{background: theme.palette.background}}>
        <Routes>
          <Route path="*" element={<AntMedia/>}/>
        </Routes>
      </Grid>
    );
  } else {
    return (
      <Grid container style={{background: theme.palette.background}}>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/:id" element={<AntMedia/>}/>
        </Routes>
      </Grid>
    )
  }
}

export default CustomRoutes;
