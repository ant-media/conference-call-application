import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import OpenSansRegular from "../static/Fonts/OpenSans/OpenSans-Regular.ttf";
import OpenSansMedium from "../static/Fonts/OpenSans/OpenSans-Medium.ttf";
import OpenSansSemiBold from "../static/Fonts/OpenSans/OpenSans-SemiBold.ttf";
import OpenSansBold from "../static/Fonts/OpenSans/OpenSans-Bold.ttf";

function getRoomName() {
  // if it returns data-room-name element, it means that we are using conference app in component mode
  return document.getElementById("root").getAttribute("data-room-name");
}

const getTheme = (primary, secondary, background, color70, textColor) => {
  const green0 = textColor ? textColor : "#AFF3EE";
  const green10 = primary ? primary : "#00E5D2";
  const green20 = "#00C8B8";
  const green30 = "#00AC9E";
  const green40 = "#008F83";
  const green50 = "#007269";
  const green60 = secondary ? secondary : "#00564F";
  const green70 = color70 ? color70 : "#003935";
  const green80 = background ? background : "#001D1A";
  const green85 = "#024B46";
  const green90 = textColor ? textColor : "#6BCBC3";
  const chatText = "#DDFFFC";
  const darkGray = "#222B2A";

  const error = "#DF0515";
  const primaryColor = green10;
  const secondaryColor = green60;
  let themeObject = {
    typography: {
      allVariants: {
        color: textColor ? textColor : "#FFFFFF",
        fontFamily: "'OpenSans'",
      },
      h1: {
        fontFamily: "'OpenSans'",
        fontSize: 56,
        fontWeight: 700,
      },
      h2: {
        fontWeight: 700,
      },
      h3: {
        fontWeight: 700,
      },
      h5: {
        fontSize: 40,
        letterSpacing: "-0.007em",
      },
      h6: {
        fontSize: 20,
        lineHeight: 1,
        fontWeight: 500,
      },
      body1: {
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.2,
        color: "#10243E",
      },
      body2: {
        fontSize: 14,
        lineHeight: 1.2,
        color: "#10243E",
      },
      link: {
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.2,
      },
    },
    components: {
      MuiSelect: {
        styleOverrides: {
          root: {
            "& fieldset": {
              borderColor: "white",
            },
          },
          icon: {
            color: "white",
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            padding: 8,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: "unset",
          },
        },
      },
      MuiList: {
        styleOverrides: {
          root: {
            background: green60,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            padding: "12px 40px 32px",
            width: "100%",
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            color: "white",
            padding: "24px 0",
            fontSize: 24,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            background: "#022824",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            paddingTop: 16,
            paddingBottom: 16,
            color: "white",
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            marginRight: 16,
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: "white",
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: chatText,
            fontSize: 14,
            marginBottom: 4,
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            paddingLeft: 0,
            paddingRight: 0,
            marginTop: 16,
          },
        },
      },
      MuiGrid: {
        styleOverrides: {
          item: { lineHeight: 0 },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: {
            border: `1px solid ${secondaryColor}`,
          },
          input: {
            borderRadius: 6,
            padding: "11.5px 20px",
            "&::placeholder": {
              fontSize: 16,
              color: secondaryColor,
              opacity: 1,
            },
          },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          input: {
            padding: "12px 16px",
            "&::placeholder": {
              fontSize: 14,
              color: primaryColor,
              opacity: 0.8,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          outlinedSecondary: {
            border: `1px solid ${green60}`,
            color: "white",
          },

          root: {
            borderRadius: 6,
            fontSize: 16,
            fontWeight: 500,
            lineHeight: "24px",
            borderWidth: 2,
            padding: "10px 4px",
            textTransform: "initial",
            minWidth: 60,
          },
          containedError: {
            borderColor: error,
            "&.Mui-disabled": {
              opacity: 0.5,
              cursor: "not-allowed",
              color: "#ffffff",
              boxShadow: "none",
              borderColor: error,
              backgroundColor: error,
              pointerEvents: "unset",
            },
          },
          outlinedPrimary: {
            backgroundColor: "#fff",
            borderColor: primaryColor,
            "&:hover": {
              border: `2px solid ${primaryColor}`,
              backgroundColor: primaryColor,
              color: "#fff",
            },
            "&.Mui-disabled": {
              opacity: 0.5,
              cursor: "not-allowed",
              color: "#ffffff",
              boxShadow: "none",
              borderColor: primaryColor,
              pointerEvents: "unset",
            },
          },
          contained: {
            boxShadow: "none",
            borderWidth: 2,
            borderColor: "inherit",
            borderStyle: "solid",
            "&:hover": {
              boxShadow: "none",
            },
          },
          containedPrimary: {
            boxShadow: "none",
            borderColor: primaryColor,
            "&.Mui-disabled": {
              opacity: 0.5,
              cursor: "not-allowed",
              color: "#ffffff",
              boxShadow: "none",
              borderColor: primaryColor,
              backgroundColor: primaryColor,
              pointerEvents: "unset",
            },
          },
          containedSecondary: {
            boxShadow: "none",
            borderColor: secondaryColor,
            "&.Mui-disabled": {
              opacity: 0.5,
              cursor: "not-allowed",
              color: "#ffffff",
              boxShadow: "none",
              borderColor: secondaryColor,
              backgroundColor: secondaryColor,
              pointerEvents: "unset",
            },
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: `
        @font-face {
          font-family: 'OpenSans';
          font-style: normal;
          font-weight: 400;
          src: url(${OpenSansRegular}) format('truetype');
        }
        @font-face {
          font-family: 'OpenSans';
          font-style: normal;
          font-weight: 500;
          src: url(${OpenSansMedium}) format('truetype');
        }
        @font-face {
          font-family: 'OpenSans';
          font-style: normal;
          font-weight: 600;
          src: url(${OpenSansSemiBold}) format('truetype');
        }
        @font-face {
          font-family: 'OpenSans';
          font-style: normal;
          font-weight: 700;
          src: url(${OpenSansBold}) format('truetype');
        }
      `,
      },
    },
    palette: {
      primary: {
        main: green10,
      },

      secondary: {
        main: green60,
      },
      error: {
        main: error,
      },
      green: {
        0: green0,
        10: green10,
        20: green20,
        30: green30,
        40: green40,
        50: green50,
        60: green60,
        70: green70,
        80: green80,
        85: green85,
        90: green90,
      },
      gray: {
        90: darkGray,
      },
      text: {
        primary: "#FFFFFF",
        default: "#FFFFFF",
        secondary: chatText, // dark4
      },
    },
  };
  if (!getRoomName()) {
    themeObject.palette.background = {};
    themeObject.palette.background.default = green80;
  }
  const Theme = createTheme(themeObject);
  return responsiveFontSizes(Theme);
};
export default getTheme;
