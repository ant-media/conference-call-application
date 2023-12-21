package io.antmedia.enterprise.streamapp;

import java.io.IOException;

import io.antmedia.AppSettings;
import io.antmedia.datastore.db.DataStore;
import io.antmedia.datastore.db.DataStoreFactory;
import io.antmedia.datastore.db.IDataStoreFactory;
import io.antmedia.datastore.db.types.Broadcast;
import io.antmedia.settings.ServerSettings;
import org.apache.catalina.core.ApplicationContextFacade;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.apache.commons.lang3.reflect.FieldUtils;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.ConfigurableWebApplicationContext;
import org.springframework.web.context.support.WebApplicationContextUtils;

import io.antmedia.websocket.WebSocketCommunityHandler;
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

    ConfigurableWebApplicationContext ctxt = null;

    public WebSocketApplicationHandler(){


    }

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
        if(ctxt == null) {
            try {
                ApplicationContextFacade servletContext = (ApplicationContextFacade) FieldUtils.readField(session.getContainer(), "servletContext", true);
                ctxt = (ConfigurableWebApplicationContext) WebApplicationContextUtils.getWebApplicationContext(servletContext);
            } catch (Exception e) {
                logger.error("Application context can not be set to WebSocket handler");
                logger.error(ExceptionUtils.getMessage(e));
            }

            if(ctxt != null && ctxt.isRunning()) {
                try{
                    checkRoomCreation(session, message);

                }catch (Exception e){
                    return;

                }
            }
            else {
                sendNotInitializedError(session);
            }
        }
        else {
            try{

               checkRoomCreation(session, message);

            }catch (Exception e){

            }

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


    public void checkRoomCreation(Session session, String message) throws ParseException {

        JSONObject jsonObject = (JSONObject) jsonParser.parse(message);

        String cmd = (String) jsonObject.get(WebSocketConstants.COMMAND);

        AppSettings appSettings = (AppSettings) ctxt.getBean("app.settings");
        DataStore dataStore = getDataStore();

        ConferenceRoomSettings conferenceRoomSettings = (ConferenceRoomSettings) ctxt.getBean("conferenceRoomSettings");


        if(cmd.equals("isRoomCreationPasswordRequired")){
            sendRoomPasswordRequiredMessage(session, conferenceRoomSettings.isCreateRoomWithPassword());



        }else if(cmd.equals("createRoomWithPassword")){
            String roomCreationPassword = null;
            String roomName = null;
            boolean roomCreationAllowed = false;
            if(jsonObject.containsKey("roomCreationPassword") &&  !((String) jsonObject.get("roomCreationPassword")).isEmpty()) {
                roomCreationPassword = (String) jsonObject.get("roomCreationPassword");
            }
            if(jsonObject.containsKey("roomName") &&  !((String) jsonObject.get("roomName")).isEmpty()) {
                roomName = (String) jsonObject.get("roomName");
            }

            if(roomName != null && roomCreationPassword != null && roomCreationPassword.equals(conferenceRoomSettings.getPasswordForCreatingRoom())){

                roomCreationAllowed = true;

            }
            if(roomCreationAllowed){ // create  the room.

                createMainRoomBroadcast(roomName);


            }


            sendCreateRoomWithPassword(session, roomCreationAllowed);

        }


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

    public ServerSettings getServerSettings(){
        return (ServerSettings)ctxt.getBean(ServerSettings.BEAN_NAME);

    }
    public DataStore getDataStore(){
        DataStoreFactory dataStoreFactory = (DataStoreFactory) ctxt.getBean(IDataStoreFactory.BEAN_NAME);

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
    public void sendCreateRoomWithPassword(Session session, boolean authenticated){

        JSONObject jsonResponse = new JSONObject();
        jsonResponse.put(WebSocketConstants.COMMAND, "createRoomWithPassword");
        jsonResponse.put("authenticated", authenticated);
        try {
            session.getBasicRemote().sendText(jsonResponse.toJSONString());
        } catch (IOException e) {
            logger.error(ExceptionUtils.getStackTrace(e));
        }



    }


}
