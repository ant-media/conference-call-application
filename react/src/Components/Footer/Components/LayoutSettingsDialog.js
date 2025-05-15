import * as React from "react";
import {alpha, styled} from "@mui/material/styles";

import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Slider,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {useTranslation} from "react-i18next";
import {SvgIcon} from "Components/SvgIcon";
import debounce from "lodash/debounce";

const CustomizedSlider = styled(Slider)(({theme}) => ({
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
  const {children, onClose, ...other} = props;

  return (
    <DialogTitle {...other}>
      {children}
      {onClose ? (
        <Button
          aria-label="close"
          onClick={onClose}
          id="layout-dialog-close-button"
          sx={{
            position: "absolute",
            right: 26,
            top: 27,
          }}
        >
          <SvgIcon size={30} name={"close"} color={"#fff"}/>
        </Button>
      ) : null}
    </DialogTitle>
  );
};

export function LayoutSettingsDialog(props) {
  const {t} = useTranslation();

  const [value, setValue] = React.useState(
    props?.globals.maxVideoTrackCount
  );
  const [layout, setLayout] = React.useState( "tiled"); //just for radioo buttons

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));

  const handleClose = () => {
    props?.onClose(props?.selectedValue);
  };

  const changeLayout = (event) => {
    const mode = event.target.value;
    setLayout(mode);

    if (mode === "tiled") {
      //unpin the pinned video
      Object.keys(props?.allParticipants).forEach(streamId => {
        if (typeof props?.allParticipants[streamId].pinned === 'undefined'
          && props?.allParticipants[streamId].pinned === true) {
          props?.pinVideo(streamId);
        }
      });
    } else if (mode === "sidebar") {
      //pins your video
      props?.pinFirstVideo();
    }
  };
  const radioLabel = (label, icon) => {
    return (
      <Grid
        container
        style={{width: "100%"}}
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
          <SvgIcon size={42} name={icon} color={"#fff"}/>
        </Grid>
      </Grid>
    );
  };
  const handleMaxVideoTrackCountChange = (count) => {
    props?.handleSetDesiredTileCount(count);
  };
  const debouncedHandleMaxVideoTrackCountChange = debounce(
    handleMaxVideoTrackCountChange,
    500
  );
  //const actualLayout = pinnedVideoId !== null ? 'sidebar' : 'tiled';

  return (
    <Dialog
      onClose={handleClose}
      open={props?.open}
      fullScreen={fullScreen}
      maxWidth={"xs"}
    >
      <AntDialogTitle onClose={handleClose}>
        {t("Change Layout")}
      </AntDialogTitle>
      <Typography variant="body2" color="#fff">
        {t("You can choose either tiled or sidebar view.")}
      </Typography>
      <DialogContent sx={{px: 1}}>
        <Box component="form" sx={{display: "flex", flexWrap: "wrap"}}>
          <Grid container>
            <FormControl sx={{width: "100%"}}>
              <RadioGroup
                aria-labelledby="layout-radio-buttons"
                defaultValue={"tiled"}
                value={layout}
                onChange={changeLayout}
                name="layout-radio-buttons-group"
              >
                <FormControlLabel
                  classes={{label: "layout-radio-label"}}
                  sx={{width: "100%", pb: 1}}
                  value="tiled"
                  control={<Radio/>}
                  label={radioLabel(t("Tiled view"), "tiled")}
                />
                <FormControlLabel
                  classes={{label: "layout-radio-label"}}
                  sx={{width: "100%"}}
                  value="sidebar"
                  control={<Radio/>}
                  label={radioLabel(t("Sidebar view"), "sidebar")}
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Typography color="#fff" sx={{fontWeight: 600, mt: 2.5, mb: 2}}>
            {t("Change tile count")}
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
                id="tile-count-slider"
                defaultValue={value}
                step={null}
                min={2}
                max={30}
                marks={[
                  {
                    value: 2,
                  },
                  {
                    value: 4,
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
