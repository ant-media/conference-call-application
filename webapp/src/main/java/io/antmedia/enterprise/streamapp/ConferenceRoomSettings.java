package io.antmedia.enterprise.streamapp;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;

@PropertySource("/WEB-INF/red5-web.properties")
public class ConferenceRoomSettings {



    @Value("${roomCreationPassword:#{null}}")
    private String roomCreationPassword;


    @Value("${roomCreationPasswordEnabled:false}")
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
