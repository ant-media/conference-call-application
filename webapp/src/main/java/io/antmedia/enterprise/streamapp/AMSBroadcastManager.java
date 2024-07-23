package io.antmedia.enterprise.streamapp;

import io.antmedia.AntMediaApplicationAdapter;
import io.antmedia.datastore.db.DataStore;
import io.antmedia.datastore.db.DataStoreFactory;
import io.antmedia.datastore.db.IDataStoreFactory;
import io.antmedia.datastore.db.types.Broadcast;
import io.antmedia.rest.model.Result;
import io.antmedia.rest.RestServiceBase;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

public class AMSBroadcastManager implements ApplicationContextAware {

    protected static Logger logger = LoggerFactory.getLogger(AMSBroadcastManager.class);

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

    public boolean sendDataChannelMessage(String id, String message) {
        AntMediaApplicationAdapter application = getApplication();

        if(application == null) {
            return false;
        }

        Result result = RestServiceBase.sendDataChannelMessage(id, message, application, getDataStore());

        return result.isSuccess();
    }

    public boolean updateBroadcastRole(String streamId, String role) {
        AntMediaApplicationAdapter application = getApplication();
        boolean result = false;

        if(application == null) {
            return false;
        }

        Broadcast broadcast = getDataStore().get(streamId);
        if (broadcast != null) {
            broadcast.setRole(role);
            result = getDataStore().updateBroadcastFields(streamId, broadcast);
        }

        return result;
    }
}
