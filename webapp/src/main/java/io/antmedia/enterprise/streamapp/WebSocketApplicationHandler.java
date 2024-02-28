package io.antmedia.enterprise.streamapp;

import static io.antmedia.muxer.IAntMediaStreamHandler.BROADCAST_STATUS_BROADCASTING;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Date;
import java.util.List;

import io.antmedia.rest.RestServiceBase;
import org.apache.catalina.core.ApplicationContextFacade;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.apache.commons.lang3.reflect.FieldUtils;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.context.ConfigurableWebApplicationContext;
import org.springframework.web.context.support.WebApplicationContextUtils;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import io.antmedia.AppSettings;
import io.antmedia.datastore.db.DataStore;
import io.antmedia.datastore.db.DataStoreFactory;
import io.antmedia.datastore.db.IDataStoreFactory;
import io.antmedia.datastore.db.types.Broadcast;
import io.antmedia.datastore.db.types.Token;
import io.antmedia.filter.JWTFilter;
import io.antmedia.rest.model.Result;
import io.antmedia.security.ITokenService;
import io.antmedia.settings.ServerSettings;
import io.antmedia.websocket.WebSocketConstants;
import jakarta.websocket.EndpointConfig;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnError;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;


@ServerEndpoint(value="/websocket/application", configurator=AMSEndpointConfigurator.class)
public class WebSocketApplicationHandler 
{
	private static final String MEDIA_PUSH_PLUGIN_BEAN_NAME = "plugin.mediaPushPlugin";

	private static final String SUFFIX = "_composite";

	JSONParser jsonParser = new JSONParser();

	private String userAgent = "N/A";

	protected static Logger logger = LoggerFactory.getLogger(WebSocketApplicationHandler.class);

	ConfigurableWebApplicationContext context;

	AMSBroadcastManager amsBroadcastManager;
	ConferenceRoomSettings conferenceRoomSettings;

	private Gson gsonOnlyExposedFields = new GsonBuilder().excludeFieldsWithoutExposeAnnotation().create();
	
	private Gson gson = new Gson();

	private Object mediaPushPlugin;

	private AppSettings appSettings;

	@OnOpen
	public void onOpen(Session session, EndpointConfig config) {
		if(config.getUserProperties().containsKey(AMSEndpointConfigurator.USER_AGENT)) {
			userAgent = (String) config.getUserProperties().get(AMSEndpointConfigurator.USER_AGENT);
		}

		logger.info("Web Socket opened session:{} user-agent:{}", session.getId(), userAgent);

		//increase max text buffer size - Chrome 90 requires
		session.setMaxTextMessageBufferSize(8192 * 10);

		setApplicationContext(session);
		setConferenceRoomSettings();
		setAppSettings();
	}


	@OnClose
	public void onClose(Session session) {

	}

	@OnError
	public void onError(Session session, Throwable throwable) {

	}

	@OnMessage
	public void onMessage(Session session, String message) {


		if (context != null && context.isRunning()) {
			try {
				processApplicationMessage(session, message);
			} catch (Exception e) {
				logger.error(ExceptionUtils.getMessage(e));
			}
		} else {
			sendNotInitializedError(session);
		}
	}

	private AMSBroadcastManager getAMSBroadcastManager() {
		if (amsBroadcastManager == null && context != null) {
			amsBroadcastManager = (AMSBroadcastManager) context.getBean("amsBroadcastManager");
		}
		return amsBroadcastManager;
	}

	private void setConferenceRoomSettings(){
		if(context != null){
			conferenceRoomSettings = (ConferenceRoomSettings) context.getBean("conferenceRoomSettings");
		}
	}
	
	private void setAppSettings() {
		if (context != null) {
			appSettings = (AppSettings)context.getBean(AppSettings.BEAN_NAME);
		}
	}


	private void setApplicationContext(Session session) {
		try {
			ApplicationContextFacade servletContext = (ApplicationContextFacade) FieldUtils.readField(session.getContainer(), "servletContext", true);
			context = (ConfigurableWebApplicationContext) WebApplicationContextUtils.getWebApplicationContext(servletContext);
		} catch (Exception e) {
			logger.error("Application context can not be set to WebSocket handler");
			logger.error(ExceptionUtils.getMessage(e));
		}
	}

