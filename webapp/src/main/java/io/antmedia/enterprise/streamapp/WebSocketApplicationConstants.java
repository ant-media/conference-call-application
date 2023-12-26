package io.antmedia.enterprise.streamapp;

public class WebSocketApplicationConstants {

    /**
     * Command to check if room creation password is enabled.
     */
    public static final String IS_ROOM_CREATION_PASSWORD_REQUIRED_COMMAND = "isRoomCreationPasswordRequired";

    /**
     * Command to create a conference room with room creation password.
     */
    public static final String CREATE_ROOM_WITH_PASSWORD_COMMAND = "createRoomWithPassword";


    /**
     * Represents the JSON key associated with the password for room creation.
     */
    public static final String ROOM_CREATION_PASSWORD = "roomCreationPassword";

    /**
     * Represents the JSON key associated with the room name.
     */
    public static final String ROOM_NAME = "roomName";

    /**
     * Represents the JSON key associated with the authentication status.
     */
    public static final String AUTHENTICATED = "authenticated";

    /**
     * Represents the JSON key associated with the join token.
     * Join token is actually a type publish jwt token.
     * If room creation password is enabled it should be passed to both play and publish on conference call client.
     */
    public static final String JOIN_TOKEN = "joinToken";
}
