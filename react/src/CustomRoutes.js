import React from "react";
import { useTheme } from "@mui/material/styles";
import { Routes, Route } from "react-router-dom";
import { Grid } from "@mui/material";
import Home from "pages/Home";
import AntMedia from "pages/AntMedia";

function CustomRoutes(props) {
  const theme = useTheme();

  return (
    <Grid container style={{ background: theme.palette.background }}>   
    <AntMedia />   
   
    </Grid>
  );
}
/*
  <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/" element={} />
      </Routes>
      */
export default CustomRoutes;