	public void sendNotInitializedError(Session session) {
		JSONObject jsonResponse = new JSONObject();
		jsonResponse.put(WebSocketConstants.COMMAND, WebSocketConstants.ERROR_COMMAND);
		jsonResponse.put(WebSocketConstants.DEFINITION, WebSocketConstants.NOT_INITIALIZED_YET);
		sendMessage(session, jsonResponse.toJSONString());
	}


	public Result startRecording(String streamId, String websocketUrl, int width, int height, String url, String token) {

		Result result = new Result(false);

		// Get the startBroadcasting method
		Method startMediaPush;
		try {
			startMediaPush = getMediaPushPlugin().getClass().getMethod("startMediaPush", String.class, String.class, int.class, int.class, String.class, String.class, String.class);
			// Invoke startBroadcasting
			result = (Result) startMediaPush.invoke(getMediaPushPlugin(), streamId, websocketUrl, width, height, url, token, "mp4");

		} 
		catch (NoSuchMethodException | SecurityException | IllegalAccessException | IllegalArgumentException | InvocationTargetException e) 
		{
			logger.error(ExceptionUtils.getStackTrace(e));
			result.setMessage(e.getMessage());
		}  

		return result;
	}

	public Result stopRecording(String streamId) {
		Result result = new Result(false);
		try {
			Method stopBroadcastingMethod = getMediaPushPlugin().getClass().getMethod("stopMediaPush", String.class);

			// Invoke stopBroadcasting
			result = (Result) stopBroadcastingMethod.invoke(getMediaPushPlugin(), streamId);
		}
		catch (NoSuchMethodException | SecurityException | IllegalAccessException | IllegalArgumentException | InvocationTargetException e) 
		{
			logger.error(ExceptionUtils.getStackTrace(e));
			result.setMessage(e.getMessage());
		}  

		return result;

	}
	
	public static String generateJwtToken(String jwtSecretKey, String streamId, long expireDateUnixTimeStampMs, String type) 
	{
		Date expireDateType = new Date(expireDateUnixTimeStampMs);
		String jwtTokenId = null;
		try {
			Algorithm algorithm = Algorithm.HMAC256(jwtSecretKey);

			jwtTokenId = JWT.create().
					withClaim("streamId", streamId).
					withClaim("type", type).
					withExpiresAt(expireDateType).
					sign(algorithm);

		} catch (Exception e) {
			logger.error(ExceptionUtils.getStackTrace(e));
		}

		return jwtTokenId;
	}

