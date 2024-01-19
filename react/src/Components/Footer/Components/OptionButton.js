import React, { useState, useContext, useCallback } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { styled } from "@mui/material/styles";
import { ListItemIcon, ListItemText, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ConferenceContext } from 'pages/AntMedia';
import { SettingsDialog }  from "./SettingsDialog";
import LayoutSettingsDialog from "./LayoutSettingsDialog";
import { SvgIcon } from "Components/SvgIcon";

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

const OptionButton = React.memo(({ footer }) => {
  const conference = useContext(ConferenceContext);
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [layoutDialogOpen, setLayoutDialogOpen] = useState(false);
  const [selectFocus, setSelectFocus] = useState(null);

  const handleClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleDialogOpen = useCallback((focus) => {
    setSelectFocus(focus);
    setDialogOpen(true);
    handleClose();
  }, [handleClose]);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleLayoutDialogOpen = useCallback((focus) => {
    setSelectFocus(focus);
    setLayoutDialogOpen(true);
    handleClose();
  }, [handleClose]);

  const handleLayoutDialogClose = useCallback(() => {
    setLayoutDialogOpen(false);
  }, []);

  return (
    <>
      <SettingsDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        selectFocus={selectFocus}
      />
      <LayoutSettingsDialog
        open={layoutDialogOpen}
        onClose={handleLayoutDialogClose}
        selectFocus={selectFocus}
      />
      <Tooltip title={t("More options")} placement="top">
        <CustomizedBtn
          className={footer ? "footer-icon-button" : ""}
          id="settings-button"
          variant="contained"
          color={open ? "primary" : "secondary"}
          aria-controls={open ? "demo-positioned-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
        >
          <SvgIcon size={40} name={'settings'} color={open ? 'black' : 'white'} />
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
        <MenuItem onClick={() => handleLayoutDialogOpen()}>
          <ListItemIcon>
            <SvgIcon size={36} name={"layout"} color={"white"} />
          </ListItemIcon>
          <ListItemText id="change-layout-button">
            {t("Change Layout")}
          </ListItemText>
        </MenuItem>

        {conference.isPlayOnly === false && (
          <MenuItem onClick={() => handleDialogOpen()}>
            <ListItemIcon>
              <SvgIcon size={36} name={"call-settings"} color={"white"} />
            </ListItemIcon>
            <ListItemText>{t("Call Settings")}</ListItemText>
          </MenuItem>
        )}

        <MenuItem
          component={"a"}
          href="https://github.com/ant-media/conference-call-application/issues"
          target={"_blank"}
          rel="noopener noreferrer"
        >
          <ListItemIcon>
            <SvgIcon size={36} name={"report"} color={"white"} />
          </ListItemIcon>
          <ListItemText>{t("Report Problem")}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
});

export default OptionButton;
