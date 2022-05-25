import React from "react";
import Button from "@mui/material/Button";
import { SvgIcon } from "../../SvgIcon";
import Menu from "@mui/material/Menu";
import { styled } from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import { SettingsDialog } from "./SettingsDialog";
import { ListItemIcon, ListItemText, Tooltip } from "@mui/material";

const CustomizedBtn = styled(Button)(({ theme }) => ({
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
}));

function OptionButton({ footer, ...props }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // if you select camera then we are going to focus on camera button.
  const [selectFocus, setSelectFocus] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleDialogOpen = (focus) => {
    setSelectFocus(focus);
    setDialogOpen(true);
    handleClose();
  };

  const handleDialogClose = (value) => {
    setDialogOpen(false);
  };

  return (
    <>
      <SettingsDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        selectFocus={selectFocus}
      />
      <Tooltip title="More options" placement="top">
        <CustomizedBtn
          className={footer ? "footer-icon-button" : ""}
          id="demo-positioned-button"
          variant="contained"
          color={open ? "primary" : "secondary"}
          aria-controls={open ? "demo-positioned-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
        >
          <SvgIcon size={40} name={"option"} color={open ? "black" : "white"} />
        </CustomizedBtn>
      </Tooltip>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <MenuItem onClick={() => handleDialogOpen("camera")}>
          <ListItemIcon>
            <SvgIcon name={"camera"} color={"white"} />
          </ListItemIcon>
          <ListItemText>Camera settings</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDialogOpen("audio")}>
          <ListItemIcon>
            <SvgIcon name={"microphone"} color={"white"} />
          </ListItemIcon>
          <ListItemText>Microphone settings</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDialogOpen("report")}>
          <ListItemIcon>
            <SvgIcon name={"report"} color={"white"} />
          </ListItemIcon>
          <ListItemText>Report a problem</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export default OptionButton;
