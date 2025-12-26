import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import {ThemeList} from "./themeList";
import { getGreenTheme } from "./greenTheme";
import {getBlueTheme} from "./blueTheme";
import {getGrayTheme} from "./grayTheme";
import {getWhiteTheme} from "./whiteTheme";
import {getRedWhiteTheme} from "./redWhiteTheme";

const getTheme = (theme) => {
  let themeObject;

  if(process.env.REACT_APP_FORCE_THEME !== undefined && process.env.REACT_APP_FORCE_THEME !== "") {
    theme = process.env.REACT_APP_FORCE_THEME;
  }

  switch (theme) {
    case ThemeList.Green:
      themeObject = getGreenTheme();
      break;
    case ThemeList.Blue:
      themeObject = getBlueTheme();
      break;
    case ThemeList.Gray:
      themeObject = getGrayTheme();
      break;
    case ThemeList.White:
      themeObject = getWhiteTheme();
      break;
    case ThemeList.RedWhite:
      themeObject = getRedWhiteTheme();
      break;
    default:
      themeObject = getGreenTheme();
  }

  const Theme = createTheme(themeObject);
  return responsiveFontSizes(Theme);
};
export default getTheme;