	public void processApplicationMessage(Session session, String message) throws ParseException {
		JSONObject jsonObject = (JSONObject) jsonParser.parse(message);
		String cmd = (String) jsonObject.get(WebSocketConstants.COMMAND);

		if (cmd.equals(WebSocketApplicationConstants.IS_ROOM_CREATION_PASSWORD_REQUIRED_COMMAND))
		{
			handlePasswordRequiredCommand(session);
		}
		else if (cmd.equals(WebSocketApplicationConstants.CREATE_ROOM_WITH_PASSWORD_COMMAND))
		{
			handleRoomCreationWithPassword(session, jsonObject);
		}
		else if (cmd.equals(WebSocketApplicationConstants.GET_SETTINGS_COMMAND))
		{
			responseRoomSettings(session);

		}
		else if (cmd.equals(WebSocketApplicationConstants.CHECK_IF_HAS_ADMIN_RIGHTS_COMMAND))
		{
			String streamId = (String)jsonObject.get(WebSocketConstants.STREAM_ID);
			String roomName = (String) jsonObject.get(WebSocketApplicationConstants.ROOM_NAME);
			String token =  (String) jsonObject.get(WebSocketConstants.TOKEN);

			boolean hasAdminRights = hasAdminRights(token, streamId, roomName);

			Result result = new Result(hasAdminRights);
			sendResponse(session, WebSocketApplicationConstants.CHECK_IF_HAS_ADMIN_RIGHTS_RESPONSE, result);
		}
		else if (cmd.equals(WebSocketApplicationConstants.START_RECORDING_COMMAND)) {
			//start recording
			String streamId = (String)jsonObject.get(WebSocketConstants.STREAM_ID);
			String websocketUrl = (String) jsonObject.get(WebSocketApplicationConstants.WEBSOCKET_URL_FIELD);
			String token =  (String) jsonObject.get(WebSocketConstants.TOKEN);

			Result result = new Result(false);
			try {
				//ws://127.0.0.1:5080/ConferenceCall/websocket
				URI websocketURLObject = new URI(websocketUrl);


				String url = websocketURLObject.getScheme().contains("wss") ? "https://" : "http://";
				url += websocketURLObject.getHost() + ":" + websocketURLObject.getPort();
				String path = websocketURLObject.getPath();

				url += path.substring(0, path.lastIndexOf("/")+1);
				//url to publish is in this format

				//http://127.0.0.1:5080/ConferenceCall/roomId+"?playOnly=true&enterDirectly=true"
				String urlToPublish = url + streamId + "?playOnly=true&enterDirectly=true&token="+token;

				logger.info("start recording for {} and websocket url {} url to publish:{}", streamId, websocketUrl, urlToPublish);

				String streamIdRecording = streamId + SUFFIX;
				String publishToken = "";
				if (StringUtils.isNotBlank(appSettings.getJwtStreamSecretKey())) {
					publishToken = generateJwtToken(appSettings.getJwtStreamSecretKey(), streamIdRecording, System.currentTimeMillis()+60000,  Token.PUBLISH_TOKEN);
				}

				result = startRecording(streamIdRecording, websocketUrl, 1280, 720, urlToPublish, publishToken);

			}
			catch (URISyntaxException e) {
				logger.error(ExceptionUtils.getStackTrace(e));
				result.setMessage(e.getMessage());
			}
			finally
			{
				sendResponse(session, WebSocketApplicationConstants.START_RECORDING_RESPONSE, result);
			}
		}
		else if (cmd.equals(WebSocketApplicationConstants.STOP_RECORDING_COMMAND))
		{
			String streamId = (String)jsonObject.get(WebSocketConstants.STREAM_ID);

			logger.info("stop recording for {}", streamId);

			String streamIdRecording = streamId + SUFFIX;
			Result result = stopRecording(streamIdRecording);

			sendResponse(session, WebSocketApplicationConstants.STOP_RECORDING_RESPONSE, result);
		}
		else if (cmd.equals(WebSocketApplicationConstants.MAKE_PRESENTER_COMMAND))
		{
			// Extract fields from JSON object
			String participantId = (String)jsonObject.get(WebSocketApplicationConstants.PARTICIPANT_ID_FIELD);
			String roomName = (String)jsonObject.get(WebSocketApplicationConstants.ROOM_NAME_FIELD);
			String listenerRoomName = (String)jsonObject.get(WebSocketApplicationConstants.LISTENER_ROOM_NAME_FIELD);
			String streamId = (String)jsonObject.get(WebSocketApplicationConstants.STREAM_ID_FIELD);
			String token = (String)jsonObject.get(WebSocketConstants.TOKEN);

			// Check for admin rights
			if (!hasAdminRights(token, streamId, roomName)) {
				sendResponse(session, WebSocketApplicationConstants.MAKE_PRESENTER_RESPONSE,
						new Result(false, "You do not have admin rights in the room"));
				return;
			}

			// Attempt to make presenter and prepare result
			boolean isSuccess = handleMakePresenter(participantId, roomName,listenerRoomName);
			Result result = new Result(isSuccess);
			result.setDataId(participantId);

			sendResponse(session, WebSocketApplicationConstants.MAKE_PRESENTER_RESPONSE, result);
		}
		else if (cmd.equals(WebSocketApplicationConstants.UNDO_PRESENTER_COMMAND))
		{
			// Extracting values from jsonObject
			String participantId = (String)jsonObject.get(WebSocketApplicationConstants.PARTICIPANT_ID_FIELD);
			String listenerRoomName = (String)jsonObject.get(WebSocketApplicationConstants.LISTENER_ROOM_NAME_FIELD);
			String roomName = (String)jsonObject.get(WebSocketApplicationConstants.ROOM_NAME_FIELD);
			String streamId = (String)jsonObject.get(WebSocketApplicationConstants.STREAM_ID_FIELD);
			String token = (String)jsonObject.get(WebSocketConstants.TOKEN);

			// Check for admin rights and respond if check fails
			if (!hasAdminRights(token, streamId, roomName)) {
				sendResponse(session, WebSocketApplicationConstants.UNDO_PRESENTER_RESPONSE,
						new Result(false, "You do not have admin rights in the room"));
				return;
			}

			// Process undo presenter action and send response
			boolean isSuccess = handleUndoPresenter(participantId, roomName, listenerRoomName);
			Result result = new Result(isSuccess);
			result.setDataId(participantId);

			sendResponse(session, WebSocketApplicationConstants.UNDO_PRESENTER_RESPONSE, result);
		}
		else if (cmd.equals(WebSocketApplicationConstants.CREATE_ROOM_COMMAND))
		{
			String roomName = (String)jsonObject.get(WebSocketApplicationConstants.ROOM_NAME_FIELD);
			String status = (String)jsonObject.get(WebSocketApplicationConstants.STATUS_FIELD);
			String streamId = (String)jsonObject.get(WebSocketApplicationConstants.STREAM_ID_FIELD);
			String token = (String)jsonObject.get(WebSocketConstants.TOKEN);

			handleCreateRoom(roomName, status);
			Result result = new Result(true);
			result.setDataId(roomName);

			sendResponse(session, WebSocketApplicationConstants.CREATE_ROOM_RESPONSE, result);
		}
		else if (cmd.equals(WebSocketApplicationConstants.DELETE_ROOM_COMMAND))
		{
			String roomName = (String)jsonObject.get(WebSocketApplicationConstants.ROOM_NAME_FIELD);
			String streamId = (String)jsonObject.get(WebSocketApplicationConstants.STREAM_ID_FIELD);
			String token = (String)jsonObject.get(WebSocketConstants.TOKEN);

			handleDeleteRoom(roomName);
			Result result = new Result(true);
			result.setDataId(roomName);

			sendResponse(session, WebSocketApplicationConstants.DELETE_ROOM_RESPONSE, result);
		}
		else if (cmd.equals(WebSocketApplicationConstants.REQUEST_PUBLISH_COMMAND)) {
			String roomName = (String)jsonObject.get(WebSocketApplicationConstants.ROOM_NAME_FIELD);
			String streamId = (String)jsonObject.get(WebSocketApplicationConstants.STREAM_ID_FIELD);
			String token = (String)jsonObject.get(WebSocketConstants.TOKEN);

			handleRequestPublish(roomName, streamId, token);

		}
		else if (cmd.equals(WebSocketApplicationConstants.GRANT_SPEAKER_REQUEST_COMMAND))
		{
			String mainRoomName = (String)jsonObject.get(WebSocketApplicationConstants.ROOM_NAME_FIELD);
			String listenerRoomName = (String)jsonObject.get(WebSocketApplicationConstants.LISTENER_ROOM_NAME_FIELD);
			String streamId = (String)jsonObject.get(WebSocketApplicationConstants.STREAM_ID_FIELD);
			String token = (String)jsonObject.get(WebSocketConstants.TOKEN);
			String participantId = (String)jsonObject.get(WebSocketApplicationConstants.PARTICIPANT_ID_FIELD);

			// Check for admin rights
			if (!hasAdminRights(token, streamId, mainRoomName)) {
				sendResponse(session, WebSocketApplicationConstants.GRANT_SPEAKER_REQUEST_RESPONSE,
						new Result(false, "You do not have admin rights in the room"));
				return;
			}

			RestServiceBase.removeFromPublisherRequestList(mainRoomName, participantId, getDataStore());
			RestServiceBase.addIntoPublisherFromListenerList(mainRoomName, participantId, getDataStore());

			JSONObject command = new JSONObject();
			command.put("eventType", "GRANT_BECOME_PUBLISHER");
			command.put("streamId", participantId);

			handleSendDataChannelMessage(listenerRoomName, command.toString());
			sendUpdatedMainRoomBroadcast(mainRoomName);
		}
		else if (cmd.equals(WebSocketApplicationConstants.REJECT_SPEAKER_REQUEST_COMMAND))
		{
			String mainRoomName = (String)jsonObject.get(WebSocketApplicationConstants.ROOM_NAME_FIELD);
			String listenerRoomName = (String)jsonObject.get(WebSocketApplicationConstants.LISTENER_ROOM_NAME_FIELD);
			String streamId = (String)jsonObject.get(WebSocketApplicationConstants.STREAM_ID_FIELD);
			String token = (String)jsonObject.get(WebSocketConstants.TOKEN);
			String participantId = (String)jsonObject.get(WebSocketApplicationConstants.PARTICIPANT_ID_FIELD);

			// Check for admin rights
			if (!hasAdminRights(token, streamId, mainRoomName)) {
				sendResponse(session, WebSocketApplicationConstants.REJECT_SPEAKER_REQUEST_RESPONSE,
						new Result(false, "You do not have admin rights in the room"));
				return;
			}

			RestServiceBase.removeFromPublisherRequestList(mainRoomName, participantId, getDataStore());

			JSONObject command = new JSONObject();
			command.put("eventType", "REJECT_SPEAKER_REQUEST");
			command.put("streamId", participantId);

			handleSendDataChannelMessage(listenerRoomName, command.toString());
			sendUpdatedMainRoomBroadcast(mainRoomName);
		}
		else if (cmd.equals(WebSocketApplicationConstants.MAKE_GRANTED_SPEAKER_LISTENER_COMMAND))
		{
			String mainRoomName = (String)jsonObject.get(WebSocketApplicationConstants.ROOM_NAME_FIELD);
			String streamId = (String)jsonObject.get(WebSocketApplicationConstants.STREAM_ID_FIELD);
			String token = (String)jsonObject.get(WebSocketConstants.TOKEN);
			String participantId = (String)jsonObject.get(WebSocketApplicationConstants.PARTICIPANT_ID_FIELD);

			// Check for admin rights
			if (!hasAdminRights(token, streamId, mainRoomName)) {
				sendResponse(session, WebSocketApplicationConstants.MAKE_GRANTED_SPEAKER_LISTENER_RESPONSE,
						new Result(false, "You do not have admin rights in the room"));
				return;
			}

			RestServiceBase.removeFromPublisherFromListenerList(mainRoomName, participantId, getDataStore());

			JSONObject command = new JSONObject();
			command.put("eventType", "MAKE_LISTENER_AGAIN");
			command.put("streamId", participantId);

			handleSendDataChannelMessage(mainRoomName, command.toString());
			sendUpdatedMainRoomBroadcast(mainRoomName);
		}
		else if (cmd.equals(WebSocketApplicationConstants.SEND_DATA_CHANNEL_COMMAND))
		{
			String receiverStreamId = (String)jsonObject.get(WebSocketApplicationConstants.RECEIVER_STREAM_ID_FIELD);
			String messageData = (String)jsonObject.get(WebSocketApplicationConstants.MESSAGE_FIELD);

			handleSendDataChannelMessage(receiverStreamId, messageData);
		}
		else if (cmd.equals(WebSocketApplicationConstants.SYNC_ADMINISTRATIVE_FIELDS_COMMAND))
		{
			String roomName = (String)jsonObject.get(WebSocketApplicationConstants.ROOM_NAME_FIELD);
			String streamId = (String)jsonObject.get(WebSocketApplicationConstants.STREAM_ID_FIELD);
			String token = (String)jsonObject.get(WebSocketConstants.TOKEN);

			// Check for admin rights
			if (!hasAdminRights(token, streamId, roomName)) {
				sendResponse(session, WebSocketApplicationConstants.MAKE_GRANTED_SPEAKER_LISTENER_RESPONSE,
						new Result(false, "You do not have admin rights in the room"));
				return;
			}

			Broadcast broadcast = getDataStore().get(roomName);
			if (broadcast == null) {
				logger.error("Room {} does not exist", roomName);
				return;
			}

			List<String> presenterList = broadcast.getPresenterList();
			List<String> publisherRequestList = broadcast.getPublisherRequestList();
			List<String> publisherFromListenerList = broadcast.getPublisherFromListenerList();

			JSONObject adminFields = new JSONObject();
			adminFields.put("presenterList", presenterList);
			adminFields.put("publisherRequestList", publisherRequestList);
			adminFields.put("publisherFromListenerList", publisherFromListenerList);

			sendResponse(session, WebSocketApplicationConstants.SYNC_ADMINISTRATIVE_FIELDS_RESPONSE, adminFields);
		}
	}

