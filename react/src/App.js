import "./App.css";
/* eslint-disable eqeqeq */
import {CssBaseline, ThemeProvider} from "@mui/material";
import theme from "./styles/theme";
import React from "react";
import {SnackbarProvider} from 'notistack';
import AntSnackBar from "Components/AntSnackBar";
import {initReactI18next} from "react-i18next";
import i18n from "i18next";
import CustomRoutes from "CustomRoutes";
import {ThemeList} from "./styles/themeList";
import {AvailableLanguages} from "./i18n/AvailableLanguages";

i18n.use(initReactI18next).init({
  resources: AvailableLanguages,
}).then(r => console.log("i18n is initialized"));

const availableLanguagesList = Object.keys(AvailableLanguages);
let preferredLanguage = "tr";
if (!availableLanguagesList.includes(preferredLanguage)) {
  preferredLanguage = "en";
}
localStorage.setItem("i18nextLng", preferredLanguage);

i18n.changeLanguage(preferredLanguage).then(r => console.log("Language is set to", preferredLanguage));

let selectedTheme = localStorage.getItem('selectedTheme');
if (process.env.REACT_APP_FORCE_THEME !== undefined && process.env.REACT_APP_FORCE_THEME !== "") {
  selectedTheme = process.env.REACT_APP_FORCE_THEME;
  localStorage.setItem('selectedTheme', selectedTheme);
}
if (!selectedTheme) {
  selectedTheme = ThemeList.Green;
  localStorage.setItem('selectedTheme', selectedTheme);
}

function getWindowLocation() {
  document.getElementById("locationHref").value = window.location.href;
}

function copyWindowLocation() {
  var copyText = document.getElementById("locationHref");

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /* For mobile devices */

  /* Copy the text inside the text field */
  document.execCommand("copy");
}

window.getWindowLocation = getWindowLocation;
window.copyWindowLocation = copyWindowLocation;

export const ThemeContext = React.createContext(null);

function App()
{
  const [currentTheme, setCurrentTheme] = React.useState(selectedTheme);

  React.useEffect(() => {
  const handleFullScreen = (e) => {
    if (e.target?.id === "meeting-gallery") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(r => console.log("Fullscreen is requested", r));
      } else {
        document.exitFullscreen().then(r => console.log("Fullscreen is exited", r));
      }
    }
  }

    window.addEventListener("dblclick", handleFullScreen);

    // cleanup this component
    return () => {
      window.removeEventListener("dblclick", handleFullScreen);
    };
  }, []);
  return (
    <ThemeProvider theme={theme(currentTheme)}>
      <CssBaseline/>
      <SnackbarProvider
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        maxSnack={3}
        Components={{
          info: AntSnackBar,
          message: AntSnackBar,
        }}
      >
        <ThemeContext.Provider
          value={{
            currentTheme,
            setCurrentTheme,
          }}>
          <CustomRoutes/>
        </ThemeContext.Provider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
