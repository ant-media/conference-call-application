import * as React from "react";
import { styled, alpha } from "@mui/material/styles";

import {
  Grid,
  Typography,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Slider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from "@mui/material";

import { useTheme } from "@mui/material";

import { SettingsContext } from "pages/AntMedia";
import { AntmediaContext } from "App";
import { useTranslation } from "react-i18next";
import { SvgIcon } from "Components/SvgIcon";
import debounce from "lodash/debounce";

const CustomizedSlider = styled(Slider)(({ theme }) => ({
  marginBottom: 0,

  "&.MuiSlider-dragging .MuiSlider-thumb": {
    boxShadow: `0px 0px 0px 10px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
  '& div[class*="MuiAvatar-root-MuiAvatarGroup-avatar"]': {
    [theme.breakpoints.down("md")]: {
      width: 44,
      height: 44,
      fontSize: 16,
    },
  },
}));

const AntDialogTitle = (props) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle {...other}>
      {children}
      {onClose ? (
        <Button
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 26,
            top: 27,
          }}
        >
          <SvgIcon size={30} name={"close"} color={"white"} />
        </Button>
      ) : null}
    </DialogTitle>
  );
};

export function LayoutSettingsDialog(props) {
  const { t } = useTranslation();
  const { onClose, selectedValue, open } = props;
  const settings = React.useContext(SettingsContext);
  const { pinnedVideoId, pinVideo, globals } = settings;

  const [value, setValue] = React.useState(
    globals.maxVideoTrackCount ? globals.maxVideoTrackCount + 1 : 3
  );
  const antmedia = React.useContext(AntmediaContext);
  const [layout, setLayout] = React.useState(
    pinnedVideoId !== null ? "sidebar" : "tiled"
  ); //just for radioo buttons

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));

  React.useEffect(() => {
    setLayout(pinnedVideoId !== null ? "sidebar" : "tiled");
  }, [pinnedVideoId]);
  const handleClose = () => {
    onClose(selectedValue);
  };

  const changeLayout = (event) => {
    const mode = event.target.value;
    setLayout(mode);

    if (mode === "tiled") {
      //unpin the pinned video
      pinVideo(pinnedVideoId);
    } else if (mode === "sidebar") {
      const participants = document.querySelectorAll(
        ".single-video-container.not-pinned video"
      );
      const firstParticipant =
        participants.length > 1 ? participants[1] : participants[0];

      //pin the first participant
      pinVideo(firstParticipant?.id ? firstParticipant.id : "localVideo");
    }
  };
  const radioLabel = (label, icon) => {
    return (
      <Grid
        container
        style={{ width: "100%" }}
        alignItems="center"
        justifyContent="space-between"
      >
        <Grid item>
          <Typography color="#fff">{label}</Typography>
        </Grid>
        <Grid
          item
          sx={{
            pr: 0.5,
            pl: 0.5,
            pt: 1.5,
            pb: 1.5,
            bgcolor: "#ffffff1a",
            borderRadius: 4,
          }}
        >
          <SvgIcon size={42} name={icon} color={"white"} />
        </Grid>
      </Grid>
    );
  };
  const handleMaxVideoTrackCountChange = (count) => {
    //why the minus 1? because what user sees is (my local video + maxvideoTrackCount)
    //so if the user sets the tiles to 6 it means (1 + 5) respectively to the statement above.
    //what the count number actually is the second variable in that.
    antmedia.handleSetMaxVideoTrackCount(count - 1);
  };
  const debouncedHandleMaxVideoTrackCountChange = debounce(
    handleMaxVideoTrackCountChange,
    500
  );
  //const actualLayout = pinnedVideoId !== null ? 'sidebar' : 'tiled';

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      fullScreen={fullScreen}
      maxWidth={"xs"}
    >
      <AntDialogTitle onClose={handleClose}>
        {t("Change Layout")}
      </AntDialogTitle>
      <Typography variant="body2" color="#fff">
        {t("You can choose either tiled or sidebar view.")}
      </Typography>
      <DialogContent sx={{ px: 1 }}>
        <Box component="form" sx={{ display: "flex", flexWrap: "wrap" }}>
          <Grid container>
            <FormControl sx={{ width: "100%" }}>
              <RadioGroup
                aria-labelledby="layout-radio-buttons"
                defaultValue={pinnedVideoId !== null ? "sidebar" : "tiled"}
                value={layout}
                onChange={changeLayout}
                name="layout-radio-buttons-group"
              >
                <FormControlLabel
                  classes={{ label: "layout-radio-label" }}
                  sx={{ width: "100%", pb: 1 }}
                  value="tiled"
                  control={<Radio />}
                  label={radioLabel("Tiled", "tiled")}
                />
                <FormControlLabel
                  classes={{ label: "layout-radio-label" }}
                  sx={{ width: "100%" }}
                  value="sidebar"
                  control={<Radio />}
                  label={radioLabel("Sidebar", "sidebar")}
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Typography color="#fff" sx={{ fontWeight: 600, mt: 2.5, mb: 2 }}>
            Change tile count
          </Typography>
          <Grid
            container
            alignItems="center"
            justifyContent="space-between"
            columnSpacing={5}
          >
            <Grid item>
              <SvgIcon
                size={20}
                name={"filled-tiles-2x2"}
                color={"#cacaca"}
                viewBox="0 0 30 30"
              />
            </Grid>
            <Grid item xs>
              <CustomizedSlider
                value={value}
                aria-label="video track count"
                valueLabelDisplay="auto"
                defaultValue={value}
                step={null}
                min={3}
                max={30}
                marks={[
                  {
                    value: 3,
                  },
                  {
                    value: 6,
                  },
                  {
                    value: 12,
                  },
                  {
                    value: 30,
                  },
                ]}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (e.target.value !== value) {
                    debouncedHandleMaxVideoTrackCountChange(e.target.value);
                  }
                }}
              />
            </Grid>
            <Grid item>
              <SvgIcon
                size={30}
                name={"filled-tiles-3x3"}
                color={"#cacaca"}
                viewBox="0 0 30 30"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