	// Modular method to send a JSON response
	private void sendResponse(Session session, String command, Result result) {
		JSONObject response = new JSONObject();
		response.put(WebSocketConstants.COMMAND, command);
		response.put(WebSocketConstants.DEFINITION, gson.toJson(result));
		sendMessage(session, response.toJSONString());
	}

	private void sendResponse(Session session, String command, JSONObject result) {
		JSONObject response = new JSONObject();
		response.put(WebSocketConstants.COMMAND, command);
		response.put(WebSocketConstants.DEFINITION, result);
		sendMessage(session, response.toJSONString());
	}

	private Object getMediaPushPlugin() {
		if (mediaPushPlugin == null) {
			mediaPushPlugin = context.getBean(MEDIA_PUSH_PLUGIN_BEAN_NAME);
		}
		return mediaPushPlugin;
	}

	private void responseRoomSettings(Session session) {

		JSONObject jsonResponse = new JSONObject();
		jsonResponse.put(WebSocketConstants.COMMAND, WebSocketApplicationConstants.SET_SETTINGS_COMMAND);
		jsonResponse.put(WebSocketApplicationConstants.SETTINGS, gsonOnlyExposedFields.toJson(conferenceRoomSettings));

		sendMessage(session, jsonResponse.toJSONString());
	}

