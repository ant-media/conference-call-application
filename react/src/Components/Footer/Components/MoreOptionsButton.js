import React from "react";
import Button from "@mui/material/Button";
import { SvgIcon } from "Components/SvgIcon";
import Menu from "@mui/material/Menu";
import { styled } from "@mui/material/styles";
import MenuItem from "@mui/material/MenuItem";
import { SettingsDialog } from "./SettingsDialog";
import { LayoutSettingsDialog } from "./LayoutSettingsDialog";
import { ListItemIcon, ListItemText, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ConferenceContext } from 'pages/AntMedia';
import {GeneralSettingsDialog} from "./GeneralSettingsDialog";
import {isMobile,isTablet} from "react-device-detect";

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

function MoreOptionsButton({ footer, ...props }) {
  const conference = React.useContext(ConferenceContext);
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [layoutDialogOpen, setLayoutDialogOpen] = React.useState(false);
  const [generalSettingsDialogOpen, setGeneralSettingsDialogOpen] = React.useState(false);

  // if you select camera then we are going to focus on camera button.
  const [selectFocus, setSelectFocus] = React.useState(null);

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
              selectFocus={selectFocus}
          />
          <LayoutSettingsDialog
              open={layoutDialogOpen}
              onClose={handleLayoutDialogClose}
              selectFocus={selectFocus}
          />
          <GeneralSettingsDialog
            open={generalSettingsDialogOpen}
            onClose={handleGeneralSettingsDialogClose}
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
              <SvgIcon size={40} name={'option'} color={open ? 'black' : 'white'} />
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

            {(conference.isPlayOnly === false) && (!isMobile) && (!isTablet) && (process.env.REACT_APP_FOOTER_SCREEN_SHARE_BUTTON_VISIBILITY === 'true') ?
              <MenuItem onClick={() => {
                if (conference.isScreenShared) {
                conference.handleStopScreenShare();
              } else {
                conference.handleStartScreenShare();
                // send other that you are sharing screen.
              }
                handleClose();
              }}>
                <ListItemIcon>
                  <SvgIcon size={36} name={"share-screen-off"} color={"white"} />
                </ListItemIcon>
                <ListItemText
                  id="more-options-share-screen-button"
                >
                  {conference.isScreenShared ? t("You are presenting") : t("Present now")}
                </ListItemText>
              </MenuItem>
              : null}

            {process.env.REACT_APP_FOOTER_REACTIONS_BUTTON_VISIBILITY === 'true' ?
              <MenuItem onClick={() => {conference.setShowEmojis(!conference.showEmojis); handleClose();}}>
                <ListItemIcon>
                  <SvgIcon size={36} name={'smiley-face'} color={"white"} />
                </ListItemIcon>
                <ListItemText
                  id="more-options-reactions-button"
                >
                  {t("Reactions")}
                </ListItemText>
              </MenuItem>
              : null}

            {(conference.isPlayOnly === false) && (process.env.REACT_APP_FOOTER_MESSAGE_BUTTON_VISIBILITY === 'true') ?
              <MenuItem onClick={() => {
                if (!conference?.messageDrawerOpen) {
                  conference?.toggleSetNumberOfUnreadMessages(0);
                }
                conference?.handleMessageDrawerOpen(!conference?.messageDrawerOpen);
                handleClose();
              }}>
                <ListItemIcon>
                  <SvgIcon size={36} name={"message-off"} color={"white"} />
                </ListItemIcon>
                <ListItemText id={"more-options-chat-button"}>{t("Chat")}</ListItemText>
              </MenuItem>
              : null}

            {process.env.REACT_APP_FOOTER_PARTICIPANT_LIST_BUTTON_VISIBILITY === 'true' ?
              <MenuItem
                  onClick={() => {conference?.handleParticipantListOpen(!conference?.participantListDrawerOpen); handleClose();}}
              >
                <ListItemIcon>
                  <SvgIcon size={36} name={"participants"} color={"white"} />
                </ListItemIcon>
                <ListItemText id={"more-options-participant-list-button"}>{t("Participant List")}</ListItemText>
              </MenuItem>
              : null}

            {(process.env.REACT_APP_FOOTER_PUBLISHER_REQUEST_BUTTON_VISIBILITY === 'true') && (conference.isAdmin === true) ?
              <MenuItem
                onClick={() => {conference?.handlePublisherRequestListOpen(!conference?.publisherRequestListDrawerOpen); handleClose();}}
              >
                <ListItemIcon>
                  <SvgIcon size={36} name={"raise-hand"} color={"white"} />
                </ListItemIcon>
                <ListItemText id={"more-options-participant-list-button"}>{t("Publisher Request List")}</ListItemText>
              </MenuItem>
              : null}

            {(process.env.REACT_APP_FOOTER_PUBLISHER_REQUEST_BUTTON_VISIBILITY === 'true') && (conference.isPlayOnly === true) ?
              <MenuItem
                onClick={() => {conference.handlePublisherRequest(); handleClose();}}
              >
                <ListItemIcon>
                  <SvgIcon size={36} name={"raise-hand"} color={"white"} />
                </ListItemIcon>
                <ListItemText id={"more-options-participant-list-button"}>{t("Request becoming publisher")}</ListItemText>
              </MenuItem>
              : null}
          </Menu>
        </>
    );
}

export default MoreOptionsButton;
