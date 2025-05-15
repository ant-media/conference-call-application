import React from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from './SvgIcon';
import {useTheme} from "@mui/material/styles";

function DrawerButton(props) {
  const theme = useTheme();
  //this component is separate because settings context updates a lot and causes whole component to rerender.

  return (
    <Button sx={{ minWidth: 30 }} onClick={() => {props?.handleMessageDrawerOpen(false); props?.handleParticipantListOpen(false); props?.handleEffectsOpen(false); props?.setPublisherRequestListDrawerOpen(false);}}>
      <SvgIcon size={24} name={'close'} color={theme.palette.text.primary} />
    </Button>
  );
}

export default DrawerButton;
