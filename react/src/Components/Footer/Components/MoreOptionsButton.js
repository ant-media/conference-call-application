import React from "react";
import Button from "@mui/material/Button";
import { SvgIcon } from "Components/SvgIcon";
import Menu from "@mui/material/Menu";
import {styled, useTheme} from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import SettingsDialog from "./SettingsDialog";
import { LayoutSettingsDialog } from "./LayoutSettingsDialog";
import { ListItemIcon, ListItemText, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import GeneralSettingsDialog from "./GeneralSettingsDialog";
import {isMobile,isTablet} from "react-device-detect";
import i18n from "i18next";
import {ThemeList} from "../../../styles/themeList";
import {ThemeContext} from "../../../App";

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

function MoreOptionsButton(props) {
  const { t } = useTranslation();
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


  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDialogClose = (value) => {
    setDialogOpen(false);
  };

  const handleLayoutDialogClose = (value) => {
    setLayoutDialogOpen(false);
  };

  const handleGeneralSettingsDialogClose = (value) => {
    setGeneralSettingsDialogOpen(false);
  }

    return (
        <>
          <SettingsDialog
              open={dialogOpen}
              onClose={handleDialogClose}
              handleBackgroundReplacement={props.handleBackgroundReplacement}
              microphoneSelected={(mic) => props?.microphoneSelected(mic)}
              devices={props?.devices}
              selectedCamera={props?.selectedCamera}
              cameraSelected={(camera) => props?.cameraSelected(camera)}
              selectedMicrophone={props?.selectedMicrophone}
              selectedBackgroundMode={props?.selectedBackgroundMode}
              setSelectedBackgroundMode={(mode) => props?.setSelectedBackgroundMode(mode)}
              videoSendResolution={props?.videoSendResolution}
              setVideoSendResolution={(resolution) => props?.setVideoSendResolution(resolution)}
          />
          <LayoutSettingsDialog
              open={layoutDialogOpen}
              onClose={handleLayoutDialogClose}
              globals={props?.globals}
              allParticipants={props?.allParticipants}
              pinVideo={(streamId) => props?.pinVideo(streamId)}
              handleSetDesiredTileCount={props?.handleSetDesiredTileCount}
          />
          <GeneralSettingsDialog
            open={generalSettingsDialogOpen}
            onClose={handleGeneralSettingsDialogClose}
            currentLanguage={currentLanguage}
            switchLanguage={switchLanguage}
            currentTheme={currentTheme}
            switchTheme={switchTheme}
          />
          <Tooltip title={t("More options")} placement="top">
            <CustomizedBtn
                className={props?.footer ? "footer-icon-button" : ""}
                id="more-button"
                data-testid="more-button-test"
                variant="contained"
                color={open ? "primary" : "secondary"}
                aria-controls={open ? "demo-positioned-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
            >
              <SvgIcon size={40} name={'option'} color={open ? theme.palette?.darkIconColor?.primary : theme.palette?.iconColor?.primary} />
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

            {(props?.isPlayOnly === false) && (!isMobile) && (!isTablet) && (process.env.REACT_APP_FOOTER_SCREEN_SHARE_BUTTON_VISIBILITY === 'true') ?
              <MenuItem onClick={() => {
                if (props?.isScreenShared) {
                props?.handleStopScreenShare();
              } else {
                props?.handleStartScreenShare();
                // send other that you are sharing screen.
              }
                handleClose();
              }}>
                <ListItemIcon>
                  <SvgIcon size={36} name={"share-screen-off"} color={theme.palette?.iconColor?.primary} />
                </ListItemIcon>
                <ListItemText
                  id="more-options-share-screen-button"
                >
                  {props?.isScreenShared ? t("You are presenting") : t("Present now")}
                </ListItemText>
              </MenuItem>
              : null}

            {process.env.REACT_APP_FOOTER_REACTIONS_BUTTON_VISIBILITY === 'true' ?
              <MenuItem onClick={() => {props?.setShowEmojis(!props?.showEmojis); handleClose();}}>
                <ListItemIcon>
                  <SvgIcon size={36} name={'smiley-face'} color={theme.palette?.iconColor?.primary} />
                </ListItemIcon>
                <ListItemText
                  id="more-options-reactions-button"
                >
                  {t("Reactions")}
                </ListItemText>
              </MenuItem>
              : null}

            {(process.env.REACT_APP_FOOTER_MESSAGE_BUTTON_VISIBILITY === 'true') ?
              <MenuItem onClick={() => {
                if (!props?.messageDrawerOpen) {
                  props?.toggleSetNumberOfUnreadMessages(0);
                }
                props?.handleMessageDrawerOpen(!props?.messageDrawerOpen);
                handleClose();
              }}>
                <ListItemIcon>
                  <SvgIcon size={36} name={"message-off"} color={theme.palette?.iconColor?.primary} />
                </ListItemIcon>
                <ListItemText id={"more-options-chat-button"}>{t("Chat")}</ListItemText>
              </MenuItem>
              : null}

            {process.env.REACT_APP_FOOTER_PARTICIPANT_LIST_BUTTON_VISIBILITY === 'true' ?
              <MenuItem
                  onClick={() => {props?.handleParticipantListOpen(!props?.participantListDrawerOpen); handleClose();}}
              >
                <ListItemIcon>
                  <SvgIcon size={36} name={"participants"} color={theme.palette?.iconColor?.primary} />
                </ListItemIcon>
                <ListItemText id={"more-options-participant-list-button"}>{t("Participant List")}</ListItemText>
              </MenuItem>
              : null}

              {(process.env.REACT_APP_FOOTER_PUBLISHER_REQUEST_BUTTON_VISIBILITY === 'true') && (props?.isAdmin === true) ?
                  <MenuItem
                      onClick={() => {props?.handlePublisherRequestListOpen(!props?.publisherRequestListDrawerOpen); handleClose();}}
                  >
                      <ListItemIcon>
                          <SvgIcon size={36} name={"raise-hand"} color={"white"} />
                      </ListItemIcon>
                      <ListItemText id={"more-options-publisher-request-list-button"}>{t("Publisher Request List")}</ListItemText>
                  </MenuItem>
                  : null}

              {(process.env.REACT_APP_FOOTER_PUBLISHER_REQUEST_BUTTON_VISIBILITY === 'true') && (props?.isPlayOnly === true) ?
                  <MenuItem
                      onClick={() => {props?.handlePublisherRequest(); handleClose();}}
                  >
                      <ListItemIcon>
                          <SvgIcon size={36} name={"raise-hand"} color={"white"} />
                      </ListItemIcon>
                      <ListItemText id={"more-options-request-publish-button"}>{t("Request becoming publisher")}</ListItemText>
                  </MenuItem>
                  : null}

          </Menu>
        </>
    );
}

export default MoreOptionsButton;
