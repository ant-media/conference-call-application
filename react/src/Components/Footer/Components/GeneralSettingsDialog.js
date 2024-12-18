import React from "react";
import PropTypes from "prop-types";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogContent from "@mui/material/DialogContent";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import { Grid, MenuItem, useMediaQuery, useTheme } from "@mui/material";
import { SvgIcon } from "Components/SvgIcon";
import { useTranslation } from "react-i18next";
import { ThemeList } from "../../../styles/themeList";
import { AvailableLanguages } from "../../../i18n/AvailableLanguages";

const AntDialogTitle = ({ children, onClose, ...other }) => (
    <DialogTitle {...other}>
      {children}
      {onClose ? (
          <Button
              aria-label="close"
              onClick={onClose}
              sx={{
                position: "absolute",
                right: 26,
                top: 27,
              }}
          >
            <SvgIcon size={30} name={"close"} color={"#fff"} />
          </Button>
      ) : null}
    </DialogTitle>
);

function GeneralSettingsDialog({
                                 open,
                                 onClose,
                                 currentLanguage,
                                 switchLanguage,
                                 currentTheme,
                                 switchTheme,
                               }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));

  const languageList = Object.keys(AvailableLanguages);
  const themeList = Object.keys(ThemeList);

  const handleClose = (event, reason) => {
    onClose();
  };

  return (
      <Dialog onClose={handleClose} open={open} fullScreen={fullScreen} maxWidth={"sm"}>
        <AntDialogTitle onClose={handleClose}>{t("General Settings")}</AntDialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: "flex", flexWrap: "wrap" }}>
            {process.env.REACT_APP_GENERAL_SETTINGS_LANGUAGE_VISIBILITY === "true" && (
                <Grid container>
                  <Grid container>
                    <InputLabel>{t("Language")}</InputLabel>
                  </Grid>
                  <Grid container alignItems={"center"} spacing={2}>
                    <Grid item xs={10}>
                      <Select
                          fullWidth
                          id="language-select"
                          variant="outlined"
                          value={currentLanguage}
                          onChange={(e) => switchLanguage(e.target.value)}
                          sx={{ color: "#fff" }}
                      >
                        {languageList.map((lang) => (
                            <MenuItem key={lang} value={lang}>
                              {AvailableLanguages[lang].name}
                            </MenuItem>
                        ))}
                      </Select>
                    </Grid>
                  </Grid>
                </Grid>
            )}
            {process.env.REACT_APP_GENERAL_SETTINGS_THEME_VISIBILITY === "true" && (
                <Grid container sx={{ mt: 4 }}>
                  <Grid container>
                    <InputLabel>{t("Theme")}</InputLabel>
                  </Grid>
                  <Grid container alignItems={"center"} spacing={2}>
                    <Grid item xs={10}>
                      <Select
                          fullWidth
                          id="theme-select"
                          variant="outlined"
                          value={currentTheme}
                          onChange={(e) => switchTheme(e.target.value)}
                          sx={{ color: "#fff" }}
                      >
                        {themeList.map((theme) => (
                            <MenuItem key={theme} value={ThemeList[theme]}>
                              {t(theme)}
                            </MenuItem>
                        ))}
                      </Select>
                    </Grid>
                  </Grid>
                </Grid>
            )}
          </Box>
        </DialogContent>
      </Dialog>
  );
}

GeneralSettingsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentLanguage: PropTypes.string.isRequired,
  switchLanguage: PropTypes.func.isRequired,
  currentTheme: PropTypes.string.isRequired,
  switchTheme: PropTypes.func.isRequired,
};

export default GeneralSettingsDialog;
