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
  const conference = React.useContext(ConferenceContext);
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [layoutDialogOpen, setLayoutDialogOpen] = React.useState(false);

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
                id="demo-positioned-button"
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
              <ListItemText>{t("Change Layout")}</ListItemText>
            </MenuItem>

              {conference.isPlayOnly === false ?
            <MenuItem onClick={() => handleDialogOpen()}>
              <ListItemIcon>
                <SvgIcon size={36} name={"call-settings"} color={"white"} />
              </ListItemIcon>
              <ListItemText>{t("Call Settings")}</ListItemText>
            </MenuItem>
                    : null}

            {conference.isRecordPluginActive === false && conference.isRecordPluginInstalled === true ?
            <MenuItem onClick={() => conference.startRecord()}
            >
              <ListItemIcon>
                <SvgIcon size={36} name={"camera"} color={"white"} />
              </ListItemIcon>
              <ListItemText>{t("Start Record")}</ListItemText>
            </MenuItem>
                : null}

            {conference.isRecordPluginActive === true && conference.isRecordPluginInstalled === true ?
            <MenuItem onClick={() => conference.stopRecord()}
            >
              <ListItemIcon>
                <SvgIcon size={36} name={"camera"} color={"white"} />
              </ListItemIcon>
              <ListItemText>{t("Stop Record")}</ListItemText>
            </MenuItem>
                : null}

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
}

export default OptionButton;
