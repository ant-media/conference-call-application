package io.antmedia.enterprise.streamapp;


import com.google.gson.annotations.Expose;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.annotation.PostConstruct;


public class ConferenceRoomSettings {

	protected static Logger logger = LoggerFactory.getLogger(ConferenceRoomSettings.class);

    private String roomCreationPassword;

	@Expose
    private boolean roomCreationPasswordEnabled = false;

	@Expose
    private boolean isRecordingFeatureAvailable = false;

	@Expose
	private String participantVisibilityMatrix;

	@Expose
	private int maxVideoTrackCount = 6;
    
    @PostConstruct
    public void init() {

    	try {
			Class.forName("io.antmedia.plugin.IMediaPushPlugin");
			logger.info("Conference recording feature is available");
			isRecordingFeatureAvailable = true;
		} catch (ClassNotFoundException e) {
			logger.info("Conference recording feature is not available. To have this feature install MediaPushPlugin");

			isRecordingFeatureAvailable = false;
		}
		roomCreationPasswordEnabled = StringUtils.isNotBlank(roomCreationPassword);

    }


    public String getRoomCreationPassword() {
        return roomCreationPassword;
    }

    public void setRoomCreationPassword(String roomCreationPassword) {
    	
        this.roomCreationPassword = roomCreationPassword;
        this.roomCreationPasswordEnabled = StringUtils.isNotBlank(roomCreationPassword);
    }


	public boolean isRecordingFeatureAvailable() {
		return isRecordingFeatureAvailable;
	}

	public void setRecordingFeatureAvailable(boolean isRecordingFeatureAvailable) {
		this.isRecordingFeatureAvailable = isRecordingFeatureAvailable;
	}


	public boolean isRoomCreationPasswordEnabled() {
		return roomCreationPasswordEnabled;
	}

	public void setParticipantVisibilityMatrix(String participantVisibilityMatrix) {
		this.participantVisibilityMatrix = participantVisibilityMatrix;
	}

	public String getParticipantVisibilityMatrix() {
		return participantVisibilityMatrix;
	}

	public int getMaxVideoTrackCount() {
		return maxVideoTrackCount;
	}

	public void setMaxVideoTrackCount(int maxVideoTrackCount) {
		this.maxVideoTrackCount = maxVideoTrackCount;
	}

}
