package io.antmedia.enterprise.streamapp;

import java.util.ArrayList;
import java.util.List;

public class MainRoomConfiguration {
    List<String> publisherRequestList = new ArrayList<String>();
    List<String> publisherFromListenerList = new ArrayList<String>();
    List<String> presenterList = new ArrayList<String>();
    List<String> adminList = new ArrayList<String>();

    public MainRoomConfiguration() {
    }

    public MainRoomConfiguration(List<String> publisherRequestList, List<String> publisherFromListenerList, List<String> presenterList, List<String> adminList) {
        this.publisherRequestList = publisherRequestList;
        this.publisherFromListenerList = publisherFromListenerList;
        this.presenterList = presenterList;
        this.adminList = adminList;
    }

    public void addPublisherRequest(String publisherRequest) {
        publisherRequestList.add(publisherRequest);
    }

    public void removePublisherRequest(String publisherRequest) {
        publisherRequestList.remove(publisherRequest);
    }

    public List<String> getPublisherRequestList() {
        return publisherRequestList;
    }

    public void setPublisherRequestList(List<String> publisherRequestList) {
        this.publisherRequestList = publisherRequestList;
    }

    public List<String> getPublisherFromListenerList() {
        return publisherFromListenerList;
    }

    public void setPublisherFromListenerList(List<String> publisherFromListenerList) {
        this.publisherFromListenerList = publisherFromListenerList;
    }

    public List<String> getPresenterList() {
        return presenterList;
    }

    public void setPresenterList(List<String> presenterList) {
        this.presenterList = presenterList;
    }

    public List<String> getAdminList() {
        return adminList;
    }

    public void setAdminList(List<String> adminList) {
        this.adminList = adminList;
    }
}