	private void handlePasswordRequiredCommand(Session session) {
		sendRoomPasswordRequiredMessage(session, conferenceRoomSettings.isRoomCreationPasswordEnabled());
	}

	private void handleRoomCreationWithPassword(Session session, JSONObject jsonObject) 
	{
		String roomCreationPassword = getStringValue(jsonObject, WebSocketApplicationConstants.ROOM_CREATION_PASSWORD);
		String roomName = getStringValue(jsonObject, WebSocketApplicationConstants.ROOM_NAME);
		String joinToken;
		boolean passwordCorrect = roomCreationPassword != null && roomCreationPassword.equals(conferenceRoomSettings.getRoomCreationPassword());
		if (roomName != null && passwordCorrect) {
			createMainRoomBroadcast(roomName);
			joinToken = createJoinTokenForRoom(roomName);
			sendCreateRoomWithPassword(session, true, joinToken, roomName);
		}else if(roomName == null && passwordCorrect){
			roomName = RandomStringUtils.randomAlphanumeric(6);
			joinToken = createJoinTokenForRoom(roomName);
			sendCreateRoomWithPassword(session, true, joinToken, roomName);
		}
		else {
			sendCreateRoomWithPassword(session, false, null, null);
		}
	}

	private String getStringValue(JSONObject jsonObject, String key) {
		if (jsonObject.containsKey(key)) {
			String value = (String) jsonObject.get(key);
			return value.isEmpty() ? null : value;
		}
		return null;
	}


