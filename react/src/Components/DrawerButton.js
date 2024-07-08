import React from 'react';
import Button from '@mui/material/Button';
import { SvgIcon } from './SvgIcon';
import { ConferenceContext } from 'pages/AntMedia';

function DrawerButton(props) {
  const conference = React.useContext(ConferenceContext);
  //this component is separate because settings context updates a lot and causes whole component to rerender.
  return (
    <Button sx={{ minWidth: 30 }} onClick={() => {conference?.handleMessageDrawerOpen(false); conference?.handleParticipantListOpen(false);}}>
      <SvgIcon size={24} name={'close'} color={'white'} />
    </Button>
  );
}

export default DrawerButton;
