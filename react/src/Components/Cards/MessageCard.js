import React from 'react';
import {Grid, Typography} from '@mui/material';
import {urlify} from 'utils';
import {styled, useTheme} from '@mui/material/styles';

const HyperTypography = styled(Typography)(({theme}) => ({
  '& a': {
    color: '#fff',
  },
}));

function MessageCard(props) {
  const theme = useTheme();

  return (
    <Grid container sx={{mb: 3}} justifyContent={props?.isMe ? 'flex-end' : 'flex-start'}>
      <Grid container alignItems={'center'} justifyContent={props?.isMe ? 'flex-end' : 'flex-start'}>
        <Typography variant="body1" color={theme.palette.chatText} style={{fontSize: 14}}>
          {props?.name}{'  '}
        </Typography>
        <Typography variant="body2" color={theme.palette.grey} sx={{ml: 1}} style={{fontSize: 12}}>
          {props?.date}
        </Typography>
      </Grid>
      <Grid item xs={12} sx={{mt: 1}}>
        <HyperTypography variant="body1" fontSize={14} style={{whiteSpace: 'pre-wrap', overflowWrap: 'break-word'}}
                         color={theme.palette.chatText} align={props?.isMe ? 'right' : 'left'} fontWeight={400}
                         lineHeight={1.4} id="message">
          {urlify(props?.message)}
        </HyperTypography>
      </Grid>
    </Grid>
  );
}

export default MessageCard;
