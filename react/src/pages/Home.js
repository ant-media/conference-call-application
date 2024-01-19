import {Button, Grid, TextField, Typography} from '@mui/material';
import {Box} from '@mui/system';
import React,{useCallback} from 'react';
import Link from '@mui/material/Link';
import {useTranslation} from 'react-i18next';
import {Link as RouterLink, useNavigate} from 'react-router-dom';
import {nanoid} from 'nanoid';
import Stack from "@mui/material/Stack";

function Home(props) {
    const {t} = useTranslation();
    let navigate = useNavigate();

    const [roomName, setRoomName] = React.useState('');

    const handleJoinButtonClick = useCallback(() => {
        navigate(`/${roomName}`);
    }, [navigate, roomName]);

    return (
        <>
            <Grid container justifyContent={"center"} sx={{mt: 8}}>
                <Box py={8}>
                    <Typography variant="h1" align="center">
                        Join our meeting room
                    </Typography>
                    <Box sx={{pt: 4, pb: 0}}>
                        <Typography variant="h4" align="center">
                            Real-time meetings by Ant Media
                        </Typography>
                    </Box>
                </Box>
                <Grid container spacing={{xs: 2, md: 3}} columns={{xs: 4, sm: 8, md: 12}}>
                    <Grid item xs={1} sm={4} md={4}>
                    </Grid>
                    <Grid item xs={3} sm={4} md={4}>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                autoFocus
                                required
                                fullWidth
                                color="primary"
                                variant="outlined"
                                placeholder={t("Room name")}
                                id="room_name"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                            />

                            <Button
                                fullWidth
                                color="secondary"
                                variant="contained"
                                type="submit"
                                onClick={handleJoinButtonClick}
                                id="room_join_button"
                            >
                                {t("Join the room")}
                            </Button>
                        </Stack>

                    </Grid>
                    <Grid item xs={1} sm={4} md={4}>
                    </Grid>
                    <Grid item xs={1} sm={4} md={4}>
                    </Grid>
                </Grid>
                <Grid container justifyContent={'center'}>
                    <Link component={RouterLink} to={`/${nanoid(8)}`} size="large" variant="contained" color="primary">
                        {t('Create Meeting')}
                    </Link>
                </Grid>
            </Grid>
        </>
    );
}

export default Home;
