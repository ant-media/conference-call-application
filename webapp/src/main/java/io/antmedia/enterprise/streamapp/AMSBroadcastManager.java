package io.antmedia.enterprise.streamapp;

import io.antmedia.AntMediaApplicationAdapter;
import io.antmedia.datastore.db.DataStore;
import io.antmedia.datastore.db.DataStoreFactory;
import io.antmedia.datastore.db.IDataStoreFactory;
import io.antmedia.datastore.db.types.Broadcast;
import io.antmedia.rest.RestServiceBase;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

import static io.antmedia.rest.RestServiceBase.addStreamToConferenceRoom;
import static io.antmedia.rest.RestServiceBase.removeStreamFromRoom;

@Component(value="amsBroadcastManager")
public class AMSBroadcastManager implements ApplicationContextAware {

    private ApplicationContext applicationContext;
    private AntMediaApplicationAdapter appAdaptor;

    @Override
    public void setApplicationContext(@NotNull ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }

    public ApplicationContext getApplicationContext() {
        return applicationContext;
    }

    public AntMediaApplicationAdapter getApplication() {
        if (appAdaptor == null) {
            appAdaptor = (AntMediaApplicationAdapter) applicationContext.getBean(AntMediaApplicationAdapter.BEAN_NAME);
        }
        return appAdaptor;
    }

    public DataStore getDataStore(){
        DataStoreFactory dataStoreFactory = (DataStoreFactory) applicationContext.getBean(IDataStoreFactory.BEAN_NAME);

        return dataStoreFactory.getDataStore();
    }

    public boolean isMainTrack(String streamId) {
        boolean result = false;
        if (streamId != null)
        {
            Broadcast broadcast = getDataStore().get(streamId);
            if (broadcast != null)
            {
                result = !broadcast.getSubTrackStreamIds().isEmpty();
            }
        }
        return result;
    }

    public boolean sendDataChannelMessage(String id, String message) {
        AntMediaApplicationAdapter application = getApplication();

        if(application != null && application.isDataChannelMessagingSupported()) {
            if(application.isDataChannelEnabled()) {
                if(application.doesWebRTCStreamExist(id) || isMainTrack(id)) {
                    return application.sendDataChannelMessage(id,message);
                }
            }
        }
        return false;
    }

    public boolean addSubTrack(String mainTrackId, String subTrackId) {
        Broadcast subTrack = getDataStore().get(subTrackId);

        if (subTrack == null) {
            return false;
        }

        subTrack.setMainTrackStreamId(mainTrackId);

        boolean isBroadcastUpdated = getDataStore().updateBroadcastFields(subTrackId, subTrack);

        if (!isBroadcastUpdated) {
            return false;
        }

        boolean isMainBroadcastUpdated = getDataStore().addSubTrack(mainTrackId, subTrackId);

        if (!isMainBroadcastUpdated) {
            return false;
        }

        return addStreamToConferenceRoom(mainTrackId, subTrackId, getDataStore());
    }

    public boolean removeSubTrack(String mainTrackId, String subTrackId) {
        Broadcast subTrack = getDataStore().get(subTrackId);

        if (subTrack == null) {
            return false;
        }

        if(mainTrackId != null && mainTrackId.equals(subTrack.getMainTrackStreamId())) {
            subTrack.setMainTrackStreamId("");
        }

        boolean isBroadcastUpdate = getDataStore().updateBroadcastFields(subTrackId, subTrack);

        if (!isBroadcastUpdate) {
            return false;
        }

        boolean isMainBroadcastUpdated = getDataStore().removeSubTrack(mainTrackId, subTrackId);

        if (!isMainBroadcastUpdated) {
            return false;
        }

        return deleteStreamFromTheRoom(mainTrackId, subTrackId);
    }

    public boolean deleteStreamFromTheRoom(String mainTrackId, String subTrackId) {
        AntMediaApplicationAdapter application = getApplication();

        if(application == null) {
            return false;
        }

        boolean isStreamRemovedFromRoom = RestServiceBase.removeStreamFromRoom(mainTrackId,subTrackId,getDataStore());

        if(isStreamRemovedFromRoom) {
            application.leftTheRoom(mainTrackId, subTrackId);
            return true;
        }

        return false;
    }
}
