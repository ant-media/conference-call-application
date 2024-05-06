import React from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from './SvgIcon';
import { ConferenceContext } from 'pages/AntMedia';
import {useTheme} from "@mui/material/styles";

function DrawerButton(props) {
  const conference = React.useContext(ConferenceContext);
  const theme = useTheme();
  //this component is separate because settings context updates a lot and causes whole component to rerender.

  return (
    <Button sx={{ minWidth: 30 }} onClick={() => {conference?.handleMessageDrawerOpen(false); conference?.handleParticipantListOpen(false); conference?.handleEffectsOpen(false); conference?.setPublisherRequestListDrawerOpen(false);}}>
      <SvgIcon size={24} name={'close'} color={'#000000'} />
    </Button>
  );
}

export default DrawerButton;
