package io.antmedia.enterprise.streamapp;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;

@PropertySource("/WEB-INF/red5-web.properties")
public class ConferenceRoomSettings {

    private final static String SETTINGS_CREATE_ROOM_WITH_PASSWORD = "settings.createRoomWithPassword";
    private final static String SETTINGS_PASSWORD_FOR_CREATING_ROOM = "settings.passwordForCreatingRoom";


    @Value("${createRoomWithPassword:${"+SETTINGS_PASSWORD_FOR_CREATING_ROOM+":null}}")
    private String passwordForCreatingRoom;


    @Value("${createRoomWithPassword:${"+SETTINGS_CREATE_ROOM_WITH_PASSWORD+":false}}")
    private boolean createRoomWithPassword = false;


    public String getPasswordForCreatingRoom() {
        return passwordForCreatingRoom;
    }

    public void setPasswordForCreatingRoom(String passwordForCreatingRoom) {
        this.passwordForCreatingRoom = passwordForCreatingRoom;
    }

    public boolean isCreateRoomWithPassword() {
        return createRoomWithPassword;
    }

    public void setCreateRoomWithPassword(boolean createRoomWithPassword) {
        this.createRoomWithPassword = createRoomWithPassword;
    }


}
