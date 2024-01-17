import * as React from 'react';
import PropTypes from 'prop-types';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { Grid, MenuItem, useMediaQuery } from '@mui/material';
import { SvgIcon } from 'Components/SvgIcon';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {ThemeList} from "../../../styles/themeList";
import {useContext} from "react";
import {ThemeContext} from "../../../App";
import {AvailableLanguages} from "../../../i18n/AvailableLanguages";
import i18n from "i18next";

const AntDialogTitle = props => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle {...other}>
      {children}
      {onClose ? (
        <Button
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 26,
            top: 27,
          }}
        >
          <SvgIcon size={30} name={'close'} color={'white'} />
        </Button>
      ) : null}
    </DialogTitle>
  );
};

export function GeneralSettingsDialog(props) {
  const { t } = useTranslation();
  const { onClose, selectedValue, open } = props;

  const themeContext = useContext(ThemeContext);
  const themeList = Object.keys(ThemeList);
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

  const [currentLanguage, setCurrentLanguage] = React.useState(localStorage.getItem("i18nextLng"));
  const languageList = Object.keys(AvailableLanguages);

  const handleClose = (event, reason) => {
    onClose(selectedValue);
  };
  function switchLanguage(value) {

    localStorage.setItem("i18nextLng", value);
    i18n.changeLanguage(value).then(
      () => {
        setCurrentLanguage(value);
      }
    );
  }

  function switchTheme(value) {
    themeContext.setCurrentTheme(value);
  }

  return (
    <Dialog onClose={handleClose} open={open} fullScreen={fullScreen} maxWidth={'sm'}>
      <AntDialogTitle onClose={handleClose}>{t('General Settings')}</AntDialogTitle>
      <DialogContent>
        <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap' }}>
          <Grid container>
            <Grid container>
              <InputLabel>{t('Language')}</InputLabel>
            </Grid>
            <Grid container alignItems={'center'} spacing={2}>
              <Grid item xs={10}>
                <Select
                  fullWidth
                  id="demo-dialog-native"
                  variant="outlined"
                  value={currentLanguage}
                  onChange={e => switchLanguage(e.target.value)}
                  sx={{ color: 'white' }}
                >
                  {languageList
                    .map(currentLanguage => (
                      <MenuItem key={currentLanguage} value={currentLanguage}>
                        {AvailableLanguages[currentLanguage].name}
                      </MenuItem>
                    ))}
                </Select>
              </Grid>
            </Grid>
          </Grid>
          <Grid container sx={{ mt: 4 }}>
            <Grid container>
              <InputLabel>{t('Theme')}</InputLabel>
            </Grid>
            <Grid container alignItems={'center'} spacing={2}>
              <Grid item xs={10}>
                <Select
                  fullWidth
                  id="demo-dialog-native"
                  variant="outlined"
                  value={themeContext.currentTheme}
                  onChange={e => switchTheme(e.target.value)}
                  sx={{ color: 'white' }}
                >
                  {themeList
                    .map(theme => (
                      <MenuItem key={theme} value={ThemeList[theme]}>
                        {t(theme)}
                      </MenuItem>
                    ))}
                </Select>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

GeneralSettingsDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
