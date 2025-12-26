package io.antmedia.enterprise.streamapp;


import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;

import com.google.gson.annotations.Expose;

import jakarta.annotation.PostConstruct;

@PropertySource("/WEB-INF/red5-web.properties")
public class ConferenceRoomSettings {

	protected static Logger logger = LoggerFactory.getLogger(ConferenceRoomSettings.class);

	
    @Value("${roomCreationPassword:#{null}}")
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
        roomCreationPasswordEnabled = StringUtils.isNotBlank(roomCreationPassword);
    	logger.info("roomCreationPasswordEnabled is {}", StringUtils.isNotBlank(roomCreationPassword));

    	try {
			Class.forName("io.antmedia.plugin.IMediaPushPlugin");
			logger.info("Conference recording feature is available");
			isRecordingFeatureAvailable = true;
		} catch (ClassNotFoundException e) {
			logger.info("Conference recording feature is not available. To have this feature install MediaPushPlugin");

			isRecordingFeatureAvailable = false;
		}

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
