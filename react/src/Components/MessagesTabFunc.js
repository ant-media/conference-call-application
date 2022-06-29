import React from 'react';
import Grid from '@mui/material/Grid';
import MessageCard from './Cards/MessageCard';

function MessagesTabFunc(props) {
    
    
    return (
        <Grid  item container sx={{ mt: 1 }} id="paper-props" style={{ flexWrap: 'nowrap', flex: 'auto', overflowY: 'auto' }}>
        
        <Grid item xs={12}>
          {props.messages.map((m, index) => (
            <Grid item key={index} xs={12}>
              <MessageCard  date={m.date} isMe={m?.eventType ? false : true} name={m.name} message={m.message} />
            </Grid>
          ))}
        </Grid>
      </Grid>
    );
}

export default MessagesTabFunc;