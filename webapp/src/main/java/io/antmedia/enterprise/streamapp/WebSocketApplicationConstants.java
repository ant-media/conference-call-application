package io.antmedia.enterprise.streamapp;

public class WebSocketApplicationConstants {

	private WebSocketApplicationConstants() {

	}
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

    /**
     * Return the settings or configuration of the backend. It returns
     * {@link ConferenceRoomSettings}
     */
    public static final String GET_SETTINGS_COMMAND = "getSettings";


    /**
     * Return the settings or configuration of the backend. It returns
     * {@link ConferenceRoomSettings}
     */
    public static final String SET_SETTINGS_COMMAND = "setSettings";

    /**
     * Field to send settings to frontend
     */
	public static final String SETTINGS = "settings";

    public static final String PING_COMMAND = "ping";

    public static final String SYNC_ADMINISTRATIVE_FIELDS_COMMAND = "syncAdministrativeFields";

	public static final String START_RECORDING_COMMAND = "startRecording";

	public static final String STOP_RECORDING_COMMAND = "stopRecording";

	public static final String WEBSOCKET_URL_FIELD = "websocketURL";

	public static final String START_RECORDING_RESPONSE = "startRecordingResponse";

	public static final String STOP_RECORDING_RESPONSE = "stopRecordingResponse";

    public static final String CHECK_IF_HAS_ADMIN_RIGHTS_RESPONSE = "checkIfHasAdminRightsResponse";

    public static final String PONG_RESPONSE = "pong";

    public static final String MAIN_ROOM_BROADCAST_UPDATED_EVENT = "MAIN_ROOM_BROADCAST_UPDATED";
}
