import OpenSansRegular from "../static/Fonts/OpenSans/OpenSans-Regular.ttf";
import OpenSansMedium from "../static/Fonts/OpenSans/OpenSans-Medium.ttf";
import OpenSansSemiBold from "../static/Fonts/OpenSans/OpenSans-SemiBold.ttf";
import OpenSansBold from "../static/Fonts/OpenSans/OpenSans-Bold.ttf";
import {getWebSocketURLAttribute} from "../utils";

export function getGreenTheme() {
  const themeColor0 = "#AFF3EE";
  const themeColor10 = "#00E5D2";
  const themeColor20 = "#00C8B8";
  const themeColor30 = "#00AC9E";
  const themeColor40 = "#008F83";
  const themeColor50 = "#007269";
  const themeColor60 = "#00564F";
  const themeColor70 = "#003935";
  const themeColor75 = "#002D2D";
  const themeColor80 = "#001D1A";
  const themeColor85 = "#024B46";
  const themeColor90 = "#6BCBC3";
  const chatText = "#DDFFFC";
  const darkGray = "#222B2A";
  const textColor = "#FFFFFF";

  const error = "#DF0515";
  const primaryColor = themeColor10;
  const secondaryColor = themeColor60;
  let themeObject = {
    typography: {
      allVariants: {
        color: textColor,
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
              borderColor: "#fff",
            },
          },
          icon: {
            color: "#fff",
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
            color: "#fff",
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
            color: "#fff",
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
            color: "#fff",
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
            color: "#fff",
          },

          root: {
            color: "#fff",
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
        main: themeColor10,
      },

      secondary: {
        main: themeColor60,
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
        80: themeColor80,
        85: themeColor85,
        90: themeColor90,
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
  if (!getWebSocketURLAttribute()) {
    themeObject.palette.background = {};
    themeObject.palette.background.default = themeColor80;
  }
  return themeObject;
}
