package io.antmedia.enterprise.streamapp;

import java.io.IOException;

import io.antmedia.AppSettings;
import io.antmedia.datastore.db.DataStore;
import io.antmedia.datastore.db.DataStoreFactory;
import io.antmedia.datastore.db.IDataStoreFactory;
import io.antmedia.datastore.db.types.Broadcast;
import io.antmedia.datastore.db.types.Token;
import io.antmedia.security.ITokenService;
import io.antmedia.settings.ServerSettings;
import org.apache.catalina.core.ApplicationContextFacade;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.apache.commons.lang3.reflect.FieldUtils;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.context.ConfigurableWebApplicationContext;
import org.springframework.web.context.support.WebApplicationContextUtils;

import io.antmedia.websocket.WebSocketConstants;

import jakarta.websocket.EndpointConfig;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnError;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;

import static io.antmedia.muxer.IAntMediaStreamHandler.BROADCAST_STATUS_BROADCASTING;


@ServerEndpoint(value="/websocket/application", configurator=AMSEndpointConfigurator.class)
public class WebSocketApplicationHandler {
    JSONParser jsonParser = new JSONParser();

    private String userAgent = "N/A";

    protected static Logger logger = LoggerFactory.getLogger(WebSocketLocalHandler.class);

    ConfigurableWebApplicationContext context;
    ConferenceRoomSettings conferenceRoomSettings;

    @OnOpen
    public void onOpen(Session session, EndpointConfig config) {
        if(config.getUserProperties().containsKey(AMSEndpointConfigurator.USER_AGENT)) {
            userAgent = (String) config.getUserProperties().get(AMSEndpointConfigurator.USER_AGENT);
        }

        logger.info("Web Socket opened session:{} user-agent:{}", session.getId(), userAgent);

        //increase max text buffer size - Chrome 90 requires
        session.setMaxTextMessageBufferSize(8192 * 10);
    }


    @OnClose
    public void onClose(Session session) {

    }

    @OnError
    public void onError(Session session, Throwable throwable) {

    }

    @OnMessage
    public void onMessage(Session session, String message) {
        if (context == null) {
            setApplicationContext(session);
            setConferenceRoomSettings();
        }

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
        if(context!= null){
            conferenceRoomSettings = (ConferenceRoomSettings) context.getBean("conferenceRoomSettings");
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
        try {
            session.getBasicRemote().sendText(jsonResponse.toJSONString());
        } catch (IOException e) {
            logger.error(ExceptionUtils.getStackTrace(e));
        }
    }


    public void processApplicationMessage(Session session, String message) throws ParseException {
        JSONObject jsonObject = (JSONObject) jsonParser.parse(message);
        String cmd = (String) jsonObject.get(WebSocketConstants.COMMAND);

        AppSettings appSettings = (AppSettings) context.getBean("app.settings");
        DataStore dataStore = getDataStore();

        if (cmd.equals(WebSocketApplicationConstants.IS_ROOM_CREATION_PASSWORD_REQUIRED_COMMAND)) {
            handlePasswordRequiredCommand(session, conferenceRoomSettings);
        } else if (cmd.equals(WebSocketApplicationConstants.CREATE_ROOM_WITH_PASSWORD_COMMAND)) {
            handleRoomCreationWithPassword(session, jsonObject, conferenceRoomSettings);
        }
    }

    private void handlePasswordRequiredCommand(Session session, ConferenceRoomSettings conferenceRoomSettings) {
        sendRoomPasswordRequiredMessage(session, conferenceRoomSettings.isRoomCreationPasswordEnabled());
    }

    private void handleRoomCreationWithPassword(Session session, JSONObject jsonObject, ConferenceRoomSettings conferenceRoomSettings) {
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


    public void createMainRoomBroadcast(String roomName){

        Broadcast mainBroadcast = new Broadcast();
        try {
            mainBroadcast.setStreamId(roomName);
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
        try {
            session.getBasicRemote().sendText(jsonResponse.toJSONString());
        } catch (IOException e) {
            logger.error(ExceptionUtils.getStackTrace(e));
        }



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
        try {
            session.getBasicRemote().sendText(jsonResponse.toJSONString());
        } catch (IOException e) {
            logger.error(ExceptionUtils.getStackTrace(e));
        }



    }


}
