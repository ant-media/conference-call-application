import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import {ThemeList} from "./themeList";
import { getGreenTheme } from "./greenTheme";
import {getBlueTheme} from "./blueTheme";
import {getPurpleTheme} from "./purpleTheme";
import {getPinkTheme} from "./pinkTheme";
import {getRedTheme} from "./redTheme";
import {getOrangeTheme} from "./orangeTheme";
import {getGrayTheme} from "./grayTheme";

const getTheme = (theme) => {
  let themeObject;

  switch (theme) {
    case ThemeList.Green:
      themeObject = getGreenTheme();
      break;
    case ThemeList.Blue:
      themeObject = getBlueTheme();
      break;
    case ThemeList.Purple:
      themeObject = getPurpleTheme();
      break;
    case ThemeList.Pink:
      themeObject = getPinkTheme();
      break;
    case ThemeList.Red:
      themeObject = getRedTheme();
    break;
    case ThemeList.Orange:
      themeObject = getOrangeTheme();
      break;
    case ThemeList.Gray:
      themeObject = getGrayTheme();
      break;
    default:
      themeObject = getGreenTheme();
  }

  const Theme = createTheme(themeObject);
  return responsiveFontSizes(Theme);
};
export default getTheme;
