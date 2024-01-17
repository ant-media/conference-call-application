import "./App.css";
/* eslint-disable eqeqeq */
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./styles/theme";
import React from "react";
import { SnackbarProvider } from "notistack";
import AntSnackBar from "Components/AntSnackBar";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import i18n from "i18next";
import CustomRoutes from "CustomRoutes";
import {ThemeList} from "./styles/themeList";
import {AvailableLanguages} from "./i18n/AvailableLanguages";

i18n.use(initReactI18next).init({
  resources: AvailableLanguages,
});
/*
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    keySeperator: false,
    AvailableLanguages,
  });

 */

const availableLanguagesList = Object.keys(AvailableLanguages);
let preferredLanguage = localStorage.getItem("i18nextLng");
if (!preferredLanguage) {
  preferredLanguage = window.navigator.language.slice(0, 2);
}
if (availableLanguagesList.includes(preferredLanguage)) {
  localStorage.setItem("i18nextLng", preferredLanguage);
  i18n.changeLanguage(preferredLanguage);
} else {
  // Falling back to english.
  localStorage.setItem("i18nextLng", "en");
  i18n.changeLanguage("en");
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

function App() {
  const [currentTheme, setCurrentTheme] = React.useState(ThemeList.Green);

  const handleFullScreen = (e) => {
    if (e.target?.id === "meeting-gallery") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  React.useEffect(() => {
    window.addEventListener("dblclick", handleFullScreen);

    // cleanup this component
    return () => {
      window.removeEventListener("dblclick", handleFullScreen);
    };
  }, []);
  return (
    <ThemeProvider theme={theme(currentTheme)}>
      <CssBaseline />
      <SnackbarProvider
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        maxSnack={3}
        content={(key, notificationData) => (
          <AntSnackBar id={key} notificationData={notificationData} />
        )}
      >
        <ThemeContext.Provider
          value={{
            currentTheme,
            setCurrentTheme,
          }}>
          <CustomRoutes />
        </ThemeContext.Provider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
