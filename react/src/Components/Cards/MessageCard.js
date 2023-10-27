import React from 'react';
import { Grid, Typography } from '@mui/material';
import { urlify } from 'utils';
import { styled } from '@mui/material/styles';

const HyperTypography = styled(Typography)(({ theme }) => ({
  '& a': {
    color: 'white',
  },
}));
function MessageCard(props) {
  const { date, name, message,isMe } = props;
  //chat color
  return (
    <Grid container sx={{ mb: 3 }} justifyContent={isMe ? 'flex-end' : 'flex-start'} >
      <Grid container alignItems={'center'} justifyContent={isMe ? 'flex-end' : 'flex-start'}>
        <Typography variant="body1" color="#000000" style={{fontSize:14}}>
          {name}{'  '}
        </Typography>
        <Typography variant="body2" color="#3b3737" sx={{ ml: 1 }} style={{fontSize:12}}>
          {date}
        </Typography>
      </Grid>
      <Grid item xs={12} sx={{ mt: 1 }} >
        <HyperTypography variant="body1" fontSize={14} style={{whiteSpace:'pre-wrap',overflowWrap: 'break-word'}} color="#000000" align={isMe ? 'right':'left'} fontWeight={400} lineHeight={1.4}>
          {urlify(message)}
        </HyperTypography>
      </Grid>
    </Grid>
  );
}

export default MessageCard;
