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
import translationEN from "i18n/en.json";
import translationTR from "i18n/tr.json";
import translationES from "i18n/es.json";
import CustomRoutes from "CustomRoutes";

const resources = {
  en: {
    translation: translationEN,
  },
  tr: {
    translation: translationTR,
  },
  es: {
    translation: translationES,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    keySeperator: false,
    resources,
  });

const availableLangs = Object.keys(resources);
if (!availableLangs.includes(i18n.language)) {

  const maybeLang = i18n.language.slice(0, 2);
  if (availableLangs.includes(maybeLang)) {
    localStorage.setItem("i18nextLng", maybeLang);
    i18n.changeLanguage(maybeLang);
  } else {
    // Falling back to english.
    localStorage.setItem("i18nextLng", "en");
    i18n.changeLanguage("en");
  }

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

function App() {
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
  // "#d2c8f1", "#323135", "#000", "#1b1b1b", "white"
  return (
    <ThemeProvider theme={theme()}>
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
        <CustomRoutes />
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
