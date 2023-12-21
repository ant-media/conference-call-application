import {Button, Grid, TextField, Typography} from '@mui/material';
import {Box} from '@mui/system';
import React from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router-dom';
import {nanoid} from 'nanoid';
import Stack from "@mui/material/Stack";

import { getWebSocketURLAttribute } from "../utils";
import { RoomCreationPassword } from "Components/Footer/Components/RoomCreationPassword";


function Home(props) {
    const {t} = useTranslation();
    let navigate = useNavigate();

    const roomNameRef = React.useRef(); // Create a ref to store roomName
    const applicationWebSocketUrlRef = React.useRef(); // Store applicationWebSocketUrl in a useRef

    const [applicationWebSocket, setApplicationWebSocket] = React.useState();
    const [createRoomPassword, setCreateRoomPassword] = React.useState();
    const [createRoomPasswordDialogOpen, setCreateRoomPasswordDialogOpen] = React.useState(false);
    const [roomName, setRoomName] = React.useState();

    const handleCreateRoomPasswordChange = (newPassword) => {
        setCreateRoomPassword(newPassword);
      };

      const handleCreateRoomNameChange = (newRoomName) => {
        setRoomName(newRoomName);
        roomNameRef.current = newRoomName
      };

      const handleCreateMeeting = () => {
       var jsCmd = {
        command: "isRoomCreationPasswordRequired",

        };
        applicationWebSocket.send(JSON.stringify(jsCmd));

      };

      const goToLobby = React.useCallback((roomId) => {
        var newMeetingPath = "";
        if (roomId === undefined) {
          newMeetingPath = `/${nanoid(8)}`;
        } else {
          newMeetingPath = `/${roomId}`;
        }
        navigate(newMeetingPath); // Navigate to the new path programmatically
      }, [navigate]);

      const handleCreateRoomPasswordDialogClose = (value) => {
        setCreateRoomPasswordDialogOpen(false);
      };
    
    
      const handleCreateRoomWithPassword = (e) =>{
       
        var jsCmd = {
            command: "createRoomWithPassword",
            roomCreationPassword: createRoomPassword,
            roomName:roomName
    
            };
            applicationWebSocket.send(JSON.stringify(jsCmd));
        
      }



    React.useEffect(() => {
        if (!applicationWebSocketUrlRef.current) {

            var applicationWebSocketUrl = getWebSocketURLAttribute();
          
            if (!applicationWebSocketUrl) {
              const appName = window.location.pathname.substring(
                  0,
                  window.location.pathname.lastIndexOf("/") + 1
              );
              const path =
                  window.location.hostname +
                  ":" +
                  window.location.port +
                  appName +
                  "websocket";
                  applicationWebSocketUrl = "ws://" + path;
          
              if (window.location.protocol.startsWith("https")) {
                applicationWebSocketUrl = "wss://" + path;
              }
         
            }
            applicationWebSocketUrlRef.current = applicationWebSocketUrl + "/application"
            setApplicationWebSocket(new WebSocket(applicationWebSocketUrlRef.current) )
          }

      }, []);


      React.useEffect(() => {
        if (applicationWebSocket) {
            applicationWebSocket.onopen = () => {
            console.log("application websocket connected.")
            }
    
            applicationWebSocket.onmessage = (event) => {
                var obj = JSON.parse(event.data);
    
                if(obj.command === "isRoomCreationPasswordRequired"){
                    
                    if(obj.required){
                        setCreateRoomPasswordDialogOpen(obj.required)
                    }else{
                        goToLobby()

                    }
                    
                }else if(obj.command === "createRoomWithPassword"){

                    if(obj.authenticated){

                        goToLobby(roomNameRef.current)

                    }else{
                        alert("Room creation password is wrong!")
                    }



                }
            }
        }
      }, [applicationWebSocket, goToLobby]);




    return (
        <>
     <RoomCreationPassword
                 onClose={handleCreateRoomPasswordDialogClose}
                password={createRoomPassword}
                onPasswordChange={handleCreateRoomPasswordChange}
                open={createRoomPasswordDialogOpen}
                onCreateRoomClicked={handleCreateRoomWithPassword} 
                roomName = {roomName}
                onRoomNameChange = {handleCreateRoomNameChange}
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
                                color="primary"
                                variant="outlined"
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
