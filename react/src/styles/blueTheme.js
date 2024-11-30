import OpenSansRegular from "../static/Fonts/OpenSans/OpenSans-Regular.ttf";
import OpenSansMedium from "../static/Fonts/OpenSans/OpenSans-Medium.ttf";
import OpenSansSemiBold from "../static/Fonts/OpenSans/OpenSans-SemiBold.ttf";
import OpenSansBold from "../static/Fonts/OpenSans/OpenSans-Bold.ttf";
import {isComponentMode} from "../utils";

export function getBlueTheme() {
  const themeColor0 = "#E0F7FA";
  const themeColor10 = "#B2EBF2";
  const themeColor20 = "#80DEEA";
  const themeColor30 = "#4DD0E1";
  const themeColor40 = "#26C6DA";
  const themeColor50 = "#00BCD4";
  const themeColor60 = "#00ACC1";
  const themeColor70 = "#0097A7";
  const themeColor71 = "#0097A7";
  const themeColor72 = "#0097A7";
  const themeColor75 = "#00838F";
  const themeColor80 = "#00838F";
  const themeColor85 = "#006064";
  const themeColor90 = "#84FFFF";
  const themeColor99 = "#FFFFFF";
  const chatText = "#E0F7FA";
  const darkGray = "#37474F";
  const iconColor = "#FFFFFF";
  const darkIconColor = "#000000";

  const error = "#D50000";
  const primaryColor = themeColor10;
  const secondaryColor = themeColor60;
  const textColor = "#FFFFFF";
  let themeObject = {
    typography: {
      allVariants: {
        color: "#FFFFFF",
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
        color: "#FFFFFF",
      },
      body2: {
        fontSize: 14,
        lineHeight: 1.2,
        color: "#FFFFFF",
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
            background: themeColor60,
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
            background: themeColor75,
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
            border: `1px solid ${themeColor60}`,
            color: "white",
          },

          root: {
            color: "white",
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
        main: primaryColor,
      },

      secondary: {
        main: secondaryColor,
      },
      error: {
        main: error,
      },
      themeColor: {
        0: themeColor0,
        10: themeColor10,
        20: themeColor20,
        30: themeColor30,
        40: themeColor40,
        50: themeColor50,
        60: themeColor60,
        70: themeColor70,
        71: themeColor71,
        72: themeColor72,
        80: themeColor80,
        85: themeColor85,
        90: themeColor90,
        99: themeColor99,
      },
      gray: {
        90: darkGray,
      },
      text: {
        primary: "#FFFFFF",
        default: "#FFFFFF",
        secondary: chatText, // dark4
      },
      participantListIcon: {
        primary: "#FFFFFF",
        default: "#FFFFFF",
        secondary: iconColor,
      },
      iconColor: {
        primary: "#FFFFFF",
        default: "#FFFFFF",
        secondary: iconColor,
      },
      darkIconColor: {
        primary: "#000000",
        default: "#000000",
        secondary: darkIconColor,
      }
    },
  };
  if (!isComponentMode()) {
    themeObject.palette.background = {};
    themeObject.palette.background.default = themeColor80;
  }
  return themeObject;
}
