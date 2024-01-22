import React from "react";
import {useTheme} from "@mui/material/styles";
import {Route, Routes} from "react-router-dom";
import {Grid} from "@mui/material";
// @ts-ignore
import Home from "pages/Home";
// @ts-ignore
import AntMedia from "pages/AntMedia";
// @ts-ignore
import {getRoomNameAttribute} from "utils";
import {Theme} from "@mui/system";

function isComponent() {
  return getRoomNameAttribute();
}

function CustomRoutes(props: any) : React.JSX.Element {
  const theme: Theme = useTheme();

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
