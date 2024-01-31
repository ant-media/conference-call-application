import React from "react";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import { SvgIcon } from "./SvgIcon";
import { ConferenceContext } from "pages/AntMedia";
import {CustomizedBtn} from "./Footer/Components/MicButton";
import {useTheme} from "@mui/material";
import virtualBackgroundImageData from 'virtualBackground.json';

function EffectsTab() {
  const conference = React.useContext(ConferenceContext);
  const theme = useTheme();
  const getBackgroundImages = () => {
    const images = [];
    for (let i = 0; i < virtualBackgroundImageData.virtualBackgroundImages.length; i++) {
      images.push(
        <Grid item key={i}>
            <CustomizedBtn
              style={{background: theme.palette.themeColor[60], marginRight: 10, marginBottom: 10}}
              id="mic-button" onClick={(e) => {
                conference.setVirtualBackgroundImage(virtualBackgroundImageData.virtualBackgroundImages[i]);
                conference.handleBackgroundReplacement("background");
              }}>
              <img width={40} height={40} src={virtualBackgroundImageData.virtualBackgroundImages[i]} alt={"virtual background image " + i}></img>
            </CustomizedBtn>
        </Grid>
      );
    }
    return images;
  };

  return (
        <div style={{width: "100%", overflowY: "auto"}}>
          <Stack sx={{width: "100%",}} spacing={2}>
            <Grid container>
              <p>No effect & blur</p>
            </Grid>
            <Grid container>
              <CustomizedBtn
                style={{background: theme.palette.themeColor[60], marginRight: 10}}
                id="remove-effect-button" onClick={(e) => { conference.handleBackgroundReplacement("none"); }}>
                <SvgIcon size={40} name={'remove-effect'} color="#fff" />
              </CustomizedBtn>
              <CustomizedBtn
                style={{background: theme.palette.themeColor[60], marginRight: 10}}
                id="blur-button" onClick={(e) => { conference.handleBackgroundReplacement("blur"); }}>
                <SvgIcon size={40} name={'blur'} color="#fff" />
              </CustomizedBtn>
            </Grid>
            <Grid container>
              <p>Backgrounds</p>
            </Grid>
            <Grid container>
              <Grid item key={"add-background-image"}>
                <CustomizedBtn
                  style={{
                    background: theme.palette.themeColor[60],
                    marginRight: 10,
                    marginBottom: 10,
                    width: 40,
                    height: 60
                  }}
                  id="remove-effect-button" onClick={(e) => {
                }}>
                  <SvgIcon size={40} name={'add-background-image'} color="#fff"/>
                </CustomizedBtn>
              </Grid>
              {getBackgroundImages()}
            </Grid>
          </Stack>
        </div>
  );

}

export default EffectsTab;
