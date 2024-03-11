package io.antmedia.enterprise.streamapp;

import io.antmedia.datastore.db.DataStoreFactory;
import io.antmedia.datastore.db.IDataStoreFactory;
import io.antmedia.datastore.db.types.Token;
import io.antmedia.enterprise.streamapp.WebSocketApplicationHandler;
import io.antmedia.datastore.db.types.Broadcast;
import io.antmedia.datastore.db.DataStore;
import io.antmedia.AppSettings;
import io.antmedia.filter.JWTFilter;
import org.apache.commons.lang3.StringUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.ConfigurableWebApplicationContext;

import java.util.ArrayList;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class WebSocketApplicationHandlerTest {

    @Test
    public void testHasAdminRights() {
        WebSocketApplicationHandler handler;
        DataStore dataStore;
        DataStoreFactory dataStoreFactory;
        AppSettings appSettings;
        ConfigurableWebApplicationContext context;

        handler = spy(new WebSocketApplicationHandler());
        dataStore = mock(DataStore.class);
        dataStoreFactory = mock(DataStoreFactory.class);
        appSettings = mock(AppSettings.class);
        context = mock(ConfigurableWebApplicationContext.class);
        handler.setContext(context);

        when(context.getBean(AppSettings.BEAN_NAME)).thenReturn(appSettings);
        when(context.getBean(IDataStoreFactory.BEAN_NAME)).thenReturn(dataStoreFactory);
        when(dataStoreFactory.getDataStore()).thenReturn(dataStore);

        handler.setAppSettings();

        String streamId = "streamId";
        String roomName = "roomName";
        String secretKey = "secretKey";

        when(appSettings.getJwtStreamSecretKey()).thenReturn(secretKey);

        String token = WebSocketApplicationHandler.generateJwtTokenWithIssuer(secretKey, streamId, System.currentTimeMillis() + 60000, Token.PUBLISH_TOKEN, streamId);

        Broadcast broadcast = new Broadcast();
        broadcast.setAdminList(Arrays.asList(streamId));

        when(dataStore.get(roomName)).thenReturn(broadcast);
        when(appSettings.getJwtStreamSecretKey()).thenReturn(secretKey);

        assertTrue(handler.hasAdminRights(token, streamId, roomName));
    }

    @Test
    public void testHasAdminRightsWithNoAdminRights() {
        WebSocketApplicationHandler handler;
        DataStore dataStore;
        DataStoreFactory dataStoreFactory;
        AppSettings appSettings;
        ConfigurableWebApplicationContext context;

        handler = spy(new WebSocketApplicationHandler());
        dataStore = mock(DataStore.class);
        dataStoreFactory = mock(DataStoreFactory.class);
        appSettings = mock(AppSettings.class);
        context = mock(ConfigurableWebApplicationContext.class);
        handler.setContext(context);

        when(context.getBean(AppSettings.BEAN_NAME)).thenReturn(appSettings);
        when(context.getBean(IDataStoreFactory.BEAN_NAME)).thenReturn(dataStoreFactory);
        when(dataStoreFactory.getDataStore()).thenReturn(dataStore);

        handler.setAppSettings();

        String streamId = "streamId";
        String roomName = "roomName";
        String secretKey = "secretKey";

        String token = WebSocketApplicationHandler.generateJwtTokenWithIssuer(secretKey, roomName, System.currentTimeMillis()+60000, Token.PUBLISH_TOKEN, streamId );

        Broadcast broadcast = new Broadcast();
        broadcast.setAdminList(Arrays.asList("otherStreamId"));

        when(dataStore.get(roomName)).thenReturn(broadcast);
        when(appSettings.getJwtStreamSecretKey()).thenReturn(secretKey);

        assertFalse(handler.hasAdminRights(token, streamId, roomName));
    }

    @Test
    public void testHasAdminRightsWithNoSecretKey() {
        WebSocketApplicationHandler handler;
        DataStore dataStore;
        DataStoreFactory dataStoreFactory;
        AppSettings appSettings;
        ConfigurableWebApplicationContext context;

        handler = spy(new WebSocketApplicationHandler());
        dataStore = mock(DataStore.class);
        dataStoreFactory = mock(DataStoreFactory.class);
        appSettings = mock(AppSettings.class);
        context = mock(ConfigurableWebApplicationContext.class);
        handler.setContext(context);

        when(context.getBean(AppSettings.BEAN_NAME)).thenReturn(appSettings);
        when(context.getBean(IDataStoreFactory.BEAN_NAME)).thenReturn(dataStoreFactory);
        when(dataStoreFactory.getDataStore()).thenReturn(dataStore);

        handler.setAppSettings();

        String token = "token";
        String streamId = "streamId";
        String roomName = "roomName";

        Broadcast broadcast = new Broadcast();
        broadcast.setAdminList(Arrays.asList(streamId));

        when(dataStore.get(roomName)).thenReturn(broadcast);
        when(appSettings.getJwtStreamSecretKey()).thenReturn(StringUtils.EMPTY);

        assertTrue(handler.hasAdminRights(token, streamId, roomName));
    }

    @Test
    public void testHasAdminRightsWithNoToken() {
        WebSocketApplicationHandler handler;
        DataStore dataStore;
        DataStoreFactory dataStoreFactory;
        AppSettings appSettings;
        ConfigurableWebApplicationContext context;

        handler = spy(new WebSocketApplicationHandler());
        dataStore = mock(DataStore.class);
        dataStoreFactory = mock(DataStoreFactory.class);
        appSettings = mock(AppSettings.class);
        context = mock(ConfigurableWebApplicationContext.class);
        handler.setContext(context);

        when(context.getBean(AppSettings.BEAN_NAME)).thenReturn(appSettings);
        when(context.getBean(IDataStoreFactory.BEAN_NAME)).thenReturn(dataStoreFactory);
        when(dataStoreFactory.getDataStore()).thenReturn(dataStore);

        handler.setAppSettings();

        String streamId = "streamId";
        String roomName = "roomName";

        Broadcast broadcast = new Broadcast();
        broadcast.setAdminList(Arrays.asList(streamId));

        when(dataStore.get(roomName)).thenReturn(broadcast);
        when(appSettings.getJwtStreamSecretKey()).thenReturn("secretKey");

        assertFalse(handler.hasAdminRights(null, streamId, roomName));
    }

    @Test
    public void testHasAdminRightsWithNoAdmin() {
        WebSocketApplicationHandler handler;
        DataStore dataStore;
        DataStoreFactory dataStoreFactory;
        AppSettings appSettings;
        ConfigurableWebApplicationContext context;

        handler = spy(new WebSocketApplicationHandler());
        dataStore = mock(DataStore.class);
        dataStoreFactory = mock(DataStoreFactory.class);
        appSettings = mock(AppSettings.class);
        context = mock(ConfigurableWebApplicationContext.class);
        handler.setContext(context);

        when(context.getBean(AppSettings.BEAN_NAME)).thenReturn(appSettings);
        when(context.getBean(IDataStoreFactory.BEAN_NAME)).thenReturn(dataStoreFactory);
        when(dataStoreFactory.getDataStore()).thenReturn(dataStore);

        handler.setAppSettings();

        String streamId = "streamId";
        String roomName = "roomName";

        Broadcast broadcast = new Broadcast();
        broadcast.setAdminList(new ArrayList<>());

        when(dataStore.get(roomName)).thenReturn(broadcast);
        when(appSettings.getJwtStreamSecretKey()).thenReturn("secretKey");

        assertTrue(handler.hasAdminRights(null, streamId, roomName));
    }

    @Test
    public void testHandleMakePresenter() {
        WebSocketApplicationHandler handler = spy(new WebSocketApplicationHandler());
        DataStore dataStore = mock(DataStore.class);
        DataStoreFactory dataStoreFactory = mock(DataStoreFactory.class);
        AppSettings appSettings = mock(AppSettings.class);
        ConfigurableWebApplicationContext context = mock(ConfigurableWebApplicationContext.class);
        handler.setContext(context);
        AMSBroadcastManager amsBroadcastManager = mock(AMSBroadcastManager.class);
        Broadcast broadcast = mock(Broadcast.class);

        when(context.getBean(AppSettings.BEAN_NAME)).thenReturn(appSettings);
        when(context.getBean(IDataStoreFactory.BEAN_NAME)).thenReturn(dataStoreFactory);
        when(dataStoreFactory.getDataStore()).thenReturn(dataStore);
        handler.setAMSBroadcastManager(amsBroadcastManager);

        String participantId = "participantId";
        String mainRoom = "mainRoom";
        String listenerRoom = "listenerRoom";

        when(dataStore.get(mainRoom)).thenReturn(broadcast);
        when(broadcast.getPresenterList()).thenReturn(new ArrayList<>());
        when(amsBroadcastManager.addSubTrack(listenerRoom, participantId)).thenReturn(true);

        boolean result = handler.handleMakePresenter(participantId, mainRoom, listenerRoom);

        assertTrue(result);
        verify(broadcast).getPresenterList();
        verify(amsBroadcastManager).addSubTrack(listenerRoom, participantId);
    }

    @Test
    public void testHandleUndoPresenter() {
        WebSocketApplicationHandler handler = spy(new WebSocketApplicationHandler());
        DataStore dataStore = mock(DataStore.class);
        DataStoreFactory dataStoreFactory = mock(DataStoreFactory.class);
        AppSettings appSettings = mock(AppSettings.class);
        ConfigurableWebApplicationContext context = mock(ConfigurableWebApplicationContext.class);
        handler.setContext(context);
        AMSBroadcastManager amsBroadcastManager = mock(AMSBroadcastManager.class);
        Broadcast broadcast = mock(Broadcast.class);

        when(context.getBean(AppSettings.BEAN_NAME)).thenReturn(appSettings);
        when(context.getBean(IDataStoreFactory.BEAN_NAME)).thenReturn(dataStoreFactory);
        when(dataStoreFactory.getDataStore()).thenReturn(dataStore);
        handler.setAMSBroadcastManager(amsBroadcastManager);

        String participantId = "participantId";
        String mainRoom = "mainRoom";
        String listenerRoom = "listenerRoom";

        when(dataStore.get(mainRoom)).thenReturn(broadcast);
        when(broadcast.getPresenterList()).thenReturn(new ArrayList<>());
        when(amsBroadcastManager.removeSubTrack(listenerRoom, participantId)).thenReturn(true);

        boolean result = handler.handleUndoPresenter(participantId, mainRoom, listenerRoom);

        assertTrue(result);
        verify(broadcast).getPresenterList();
        verify(amsBroadcastManager).removeSubTrack(listenerRoom, participantId);
    }

    @Test
    public void testHandleRequestPublish() {
        WebSocketApplicationHandler handler = spy(new WebSocketApplicationHandler());
        DataStore dataStore = mock(DataStore.class);
        DataStoreFactory dataStoreFactory = mock(DataStoreFactory.class);
        AppSettings appSettings = mock(AppSettings.class);
        ConfigurableWebApplicationContext context = mock(ConfigurableWebApplicationContext.class);
        handler.setContext(context);
        AMSBroadcastManager amsBroadcastManager = mock(AMSBroadcastManager.class);
        Broadcast broadcast = mock(Broadcast.class);

        when(context.getBean(AppSettings.BEAN_NAME)).thenReturn(appSettings);
        when(context.getBean(IDataStoreFactory.BEAN_NAME)).thenReturn(dataStoreFactory);
        when(dataStoreFactory.getDataStore()).thenReturn(dataStore);
        handler.setAMSBroadcastManager(amsBroadcastManager);

        String roomName = "roomName";
        String streamId = "streamId";
        String token = "token";

        when(dataStore.get(roomName)).thenReturn(broadcast);
        when(broadcast.getPublisherRequestList()).thenReturn(new ArrayList<>());
        when(amsBroadcastManager.sendDataChannelMessage(roomName, "{\"eventType\":\"PUBLISH_REQUEST\",\"streamId\":\"" + streamId + "\"}")).thenReturn(true);

        handler.handleRequestPublish(roomName, streamId, token);

        verify(broadcast).getPublisherRequestList();
        verify(amsBroadcastManager).sendDataChannelMessage(roomName, "{\"eventType\":\"PUBLISH_REQUEST\",\"streamId\":\"" + streamId + "\"}");
    }


}
