import React, { useContext } from "react";
import {
  Grid,
  Typography,
  Button,
  TextField,
  Container,
  Tooltip,
} from "@mui/material";
import VideoCard from "Components/Cards/VideoCard";
import MicButton, {
  CustomizedBtn,
  roundStyle,
} from "Components/Footer/Components/MicButton";
import CameraButton from "Components/Footer/Components/CameraButton";
import { useParams } from "react-router-dom";
import { AntmediaContext } from "App";
import { useTranslation } from "react-i18next";
import { SettingsDialog } from "Components/Footer/Components/SettingsDialog";
import { SvgIcon } from "Components/SvgIcon";
import { useSnackbar } from "notistack";
import PlayOnlyModeWaitingRoom from "Components/WaitingRoom/PlayOnlyMode";
import PublisherModeWaitingRoom from "Components/WaitingRoom/PublisherMode";

function WaitingRoom(props) {
  const { id } = useParams();
  const { t } = useTranslation();

  const roomName = id;
  const antmedia = useContext(AntmediaContext);
  const { enqueueSnackbar } = useSnackbar();


  React.useEffect(() => {
    if(!antmedia.isPlayMode) {
      antmedia.mediaManager.localVideo = document.getElementById("localVideo");
      if (antmedia.mediaManager.localVideo === null) {
        return;
      }
      antmedia.mediaManager.localVideo.srcObject =
          antmedia.mediaManager.localStream;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (antmedia.isPlayMode === false) {
    PublisherModeWaitingRoom(props);
  } else {
    PlayOnlyModeWaitingRoom(props);
  }
}

export default WaitingRoom;
