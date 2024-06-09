from browser import Browser
from selenium.webdriver.common.by import By
from rest_helper import RestHelper 


import sys
import unittest
import os
import random
import json
import time

class TestJoinLeave(unittest.TestCase):
  def setUp(self):
    print(self._testMethodName, " starting...")
    self.url = os.environ.get('SERVER_URL')
    self.test_app_name = os.environ.get('TEST_APP_NAME')
    self.user = os.environ.get('AMS_USER')
    self.password = os.environ.get('AMS_PASSWORD')
    self.chrome = Browser()
    self.chrome.init(True)


  def tearDown(self):
    print(self._testMethodName, " ending...")

  def join_room_in_new_tab(self, participant, room):
    print("url: "+self.url+"/"+self.test_app_name+"/"+room)
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    handle = self.chrome.open_in_new_tab(self.url+app+"/"+room)
    
    name_text_box = self.chrome.get_element(By.ID, "participant_name")

    self.chrome.write_to_element(name_text_box, participant)

    join_button = self.chrome.get_element(By.ID, "room_join_button")
    self.chrome.click_element(join_button)
 
    #self.chrome.print_console_logs()

    meeting_gallery = self.chrome.get_element(By.ID, "meeting-gallery")
    #self.chrome.print_ss_as_base64()

    assert(meeting_gallery.is_displayed())

    return handle
    
  def get_videoTrackAssignments(self):
    script = "return window.conference;"
    result_json = self.chrome.execute_script_with_retry(script)
    if result_json is None:
      return []
    
    self.chrome.print_console_logs()


    vtas = result_json["videoTrackAssignments"]
    #print("----------------------\n vtas("+str(len(vtas))+"):\n" + str(vtas))
    return vtas
  
  def get_conference(self):
    script = "return window.conference;"
    result_json = self.chrome.execute_script_with_retry(script)
    #print(result_json)
    if result_json is None:
      return {}
    #print(result_json)
    return result_json
  
  def get_video_track_limit(self):
    script = "return window.conference;"
    result_json = self.chrome.execute_script_with_retry(script)
    if result_json is None:
      return -1
    return result_json["globals"]["desiredMaxVideoTrackCount"]
  
  def change_video_track_count(self, count):
    index = 0
    if count == 2:
      index = 0
    elif count == 4:
      index = 1
    elif count == 6:
      index = 2
    elif count == 12:
      index = 3
    elif count == 30:
      index = 4

    settings_button = self.chrome.get_element(By.ID, "settings-button")
    self.chrome.click_element(settings_button)

    change_layout_button = self.chrome.get_element(By.ID, "change-layout-button")
    self.chrome.click_element(change_layout_button)

    tile_count_slider = self.chrome.get_element(By.ID, "tile-count-slider")
    points = self.chrome.get_element_in_element(tile_count_slider, By.CLASS_NAME, "MuiSlider-mark")
    self.chrome.mouse_click_on(points[index])

    layout_dialog_close_button = self.chrome.get_element(By.ID, "layout-dialog-close-button")
    self.chrome.click_element(layout_dialog_close_button)

  def get_start_recording_button(self):
    settings_button = self.chrome.get_element(By.ID, "settings-button")
    self.chrome.click_element(settings_button)

    start_recording_button = self.chrome.get_element(By.ID, "start-recording-button")
    return start_recording_button
  
  def get_stop_recording_button(self):
    settings_button = self.chrome.get_element(By.ID, "settings-button")
    self.chrome.click_element(settings_button)

    stop_recording_button = self.chrome.get_element(By.ID, "stop-recording-button")
    return stop_recording_button

  def _test_join_room(self):
    room = "room"+str(random.randint(100, 999))
    self.join_room_in_new_tab("participantA", room)   
    self.chrome.close_all()

  def set_and_test_track_limit(self, limit):
      self.change_video_track_count(limit)
      wait = self.chrome.get_wait()
      wait.until(lambda x: self.get_video_track_limit() == limit-1)
  
  def _test_video_track_count(self):
    self.chrome.makeFullScreen()
    room = "room"+str(random.randint(100, 999))
    self.join_room_in_new_tab("participantA", room)

    self.set_and_test_track_limit(2)
    time.sleep(2)
    self.set_and_test_track_limit(4)
    time.sleep(2)
    self.set_and_test_track_limit(6)
    time.sleep(2)
    self.set_and_test_track_limit(12)

    self.chrome.close_all()

  def assertLocalVideoAvailable(self):
    publishStreamId = self.get_publishStreamId()
    print("assertLocalVideoAvailable -> publishStreamId: "+publishStreamId)

    assert(self.chrome.get_element(By.ID, publishStreamId).is_displayed())


  def leave_room(self):
    leave_button = self.chrome.get_element(By.ID, "leave-room-button")
    self.chrome.click_element(leave_button)
    
  def _test_others_tile(self):
    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)
    handle_2 = self.join_room_in_new_tab("participantB", room)
    print("current: "+self.chrome.get_current_tab_id())
    assert(handle_2 == self.chrome.get_current_tab_id())
    self.assertLocalVideoAvailable()

    wait = self.chrome.get_wait()
    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)
    self.chrome.switch_to_tab(handle_1)
    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)
    
    ss_button = self.chrome.get_element(By.ID, "share-screen-button")
    self.chrome.click_element(ss_button)
    self.chrome.switch_to_tab(handle_2)
    assert(self.chrome.get_element(By.ID, "unpinned-gallery").is_displayed())

    assert(not self.chrome.is_element_exist(By.CLASS_NAME, 'others-tile-inner'))
    for i in range(3,7):
        handler = self.join_room_in_new_tab("participant" + str(i), room)
        self.assertLocalVideoAvailable()
        self.chrome.switch_to_tab(handler)

        expected_vta_count = min(i+1, 5) #+1 for screen share
        print("wait for vta count: "+str(expected_vta_count))
        wait.until(lambda x: len(self.get_videoTrackAssignments()) == expected_vta_count) 

        if i>=5:
          assert(self.chrome.is_element_exist(By.CLASS_NAME, 'others-tile-inner'))
        else:
          assert(not self.chrome.is_element_exist(By.CLASS_NAME, "others-tile-inner"))
    self.chrome.close_all()

  # it tooks too long to get videoTrackAssignments so we need to wait for it
  def get_publishStreamId(self, index=0):
    # to avoid infinite loop
    if index == 500:
      return ""
    
    conference = self.get_conference()

    videoTrackAssignments = conference.get("videoTrackAssignments")

    if videoTrackAssignments:
      return videoTrackAssignments[0]["streamId"] 
    else:
      return self.get_publishStreamId(index=index+1)

  def test_join_room_2_participants(self):
    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)
    handle_2 = self.join_room_in_new_tab("participantB", room)

    print("current: "+self.chrome.get_current_tab_id())

    assert(handle_2 == self.chrome.get_current_tab_id())

    self.assertLocalVideoAvailable()

    wait = self.chrome.get_wait()

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    self.chrome.switch_to_tab(handle_1)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    self.chrome.switch_to_tab(handle_2)

    
    time.sleep(5)

    self.leave_room()

    self.chrome.switch_to_tab(handle_1)


    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 1)

    self.chrome.close_all()

  def is_first_participant_pinned(self):
    conference = self.get_conference()
    videoTrackAssignments = conference["videoTrackAssignments"]
    return videoTrackAssignments[1]["streamId"] == conference["pinnedVideoId"]

  '''
  def _test_screen_share(self):
    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)
    handle_2 = self.join_room_in_new_tab("participantB", room)

    print("current: "+self.chrome.get_current_tab_id())

    assert(handle_2 == self.chrome.get_current_tab_id())

    self.assertLocalVideoAvailable()

    wait = self.chrome.get_wait()

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    self.chrome.switch_to_tab(handle_1)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)



    if(self.chrome.is_element_exist_by_id("share-screen-button")):
      ss_button = self.chrome.get_element(By.ID, "share-screen-button")
    else:
      more_button = self.chrome.get_element(By.ID, "more-button")
      self.chrome.click_element(more_button)
      ss_button = self.chrome.get_element(By.ID, "more-options-share-screen-button")

    self.chrome.click_element(ss_button)

    self.chrome.switch_to_tab(handle_2)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 3)
    
    if(self.chrome.is_element_exist_by_id("share-screen-button")):
      ss_button2 = self.chrome.get_element(By.ID, "share-screen-button")
    else:
      more_button = self.chrome.get_element(By.ID, "more-button")
      self.chrome.click_element(more_button)
      ss_button2 = self.chrome.get_element(By.ID, "more-options-share-screen-button")

    self.chrome.click_element(ss_button2)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 4)

    
    conference = self.get_conference()
    allParticipants = conference["allParticipants"]
    videoTrackAssignments = conference["videoTrackAssignments"]

    presenter2Exists = videoTrackAssignments[1]["streamId"] + "_presentation" in allParticipants

    streamIdOfPresenter = videoTrackAssignments[2]["streamId"]
    print("streamIdOfPresenter: "+str(streamIdOfPresenter))
    broadcastObjectOfPresenter = allParticipants[streamIdOfPresenter]
    print("broadcastObjectOfPresenter: "+str(broadcastObjectOfPresenter))
    presenterPinned = broadcastObjectOfPresenter.get('isPinned') == True

    presenter1Exists = videoTrackAssignments[2]["streamId"] in allParticipants

    print("presenter1Exists: "+str(presenter1Exists)+" presenter2Exists: "+str(presenter2Exists)+" presenterPinned: "+str(presenterPinned))

    assert(presenter1Exists and presenter2Exists and presenterPinned)

    self.chrome.close_all()
    '''

  def _test_join_room_N_participants(self):
    N = 5
    room = "room"+str(random.randint(100, 999))
    handles = [] 
    wait = self.chrome.get_wait()

    for i in range(N):
      handles.append(self.join_room_in_new_tab("participant"+str(i), room))

    assert(handles[N-1] == self.chrome.get_current_tab_id())

    time.sleep(5)
    self.assertLocalVideoAvailable()


    wait.until(lambda x: len(self.get_videoTrackAssignments()) == N)

    self.set_and_test_track_limit(4)
    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 4)

    self.set_and_test_track_limit(6)
    wait.until(lambda x: len(self.get_videoTrackAssignments()) == N)

    self.chrome.close_all()

  def is_avatar_displayed_for(self, stream_id):
    video_card = self.chrome.get_element(By.ID, "card-"+stream_id)
    return self.chrome.is_nested_element_exist(video_card, By.CLASS_NAME, "MuiAvatar-root")
  
  def is_video_displayed_for(self, stream_id):
    video_tag = self.chrome.get_element(By.ID, stream_id)
    return video_tag.is_displayed()
  
  def is_mic_off_displayed_for(self, stream_id):
    return self.chrome.is_element_exist(By.ID, "mic-muted-"+stream_id)
 
  def _test_on_off_mic_cam(self):
    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)
    handle_2 = self.join_room_in_new_tab("participantB", room)

    assert(handle_2 == self.chrome.get_current_tab_id())

    self.assertLocalVideoAvailable()

    wait = self.chrome.get_wait()

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    self.chrome.switch_to_tab(handle_1)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)


    #we are on participant 1 and turn off camera
    camera = self.chrome.get_element(By.ID, "camera-button")
    self.chrome.click_element(camera)

    self.chrome.switch_to_tab(handle_2)

    other_participant = self.get_videoTrackAssignments()[1]

    #since participant 1 turned off camera, we should see avatar
    other_participant_streamId = other_participant["streamId"]
    wait.until(lambda x: self.is_avatar_displayed_for(other_participant_streamId))

    print("cam off done")

    #switch to participant 1 and turn on camera
    self.chrome.switch_to_tab(handle_1)

    camera = self.chrome.get_element(By.ID, "camera-button")
    self.chrome.click_element(camera)

    self.chrome.switch_to_tab(handle_2)
    
    #since participant 1 turned on camera, we should see video
    wait.until(lambda x: self.is_video_displayed_for(other_participant_streamId))

    print("cam on done")

    #switch to participant 1 and turn off mic
    self.chrome.switch_to_tab(handle_1)

    mic = self.chrome.get_element(By.ID, "mic-button")
    self.chrome.click_element(mic)

    self.chrome.switch_to_tab(handle_2)
    
    #since participant 1 turned off mic, we should see mic off icon
    wait.until(lambda x: self.is_mic_off_displayed_for(other_participant_streamId))

    print("mic off done")

    #switch to participant 1 and turn on mic
    self.chrome.switch_to_tab(handle_1)

    mic = self.chrome.get_element(By.ID, "mic-button")
    self.chrome.click_element(mic)

    self.chrome.switch_to_tab(handle_2)
    
    #since participant 1 turned off mic, we shouldn't see mic off icon
    wait.until(lambda x: self.is_mic_off_displayed_for(other_participant_streamId) == False)

    print("mic on done")

    self.chrome.close_all()

  def get_snackbar_content(self):
    snackbar = self.chrome.get_element_with_retry(By.CLASS_NAME, "notistack-Snackbar")
    if snackbar is not None:
      return snackbar.get_attribute("innerHTML")
    return "not found"
   


  def _test_recording(self):
    self.rest_helper = RestHelper(self.url, self.user, self.password)
    self.rest_helper.login()

    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)
    handle_2 = self.join_room_in_new_tab("participantB", room)

    assert(handle_2 == self.chrome.get_current_tab_id())

    self.assertLocalVideoAvailable()

    wait = self.chrome.get_wait()

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    self.chrome.switch_to_tab(handle_1)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)


    recording_button = self.get_start_recording_button()
    assert(recording_button.is_displayed())


    self.chrome.click_element(recording_button)

    stop_button = self.get_stop_recording_button()
    assert(stop_button.is_displayed())

    wait.until(lambda x: "Recording is started successfully" in self.get_snackbar_content())

    self.chrome.switch_to_tab(handle_2)

    stop_button = self.get_stop_recording_button()
    assert(stop_button.is_displayed())

    time.sleep(5)

    stop_button.click()

    recording_button = self.get_start_recording_button()
    assert(recording_button.is_displayed())

    wait.until(lambda x: "Recording is stopped successfully" in self.get_snackbar_content())

    wait.until(lambda x: self.rest_helper.getVoDFor(room+"_composite") is not None)

    self.chrome.close_all()


if __name__ == '__main__':
    unittest.main()
