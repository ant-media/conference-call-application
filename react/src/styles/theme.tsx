import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import {ThemeList} from "./themeList";
import { getGreenTheme } from "./greenTheme";
import {getBlueTheme} from "./blueTheme";
import {getPurpleTheme} from "./purpleTheme";
import {getPinkTheme} from "./pinkTheme";
import {getRedTheme} from "./redTheme";
import {getOrangeTheme} from "./orangeTheme";
import {getGrayTheme} from "./grayTheme";

interface CustomPalettes {
  background: {
    default: string;
  },
  themeColor: {
    0: string,
    10: string,
    20: string,
    30: string,
    40: string,
    50: string,
    60: string,
    70: string,
    80: string,
    85: string,
    90: string,
  };
}

declare module '@mui/material/styles' {
  interface PaletteOptions extends CustomPalettes {}
}
declare module '@mui/material/styles/createPalette' {
  interface Palette extends CustomPalettes {}
}

const getTheme = (theme: string) => {
  let themeObject: Object;

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
