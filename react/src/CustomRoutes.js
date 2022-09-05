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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:id" element={<AntMedia />} />
      </Routes>
    </Grid>
  );
}

export default CustomRoutes;
