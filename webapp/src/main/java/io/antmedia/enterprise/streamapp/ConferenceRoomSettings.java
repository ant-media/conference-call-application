package io.antmedia.enterprise.streamapp;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;

@PropertySource("/WEB-INF/red5-web.properties")
public class ConferenceRoomSettings {

    private final static String SETTINGS_ROOM_CREATION_PASSWORD_ENABLED = "settings.roomCreationPasswordEnabled";
    private final static String SETTINGS_ROOM_CREATION_PASSWORD = "settings.roomCreationPassword";


    @Value("${roomCreationPassword:${"+ SETTINGS_ROOM_CREATION_PASSWORD +":null}}")
    private String roomCreationPassword;


    @Value("${roomCreationPasswordEnabled:${"+ SETTINGS_ROOM_CREATION_PASSWORD_ENABLED +":false}}")
    private boolean roomCreationPasswordEnabled = false;


    public String getRoomCreationPassword() {
        return roomCreationPassword;
    }

    public void setRoomCreationPassword(String roomCreationPassword) {
        this.roomCreationPassword = roomCreationPassword;
    }

    public boolean isRoomCreationPasswordEnabled() {
        return roomCreationPasswordEnabled;
    }

    public void setRoomCreationPasswordEnabled(boolean roomCreationPasswordEnabled) {
        this.roomCreationPasswordEnabled = roomCreationPasswordEnabled;
    }


}
