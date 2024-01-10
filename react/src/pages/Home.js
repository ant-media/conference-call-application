import {Button, Grid, TextField, Typography} from '@mui/material';
import {Box} from '@mui/system';
import React from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router-dom';
import {nanoid} from 'nanoid';
import Stack from "@mui/material/Stack";


import { getWebSocketURLAttribute } from "../utils";
import { RoomCreationPasswordDialog } from "Components/Footer/Components/RoomCreationPasswordDialog";
import { GoToLobbyDialog } from 'Components/Footer/Components/GoToLobbyDialog';
import  { WebSocketComponent, sendWebSocketMessage }  from 'Components/WebSocketComponent';



function Home(props) {
    const {t} = useTranslation();
    let navigate = useNavigate();

    const roomNameRef = React.useRef(); // Create a ref to store roomName
    const applicationWebSocketUrlRef = React.useRef(); // Store applicationWebSocketUrl in a useRef
    const joinToken = React.useRef();
    const joinRoomUrl = React.useRef();
    
    const [settings, setSettings] = React.useState();
    const [applicationWebSocket, setApplicationWebSocket] = React.useState();
    const [createRoomPassword, setCreateRoomPassword] = React.useState();
    const [createRoomPasswordDialogOpen, setCreateRoomPasswordDialogOpen] = React.useState(false);
    const [goToLobbyDialogOpen, setGoToLobbyDialogOpen] = React.useState(false);

    const [roomName, setRoomName] = React.useState();

    const handleCreateRoomPasswordChange = (newPassword) => {
        setCreateRoomPassword(newPassword);
    };

    const handleRoomNameChange = (event) => {
        setRoomName(event.target.value);
    }; 

      const handleCreateMeeting = () => {
            console.log("handleCreateMeeting is called");
            if (settings.roomCreationPasswordEnabled) {
                setCreateRoomPasswordDialogOpen(true);
            }
            else {
              goToLobby()
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

          sendWebSocketMessage(JSON.stringify(jsCmd));
      }

      const handleWebSocketMessage = React.useCallback((message) => {
        //setMessages((prevMessages) => [...prevMessages, message]);
        var obj = JSON.parse(message);
        if (obj.command == "setSettings") {
            var localSettings =  JSON.parse(obj.settings);
            console.log("roomCreationPasswordEnabled: ", localSettings.roomCreationPasswordEnabled);
            setSettings(localSettings);
        }
        else if(obj.command === "createRoomWithPassword")
        {
          if(obj.authenticated && obj.joinToken && obj.roomName)
          {
                const currentURL = window.location.href;
                joinToken.current = obj.joinToken
                joinRoomUrl.current = currentURL + obj.roomName +"?token="+ obj.joinToken
                setRoomName(obj.roomName);
                setGoToLobbyDialogOpen(true)
          }else{
              alert("Room creation password is wrong")
          }
      }
    }, []);

    const onWebSocketOpen = React.useCallback(() => {
        var jsCmd = {
          command: "getSettings",
        };
        sendWebSocketMessage(JSON.stringify(jsCmd));
    },[]);

    return (
        <>
       <WebSocketComponent onOpen={onWebSocketOpen} onMessage={handleWebSocketMessage} />
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
                                onChange={handleRoomNameChange}
                                color="primary"
                                variant="outlined"
                                autocomplete="off"
                                placeholder={t("Room name")}
                                id="room_name"
                            />

                            <Button
                                fullWidth
                                color="secondary"
                                variant="contained"
                                type="submit"
                                onClick={() => {
                                    let roomName = document.getElementById("room_name").value;
                                    navigate(`/${roomName}`);
                                }}
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
                    <Typography
      variant="body1"

      style={{ textDecoration: 'underline', cursor: 'pointer',       color: 'white' // Set text color to white
    }}
      onClick={handleCreateMeeting}
    >
      {t('Create Meeting')}
    </Typography>
                </Grid>
            </Grid>
        </>
    );
}

export default Home;
