import OpenSansRegular from "../static/Fonts/OpenSans/OpenSans-Regular.ttf";
import OpenSansMedium from "../static/Fonts/OpenSans/OpenSans-Medium.ttf";
import OpenSansSemiBold from "../static/Fonts/OpenSans/OpenSans-SemiBold.ttf";
import OpenSansBold from "../static/Fonts/OpenSans/OpenSans-Bold.ttf";
import {isComponentMode} from "../utils";

export function getRedWhiteTheme() {
    const brandRed = "#ee3135";
    const offWhite = "#f8f9fa";
    const darkText = "#1f2328";
    const mutedText = "#4b5563";
    const surface = "#ffffff";
    const error = "#ee3135";
    const chatText = "#2b2f36";
    const iconColor = "#ffffff";
    const darkIconColor = "#ffffff";

    const themeColor0 = surface;
    const themeColor10 = brandRed;
    const themeColor20 = "#f16b6e";
    const themeColor30 = "#f7a0a2";
    const themeColor40 = "#f9b8ba";
    const themeColor50 = "#fbd0d1";
    const themeColor60 = brandRed;
    const themeColor70 = "#1f1f1f";
    const themeColor71 = "#2b2b2b";
    const themeColor72 = "#2b2b2b";
    const themeColor75 = "#121212";
    const themeColor80 = offWhite;
    const themeColor85 = "#d72a2e";
    const themeColor90 = "#ffffff";
    const themeColor99 = "#ffffff";

    let themeObject = {
        palette: {
            mode: "light",
            background: {
                default: offWhite,
                paper: surface,
            },
            primary: {
                main: brandRed,
                contrastText: "#ffffff",
            },
            secondary: {
                main: brandRed,
                contrastText: "#ffffff",
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
                75: themeColor75,
                80: themeColor80,
                85: themeColor85,
                90: themeColor90,
                99: themeColor99,
            },
            gray: {
                90: "#2b2f36",
            },
            text: {
                primary: darkText,
                default: darkText,
                secondary: chatText,
            },
            participantListIcon: {
                primary: darkText,
                default: darkText,
                secondary: iconColor,
            },
            iconColor: {
                primary: "#ffffff",
                default: "#ffffff",
                secondary: iconColor,
            },
            darkIconColor: {
                primary: "#ffffff",
                default: "#ffffff",
                secondary: darkIconColor,
            },
        },
        typography: {
            allVariants: {
                color: darkText,
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
                fontWeight: 600,
            },
            body1: {
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1.2,
                color: mutedText,
            },
            body2: {
                fontSize: 14,
                lineHeight: 1.2,
                color: mutedText,
            },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: `
                    @font-face {
                        font-family: 'OpenSans';
                        src: url(${OpenSansRegular}) format('truetype');
                        font-weight: 400;
                        font-style: normal;
                        font-display: swap;
                    }
                    @font-face {
                        font-family: 'OpenSans';
                        src: url(${OpenSansMedium}) format('truetype');
                        font-weight: 500;
                        font-style: normal;
                        font-display: swap;
                    }
                    @font-face {
                        font-family: 'OpenSans';
                        src: url(${OpenSansSemiBold}) format('truetype');
                        font-weight: 600;
                        font-style: normal;
                        font-display: swap;
                    }
                    @font-face {
                        font-family: 'OpenSans';
                        src: url(${OpenSansBold}) format('truetype');
                        font-weight: 700;
                        font-style: normal;
                        font-display: swap;
                    }
                `,
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        background: surface,
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        padding: "12px 40px 32px",
                        width: "100%",
                        background: surface,
                    },
                },
            },
            MuiDialogTitle: {
                styleOverrides: {
                    root: {
                        color: darkText,
                        padding: "24px 0",
                        fontSize: 24,
                        fontWeight: 700,
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    notchedOutline: {
                        border: `1px solid ${brandRed}`,
                    },
                    input: {
                        borderRadius: 8,
                        padding: "11.5px 20px",
                        "&::placeholder": {
                            fontSize: 16,
                            color: brandRed,
                            opacity: 0.6,
                        },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    containedSecondary: {
                        backgroundColor: brandRed,
                        color: "#ffffff",
                        "&:hover": {
                            backgroundColor: "#d72a2e",
                        },
                    },
                    outlinedSecondary: {
                        border: `1px solid ${brandRed}`,
                        color: brandRed,
                        "&:hover": {
                            border: `1px solid #d72a2e`,
                            color: "#d72a2e",
                        },
                    },
                },
            },
            MuiTypography: {
                styleOverrides: {
                    root: {
                        color: darkText,
                    },
                },
            },
        },
    };

    if (!isComponentMode()) {
        themeObject.palette.background = {};
        themeObject.palette.background.default = themeColor80;
    }
    return themeObject;
}
