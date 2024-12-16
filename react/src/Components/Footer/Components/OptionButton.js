import React from "react";
import Button from "@mui/material/Button";
import {SvgIcon} from "Components/SvgIcon";
import Menu from "@mui/material/Menu";
import {styled, useTheme} from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import SettingsDialog from "./SettingsDialog";
import {LayoutSettingsDialog} from "./LayoutSettingsDialog";
import {ListItemIcon, ListItemText, Tooltip} from "@mui/material";
import {useTranslation} from "react-i18next";
import {ConferenceContext} from 'pages/AntMedia';
import GeneralSettingsDialog from "./GeneralSettingsDialog";
import {ThemeList} from "../../../styles/themeList";
import {ThemeContext} from "../../../App";
import i18n from "i18next";

const CustomizedBtn = styled(Button)(({theme}) => ({
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

function OptionButton(props) {
  const conference = React.useContext(ConferenceContext);
  const {t} = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [layoutDialogOpen, setLayoutDialogOpen] = React.useState(false);
  const [generalSettingsDialogOpen, setGeneralSettingsDialogOpen] = React.useState(false);
  const theme = useTheme();
  const themeContext = React.useContext(ThemeContext);

  // Language and theme states
  const [currentLanguage, setCurrentLanguage] = React.useState(
      localStorage.getItem("i18nextLng") || "en"
  );
  const [currentTheme, setCurrentTheme] = React.useState(
      themeContext?.currentTheme || ThemeList.Green
  );

  // Language handler
  const switchLanguage = (value) => {
    localStorage.setItem("i18nextLng", value);
    i18n.changeLanguage(value).then(() => {
      setCurrentLanguage(value);
      console.log("Language switched to", value);
    });
  };

  // Theme handler
  const switchTheme = (value) => {
    localStorage.setItem("selectedTheme", value);
    themeContext.setCurrentTheme(value);
    setCurrentTheme(value);
  };

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
  const handleLayoutDialogOpen = (focus) => {
    setSelectFocus(focus);
    setLayoutDialogOpen(true);
    handleClose();
  };

  const handleLayoutDialogClose = (value) => {
    setLayoutDialogOpen(false);
  };

  const handleGeneralSettingsDialogOpen = (focus) => {
    setSelectFocus(focus);
    setGeneralSettingsDialogOpen(true);
    handleClose();
  }

  const handleGeneralSettingsDialogClose = (value) => {
    setGeneralSettingsDialogOpen(false);
  }

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
        globals={props?.globals}
        allParticipants={props?.allParticipants}
        pinVideo={props?.pinVideo}
        handleSetDesiredTileCount={props?.handleSetDesiredTileCount}
      />
      <GeneralSettingsDialog
        open={generalSettingsDialogOpen}
        onClose={handleGeneralSettingsDialogClose}
        selectFocus={selectFocus}
        currentLanguage={currentLanguage}
        switchLanguage={switchLanguage}
        currentTheme={currentTheme}
        switchTheme={switchTheme}
      />
      <Tooltip title={t("More options")} placement="top">
        <CustomizedBtn
          className={props?.footer ? "footer-icon-button" : ""}
          id="settings-button"
          variant="contained"
          color={open ? "primary" : "secondary"}
          aria-controls={open ? "demo-positioned-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
        >
          <SvgIcon size={40} name={'settings'} color={open ? theme.palette?.darkIconColor?.primary : theme.palette?.iconColor?.primary}/>
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
        {process.env.REACT_APP_OPTION_MENU_GENERAL_SETTINGS_BUTTON_VISIBILITY === 'true' ?
        <MenuItem onClick={() => handleGeneralSettingsDialogOpen()}>
          <ListItemIcon>
            <SvgIcon size={36} name={"settings"} color={theme.palette?.iconColor?.primary}/>
          </ListItemIcon>
          <ListItemText
            id="general-button"
          >
            {t("General")}
          </ListItemText>
        </MenuItem>
            : null}

        {process.env.REACT_APP_OPTION_MENU_CHANGE_LAYOUT_BUTTON_VISIBILITY === 'true' ?
        <MenuItem onClick={() => handleLayoutDialogOpen()} id="change-layout-button">
          <ListItemIcon>
            <SvgIcon size={36} name={"layout"} color={theme.palette?.iconColor?.primary}/>
          </ListItemIcon>
          <ListItemText>
            {t("Change Layout")}
          </ListItemText>
        </MenuItem>
            : null}

        {conference.isPlayOnly === false
        && process.env.REACT_APP_OPTION_MENU_CALL_SETTINGS_BUTTON_VISIBILITY === 'true' ?
          <MenuItem onClick={() => handleDialogOpen()}>
            <ListItemIcon>
              <SvgIcon size={36} name={"call-settings"} color={theme.palette?.iconColor?.primary}/>
            </ListItemIcon>
            <ListItemText>{t("Call Settings")}</ListItemText>
          </MenuItem>
          : null}

        {conference.isPlayOnly === false
        && process.env.REACT_APP_CALL_SETTINGS_VIRTUAL_BACKGROUND_MODE_VISIBILITY === 'true' ?
            <MenuItem onClick={() => { conference.handleEffectsOpen(!conference.effectsDrawerOpen); handleClose(); }}>
              <ListItemIcon>
                <SvgIcon size={36} name={"background-replacement"} color={theme.palette?.iconColor?.primary} />
              </ListItemIcon>
              <ListItemText>{t("Virtual Effects")}</ListItemText>
            </MenuItem>
          : null}

        {process.env.REACT_APP_RECORDING_MANAGED_BY_ADMIN === 'false' || conference.isAdmin === true ?
          [
            (conference.isRecordPluginActive === false && conference.isRecordPluginInstalled === true) &&
            (<MenuItem onClick={() => { conference.startRecord(); handleClose(); } } id="start-recording-button"
            >
              <ListItemIcon>
                <SvgIcon size={36} name={"camera"} color={theme.palette?.iconColor?.primary} />
              </ListItemIcon>
              <ListItemText>{t("Start Record")}</ListItemText>
            </MenuItem>
            ),

            (conference.isRecordPluginActive === true && conference.isRecordPluginInstalled === true) &&
            (<MenuItem onClick={() => { conference.stopRecord(); handleClose(); }} id="stop-recording-button"
          >
            <ListItemIcon>
              <SvgIcon size={36} name={"camera"} color={theme.palette?.iconColor?.primary} />
            </ListItemIcon>
            <ListItemText>{t("Stop Record")}</ListItemText>
          </MenuItem>
            )
          ]
          : null}

        {process.env.REACT_APP_OPTION_MENU_REPORT_PROBLEM_BUTTON_VISIBILITY === 'true' ?
          <MenuItem
            component={"a"}
            href={process.env.REACT_APP_REPORT_PROBLEM_URL}
            target={"_blank"}
            rel="noopener noreferrer"
          >
            <ListItemIcon>
              <SvgIcon size={36} name={"report"} color={theme.palette?.iconColor?.primary}/>
            </ListItemIcon>
            <ListItemText>{t("Report Problem")}</ListItemText>
          </MenuItem>
          : null}
      </Menu>
    </>
  );
}

export default OptionButton;
