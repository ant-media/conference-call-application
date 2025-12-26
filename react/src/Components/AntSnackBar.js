import React, {forwardRef, useCallback} from 'react';
import {SnackbarContent, useSnackbar} from 'notistack';
import {styled} from '@mui/material/styles';
import {Grid, Typography, useTheme} from '@mui/material';
import {SvgIcon} from './SvgIcon';

const AntSnackInfo = styled(Grid)(({theme}) => ({
  backgroundColor: theme.palette.themeColor?.[60],
  borderRadius: 6,
  padding: 8,
}));
const AntSnackMessage = styled(Grid)(({theme}) => ({
  backgroundColor: theme.palette.themeColor?.[60],
  borderRadius: 6,
  padding: '16px 16px 12px 16px',
  cursor: 'pointer',
  width: 320
}));
const AntSnackContent = styled(SnackbarContent)(({theme}) => ({}));
const SnackMessage = forwardRef((props, ref) => {
  const {variant, message, icon, onClick, sender} = props;
  const {closeSnackbar} = useSnackbar();

  const theme = useTheme();

  const handleDismiss = useCallback(() => {
    closeSnackbar();
  }, [closeSnackbar]);

  return (
    <AntSnackContent ref={ref}>
      {variant === 'info' && (
        <AntSnackInfo container justifyContent={'center'} alignItems={'center'}>
          {icon && (
            <Grid item sx={{mr: 0.5}}>
              {icon}
            </Grid>
          )}
          <Typography variant="subtitle2" color={theme.palette.themeColor?.[0]}>
            {message}
          </Typography>
        </AntSnackInfo>
      )}
      {variant === 'message' && (
        <AntSnackMessage
          container
          onClick={() => {
            onClick();
            handleDismiss();
          }}
        >
          <Grid container alignItems="center">
            <SvgIcon size={32} color={'#fff'} name={'message-off'}/>
            <Typography sx={{ml: 0.5}} variant="subtitle2"
                        color={theme.palette.themeColor?.[0]}>{`${sender}`}</Typography>
          </Grid>
          <Grid container sx={{mt: 1}} style={{marginLeft: 6}}>
            <Typography
              variant="subtitle2"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: '2',
                WebkitBoxOrient: 'vertical',
                overflowWrap: 'anywhere'
              }}
              color={theme.palette.themeColor?.[0]}
            >
              {message}
            </Typography>
          </Grid>
        </AntSnackMessage>
      )}
    </AntSnackContent>
  );
});

export default SnackMessage;
