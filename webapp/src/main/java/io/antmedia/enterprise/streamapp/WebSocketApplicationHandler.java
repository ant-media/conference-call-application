package io.antmedia.enterprise.streamapp;

import static io.antmedia.muxer.IAntMediaStreamHandler.BROADCAST_STATUS_BROADCASTING;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Date;

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

		if (cmd.equals(WebSocketApplicationConstants.PING_COMMAND))
		{
			Result result = new Result(true);
			sendResponse(session, WebSocketApplicationConstants.PONG_RESPONSE, result);
		}
		else if (cmd.equals(WebSocketApplicationConstants.IS_ROOM_CREATION_PASSWORD_REQUIRED_COMMAND))
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
				int port = websocketURLObject.getPort();
				if (port == -1) {
					port = websocketURLObject.getScheme().contains("wss") ? 443 : 80;
				}
				url += websocketURLObject.getHost() + ":" + port;
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
				JSONObject jsonObjectResponse = new JSONObject();
				jsonObjectResponse.put(WebSocketConstants.COMMAND, WebSocketApplicationConstants.START_RECORDING_RESPONSE);
				jsonObjectResponse.put(WebSocketConstants.DEFINITION, gson.toJson(result));

				sendMessage(session, jsonObjectResponse.toJSONString());
			}
		}
		else if (cmd.equals(WebSocketApplicationConstants.STOP_RECORDING_COMMAND))
		{
			String streamId = (String)jsonObject.get(WebSocketConstants.STREAM_ID);

			logger.info("stop recording for {}", streamId);

			String streamIdRecording = streamId + SUFFIX;
			Result result = stopRecording(streamIdRecording);

			JSONObject jsonObjectResponse = new JSONObject();
			jsonObjectResponse.put(WebSocketConstants.COMMAND, WebSocketApplicationConstants.STOP_RECORDING_RESPONSE);
			jsonObjectResponse.put(WebSocketConstants.DEFINITION,  gson.toJson(result));


			sendMessage(session, jsonObjectResponse.toJSONString());
		}
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

}