	public void createMainRoomBroadcast(String roomId){

		Broadcast mainBroadcast = new Broadcast();
		try {
			mainBroadcast.setStreamId(roomId);
		} catch (Exception e) {
			logger.error(ExceptionUtils.getStackTrace(e));
		}
		mainBroadcast.setZombi(true);
		mainBroadcast.setStatus(BROADCAST_STATUS_BROADCASTING);
		mainBroadcast.setOriginAdress(getServerSettings().getHostAddress());
		getDataStore().save(mainBroadcast);

	}

	//room creation with password generates a permanent publish jwt which should be passed to publish and play on conference client.
	private String createJoinTokenForRoom(String roomStreamId){
		ITokenService tokenService = getTokenService();
		Token token = tokenService.createJwtToken(roomStreamId, 9703597137L, Token.PUBLISH_TOKEN, null);
		if(token == null){
			return null;
		}
		return token.getTokenId();

	}

	private ITokenService getTokenService()
	{
		if(context != null && context.containsBean(ITokenService.BeanName.TOKEN_SERVICE.toString())) {
			return (ITokenService)context.getBean(ITokenService.BeanName.TOKEN_SERVICE.toString());
		}

		return null;
	}

	public ServerSettings getServerSettings(){
		return (ServerSettings) context.getBean(ServerSettings.BEAN_NAME);

	}
	public DataStore getDataStore(){
		DataStoreFactory dataStoreFactory = (DataStoreFactory) context.getBean(IDataStoreFactory.BEAN_NAME);

		return dataStoreFactory.getDataStore();
	}

