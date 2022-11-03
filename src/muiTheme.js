import { createTheme, responsiveFontSizes } from "@material-ui/core";

export const theme = responsiveFontSizes(
  createTheme({
    palette: {
      type: "dark",
    },

    typography: {
      fontSize: 13,
      h1: {
        lineHeight: 0.9,
        letterSpacing: -2,
        fontWeight: "bold",
      },
      h2: {
        fontWeight: "200",
      },
      h4: {
        fontWeight: "600",
        letterSpacing: -1.02,
      },
    },
    overrides: {
      MuiCssBaseline: {
        "@global": {
          body: {
            overscrollBehaviorY: "none",
            backgroundPosition: "top center",
            backgroundRepeat: "repeat-y",
            backgroundSize: "120%",
          },
          "*": {
            scrollbarWidth: "thin",
          },
          "*::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "*::-webkit-scrollbar-thumb": {},
          "*::-webkit-scrollbar-corner": {
            // this hides an annoying white box which appears when both scrollbars are present
            backgroundColor: "transparent",
          },
        },
      },
      MuiAccordion: {
        root: {
          "&:before": {
            display: "none",
          },
        },
      },
      MuiAlert: {
        root: {
          border: "1px solid",
        },
      },
      MuiButton: {
        root: {},
        outlinedSizeSmall: {
          padding: "6px 9px",
          fontSize: "0.70rem",
        },
      },
      MuiLink: {
        root: {},
      },
      MuiPaper: {},
      MuiStepper: {
        root: {
          backgroundColor: "transparent",
          padding: 0,
        },
      },
      MuiStep: {
        vertical: {
          backgroundColor: "rgba(255,255,255,.07)",
          backdropFilter: "blur(4px)",
          padding: "32px 32px 16px",
        },
      },
      MuiStepConnector: {
        lineVertical: {
          borderLeftWidth: 0,
        },
      },
      MuiStepContent: {
        root: {
          borderLeftWidth: 0,
          marginLeft: 0,
          paddingLeft: 0,
        },
      },
      MuiStepLabel: {
        label: {
          textTransform: "uppercase",
          "&.MuiStepLabel-alternativeLabel": { textTransform: "none" },
          "&.MuiStepLabel-active": {},
          "&.MuiStepLabel-completed": {},
        },
      },
      MuiTabs: {
        root: {},
        indicator: {
          height: "100%",
          zIndex: -1,
        },
      },
      MuiTab: {
        root: {
          fontWeight: "bold",
          fontSize: 18,
          padding: 12,
          letterSpacing: "-0.69px",
          textTransform: "none",
        },
        textColorInherit: {
          opacity: 1,
        },
      },
      MuiTableCell: {
        root: {
          borderBottom: "none",
        },
      },
    },
  })
);
