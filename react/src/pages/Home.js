import {Button, Grid, TextField, Typography} from '@mui/material';
import {Box} from '@mui/system';
import React from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router-dom';
import {nanoid} from 'nanoid';
import Stack from "@mui/material/Stack";
import { RoomCreationPasswordDialog } from "Components/Footer/Components/RoomCreationPasswordDialog";
import { GoToLobbyDialog } from 'Components/Footer/Components/GoToLobbyDialog';
import { useWebSocket } from 'Components/WebSocketProvider';
import IletisimBaskanligiLogo from "../static/images/iletisim-baskanligi.png";



function Home(props) {
    const {t} = useTranslation();
    let navigate = useNavigate();

    const joinToken = React.useRef();
    const joinRoomUrl = React.useRef();
    
    const [settings, setSettings] = React.useState();
    const [createRoomPassword, setCreateRoomPassword] = React.useState();
    const [createRoomPasswordDialogOpen, setCreateRoomPasswordDialogOpen] = React.useState(false);
    const [goToLobbyDialogOpen, setGoToLobbyDialogOpen] = React.useState(false);

    const [roomName, setRoomName] = React.useState();

    const { sendMessage, latestMessage, isWebSocketConnected } = useWebSocket();

    const getAppPath = () => {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      return pathParts.length > 0 ? `/${pathParts[0]}` : "";
    };

    const getRestBaseUrl = () => `${window.location.origin}${getAppPath()}/rest/v2`;

    const buildMeetingUrl = (roomId, tokenValue) => {
      const basePath = `${window.location.origin}${getAppPath()}/${roomId}`;
      return `${basePath}?token=${tokenValue}`;
    };

    const createJwtTokenForRoom = async (roomId) => {
      const expireDate = 1795689600;
      const url = `http://localhost:5080/live/rest/v2/broadcasts/app-jwt-token?expireDate=${expireDate}&type=publish`
    
      const response = await fetch(url);
      console.log("response-----------", response);
      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`);
      }
      const data = await response.json();
      if (!data || !data.tokenId) {
        throw new Error("Token response is missing tokenId");
      }
      return data.tokenId;
    };

    const openLobbyDialogForRoom = async (roomId) => {
      try {
        const jwtToken = await createJwtTokenForRoom(roomId);
        joinToken.current = jwtToken;
        joinRoomUrl.current = buildMeetingUrl(roomId, jwtToken);
        setRoomName(roomId);
        setGoToLobbyDialogOpen(true);
      } catch (error) {
        console.error("Failed to generate JWT token:", error);
        alert("JWT token generation failed. Check jwtStreamSecretKey, jwtScope, and publishJwtControlEnabled.");
      }
    };


    const handleCreateRoomPasswordChange = (newPassword) => {
        setCreateRoomPassword(newPassword);
    };

    const handleRoomNameChange = (event) => {
        setRoomName(event.target.value);
    }; 

      const handleCreateMeeting = () => {
            console.log("handleCreateMeeting is called");
            if (typeof settings !== 'undefined' && settings.roomCreationPasswordEnabled) {
                setCreateRoomPasswordDialogOpen(true);
            }
            else {
              const newRoomId = roomName || nanoid(8);
              openLobbyDialogForRoom(newRoomId);
            }

      };


    const goToLobby = React.useCallback((roomId, joinToken) => {
      const newMeetingPath = roomId === undefined
        ? `/${nanoid(8)}`
        : `/${roomId}${joinToken ? `?token=${joinToken}` : ''}`;
      
      navigate(newMeetingPath); // Navigate to the new path programmatically
    }, [navigate]);

      const handleCreateRoomPasswordDialogClose = (value) => {
        setCreateRoomPasswordDialogOpen(false);
      };

      const handleGoToLobbyDialogClose = (value) =>{
        setGoToLobbyDialogOpen(false);

      }

      const handleGoToLobbyClicked = (value) =>{
        goToLobby(roomName, joinToken.current)
      
    }
    
    
      const handleCreateRoomWithPassword = (e) =>{
     
        var jsCmd = {
            command: "createRoomWithPassword",
            roomCreationPassword: createRoomPassword,
            };

          if(roomName){
            jsCmd.roomName = roomName
          }

          sendMessage(JSON.stringify(jsCmd));
      }

      React.useEffect(() => {
        //setMessages((prevMessages) => [...prevMessages, message]);
        if (latestMessage) {
          var obj = JSON.parse(latestMessage);
          if (obj.command === "setSettings") {
              var localSettings =  JSON.parse(obj.settings);
              console.log("roomCreationPasswordEnabled: ", localSettings.roomCreationPasswordEnabled);
              setSettings(localSettings);
          }
          else if(obj.command === "createRoomWithPassword")
          {
            if(obj.authenticated && obj.joinToken && obj.roomName)
            {
                  openLobbyDialogForRoom(obj.roomName);
            }else{
                alert("Room creation password is not correct. Please set password on app configuration file and enable JWT token stream security from settings.")
            }
        }
       }
    },[latestMessage]);

    React.useEffect(() => {
        if (isWebSocketConnected) {
          var jsCmd = {
            command: "getSettings",
          };
          sendMessage(JSON.stringify(jsCmd));
        }
    }, [isWebSocketConnected, sendMessage]);

    return (
        <>
       <GoToLobbyDialog
                onClose={handleGoToLobbyDialogClose}
                url={joinRoomUrl.current}
                open={goToLobbyDialogOpen}
                onGoToLobbyClicked={handleGoToLobbyClicked} 
        />
       <RoomCreationPasswordDialog
                onClose={handleCreateRoomPasswordDialogClose}
                password={createRoomPassword}
                onPasswordChange={handleCreateRoomPasswordChange}
                open={createRoomPasswordDialogOpen}
                onCreateRoomClicked={handleCreateRoomWithPassword} 
                //roomName = {roomName}
               // onRoomNameChange = {handleCreateRoomNameChange}
        />
      


            <Grid container justifyContent={"center"} sx={{mt: 8}}>
                <Box py={8}>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                        <Box
                            component="img"
                            src={IletisimBaskanligiLogo}
                            alt="Iletisim Baskanligi logo"
                            sx={{
                                width: { xs: "280px", sm: "360px", md: "420px" },
                                height: "auto",
                                objectFit: "contain",
                                filter: "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2))",
                            }}
                        />
                    </Box>
                    <Typography variant="h1" align="center">
                        {t("Join our meeting room")}
                    </Typography>
                    <Box sx={{pt: 4, pb: 0}}>
                        <Typography variant="h4" align="center">
                            {t("Real-time meetings by Ant Media")}
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
                                onChange={handleRoomNameChange}
                                color="primary"
                                variant="outlined"
                                autoComplete="off"
                                placeholder={t("Meeting name")}
                                id="room_name"
                            />

                            <Button
                                fullWidth
                                color="secondary"
                                variant="contained"
                                type="submit"
                                onClick={handleCreateMeeting}
                                id="room_join_button"
                            >
                                {t("Create Meeting")}
                            </Button>
                        </Stack>

                    </Grid>
                    <Grid item xs={1} sm={4} md={4}>
                    </Grid>
                    <Grid item xs={1} sm={4} md={4}>
                    </Grid>
                </Grid>
                <Grid container justifyContent={'center'}>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        {t('You can name the meeting or leave it blank for a random link.')}
                    </Typography>
                </Grid>
            </Grid>
        </>
    );
}

export default Home;