	public void sendRoomPasswordRequiredMessage(Session session, boolean required){

		JSONObject jsonResponse = new JSONObject();
		jsonResponse.put(WebSocketConstants.COMMAND, "isRoomCreationPasswordRequired");
		jsonResponse.put("required", required);
		sendMessage(session, jsonResponse.toJSONString());

	}
	public void sendCreateRoomWithPassword(Session session, boolean authenticated, String joinToken, String roomName){

		JSONObject jsonResponse = new JSONObject();
		jsonResponse.put(WebSocketConstants.COMMAND, WebSocketApplicationConstants.CREATE_ROOM_WITH_PASSWORD_COMMAND);
		jsonResponse.put(WebSocketApplicationConstants.AUTHENTICATED, authenticated);
		if(joinToken != null){
			jsonResponse.put(WebSocketApplicationConstants.JOIN_TOKEN, joinToken);
		}
		if(roomName != null){
			jsonResponse.put(WebSocketApplicationConstants.ROOM_NAME, roomName);
		}

		sendMessage(session, jsonResponse.toJSONString());

	}

	public void sendMessage(Session session, String message) {
		try {
			session.getBasicRemote().sendText(message);
		} catch (IOException e) {
			logger.error(ExceptionUtils.getStackTrace(e));
		}
	}

	public boolean handleMakePresenter(String participantId, String mainRoom, String listenerRoom) {
		DataStore dataStore = getDataStore();
		Broadcast roomBroadcast =  dataStore.get(mainRoom);

		if(roomBroadcast == null) {
			logger.error("Room {} does not exist", mainRoom);
			return false;
		}

		if (roomBroadcast.getPresenterList().contains(participantId)) {
			logger.warn("Participant {} is already presenter in listener room {}", participantId, listenerRoom);
			return true;
		}

		boolean result = getAMSBroadcastManager().addSubTrack(listenerRoom, participantId);

		boolean isSuccess = result;

		DataStore datastore = getDataStore();

		// check if the operation is successful
		Broadcast subTrack = datastore.get(participantId);
		if (subTrack != null) {
			isSuccess = subTrack.getMainTrackStreamId().equals(mainRoom);
		} else {
			isSuccess = false;
		}

		if (isSuccess) {
			Broadcast mainTrack = datastore.get(mainRoom);
			if (mainTrack != null) {
				isSuccess = mainTrack.getSubTrackStreamIds().contains(participantId);
			} else {
				isSuccess = false;
			}
		}

		if (isSuccess) {
			logger.info("Participant {} is made presenter in listener room {}", participantId, listenerRoom);
			RestServiceBase.addIntoPresenterList(mainRoom, participantId, dataStore);
			sendUpdatedMainRoomBroadcast(mainRoom);
		} else {
			logger.error("Participant {} could not be made presenter in listener room {}", participantId, listenerRoom);
		}

		return isSuccess;
	}

	public boolean handleUndoPresenter(String participantId, String mainRoom, String listenerRoomName) {
		DataStore dataStore = getDataStore();
		Broadcast roomBroadcast =  dataStore.get(mainRoom);

		if(roomBroadcast == null) {
			logger.error("Room {} does not exist", mainRoom);
			return false;
		}

		if (!roomBroadcast.getPresenterList().contains(participantId)) {
			logger.warn("Participant {} is not a presenter in room {}", participantId, mainRoom);
			return true;
		}

		boolean result = getAMSBroadcastManager().removeSubTrack(listenerRoomName, participantId);

		if (result) {
			logger.info("Participant {} is removed from presenter in listener room {}", participantId, listenerRoomName);
			RestServiceBase.removeFromPresenterList(mainRoom, participantId, dataStore);
			getAMSBroadcastManager().updateMainTrackId(participantId, mainRoom, getDataStore());
			sendUpdatedMainRoomBroadcast(mainRoom);
		} else {
			logger.error("Participant {} could not be removed from presenter in listener room {}", participantId, listenerRoomName);
		}

		return result;
	}

