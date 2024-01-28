import Button from "@mui/material/Button";
import React from "react";
import { styled } from "@mui/material/styles";

const CustomizedButton = React.memo(styled(Button)(({ theme }) => ({
    "&.footer-icon-button": {
      height: "100%",
      [theme.breakpoints.down("sm")]: {
        padding: 8,
        minWidth: "unset",
        width: "100%",
        "& > svg": {
          width: 36,
        },
      },
    },
  })));

  export default CustomizedButton;