	public void handleRequestPublish(String roomName, String streamId, String token) {
		String listenerRoomPostfix = "listener";
		String mainRoomName = roomName;

		if (mainRoomName.endsWith(listenerRoomPostfix)) {
			mainRoomName = mainRoomName.substring(0, mainRoomName.length() - listenerRoomPostfix.length());
		} else {
			logger.warn("You are not in a listener room. You cannot request to be publisher.");
			return;
		}

		DataStore dataStore = getDataStore();
		Broadcast mainRoomBroadcast = dataStore.get(mainRoomName);

		if (mainRoomBroadcast == null) {
			logger.warn("Main room broadcast is not found for {}", mainRoomName);
			return;
		}

		if (mainRoomBroadcast.getPublisherRequestList().contains(streamId)) {
			logger.warn("Publisher request is already sent for {}", streamId);
			return;
		}

		RestServiceBase.addIntoPublisherRequestList(mainRoomName, streamId, dataStore);
		sendUpdatedMainRoomBroadcast(mainRoomName);
		getAMSBroadcastManager().sendDataChannelMessage(mainRoomName, "{\"eventType\":\"PUBLISH_REQUEST\",\"streamId\":\"" + streamId + "\"}");
	}

	public void handleSendDataChannelMessage(String receiverStreamId, String messageData) {
		boolean result = getAMSBroadcastManager().sendDataChannelMessage(receiverStreamId, messageData);

		if (result) {
			logger.info("Data channel message is sent to {}", receiverStreamId);
		} else {
			logger.error("Data channel message could not be sent to {}", receiverStreamId);
		}
	}

	public void handleCreateRoom(String roomName, String status) {

		if (roomName != null && getDataStore().get(roomName) == null) {
			createMainRoomBroadcast(roomName);
		}
	}

	public void handleDeleteRoom(String id) {

		if (id != null && (getDataStore().get(id)) != null)
		{
			getDataStore().delete(id);
		}

	}

	public void sendUpdatedMainRoomBroadcast(String roomName) {
		Broadcast broadcast = getDataStore().get(roomName);
		if (broadcast != null) {
			JSONObject command = new JSONObject();
			command.put("eventStreamId", roomName);
			command.put("eventType", WebSocketApplicationConstants.MAIN_ROOM_BROADCAST_UPDATED_EVENT);

			getAMSBroadcastManager().sendDataChannelMessage(roomName, command.toString());
		}
	}

	public boolean hasAdminRights(String token, String streamId, String roomName) {
		// Validate room name
		if (roomName == null || roomName.isEmpty()) {
			logger.error("Room name is not valid: {}", roomName);
			return false;
		}

		// Retrieve broadcast and validate
		Broadcast broadcast = getDataStore().get(roomName);
		if (broadcast == null) {
			logger.error("Room {} does not exist so admin list is empty", roomName);
			return true;
		}

		// Check if admin list is defined and non-empty
		List<String> adminList = broadcast.getAdminList();
		if (adminList == null || adminList.isEmpty()) {
			// if admin list is not defined, then everyone has admin rights
			logger.error("Admin list is not defined or empty for the roomName {}", roomName);
			return true;
		}

		// Validate stream ID against admin list
		if (!adminList.contains(streamId)) {
			logger.error("StreamId {} does not have admin rights in the roomName {}", streamId, roomName);
			return false;
		}

		// if there is no secret key, then user has admin rights
		if (StringUtils.isAllBlank(appSettings.getJwtStreamSecretKey())) {
			logger.info("StreamId {} has admin rights in the roomName {}", streamId, roomName);
			return true;
		}

		// Validate token
		if (token == null) {
			logger.error("JWT security is enabled but token is not available.");
			return false;
		}

		// Check if token is valid
		if (JWTFilter.isJWTTokenValid(token, streamId)) {
			logger.info("Token is valid for streamId: {}", streamId);
			logger.info("StreamId {} has admin rights in the roomName {}", streamId, roomName);
			return true;
		} else {
			logger.error("Token is not valid for streamId: {}", streamId);
			logger.error("StreamId {} does not have admin rights in the roomName {}", streamId, roomName);
			return false;
		}
	}


}
