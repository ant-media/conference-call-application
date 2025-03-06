from browser import Browser
from selenium.webdriver.common.by import By
from selenium.common import exceptions  
from rest_helper import RestHelper 

import sys
import unittest
import os
import random
import json
import time
import subprocess
import threading
import psutil

class TestWebinarScenario(unittest.TestCase):
  def setUp(self):
    self.is_local = False
    #self.is_local = True
    print(self._testMethodName, " starting...")
    self.url = os.environ.get('SERVER_URL')
    self.test_app_name = os.environ.get('TEST_APP_NAME')
    self.user = os.environ.get('AMS_USER')
    self.password = os.environ.get('AMS_PASSWORD')
    self.chrome = Browser()
    current_dir = os.path.dirname(os.path.abspath(__file__))
    fake_audio_file_path = os.path.join(current_dir, "fake_mic.wav")
    self.chrome.init(not self.is_local, mic_file=fake_audio_file_path)
    self.rest_helper = RestHelper(self.url, self.user, self.password, self.test_app_name)
    self.rest_helper.login()
    self.rest_helper.create_broadcast_for_play_only_speed_test()
    self.rest_helper.start_broadcast("speedTestSampleStream")
    #self.startLoadTest()

    # Start logging CPU and RAM usage in a separate thread
    self.keep_running = True
    self.monitor_thread = threading.Thread(target=self.log_resource_usage)
    self.monitor_thread.start()

  def log_resource_usage(self):
    """Log CPU and RAM usage periodically."""
    while self.keep_running:
      cpu_usage = psutil.cpu_percent(interval=1)  # Measure CPU usage over 1 second
      ram_usage = psutil.virtual_memory().percent  # Get RAM usage percentage
      test_name = self._testMethodName  # Get the current test name
      print(f"[{test_name}] CPU Usage: {cpu_usage}% | RAM Usage: {ram_usage}%")
      time.sleep(5)  # Log every 5 seconds (adjust as needed)

  def tearDown(self):
    """Ensure the monitoring thread stops after tests."""
    self.keep_running = False
    self.monitor_thread.join()
    print(self._testMethodName, " ending...\n","----------------")

  def startLoadTest(self):
    def start_load_test():
      subprocess.run(["./webrtc-load-test/run.sh", "-f", "test.mp4", "-m", "publisher", "-n", "12", "-s", self.url, "-q", "true", "-p", "5443", "-a", self.test_app_name])

    # Create a new thread for running the load test
    load_test_thread = threading.Thread(target=start_load_test)
    load_test_thread.start()

  def join_room_as_admin(self, participant, room, skip_speed_test=False):
    print("url: "+self.url+"/"+self.test_app_name+"/"+room)
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    handle = self.chrome.open_in_new_tab(self.url+app+"/"+room+"?role=host&streamName=" + participant + ("&skipSpeedTest=true" if skip_speed_test else ""))
    
    #name_text_box = self.chrome.get_element_with_retry(By.ID,"participant_name")
    #self.chrome.write_to_element(name_text_box, participant)

    join_button = self.chrome.get_element_with_retry(By.ID,"room_join_button")
    self.chrome.click_element(join_button)


    if not skip_speed_test:
      time.sleep(5)
      speedTestCircularProgress = self.chrome.get_element_with_retry(By.ID,"speed-test-modal-circle-progress-bar", retries=20)
      assert(speedTestCircularProgress.is_displayed())

      time.sleep(5)

      timeoutCounter = 0

      isSpeedTestFinished = False
      isSpeedTestFailed = False

      while not isSpeedTestFailed and not isSpeedTestFinished and timeoutCounter < 100:
        time.sleep(1)
        timeoutCounter += 1
        script = "return window.conference.speedTestObject;"
        result_json = self.chrome.execute_script(script)
        if result_json is not None:
          isSpeedTestFinished = result_json["isfinished"]
          isSpeedTestFailed = result_json["isfailed"]

      speedTestModalJoinButton = self.chrome.get_element_with_retry(By.ID,"speed-test-modal-join-button")

      self.chrome.print_ss_as_base64()

      self.chrome.click_element(speedTestModalJoinButton)
    
    meeting_gallery = self.chrome.get_element_with_retry(By.ID,"meeting-gallery")

    assert(meeting_gallery.is_displayed())

    return handle
  
  def join_room_as_presenter(self, participant, room, skip_speed_test=False):
    print("url: "+self.url+"/"+self.test_app_name+"/"+room)
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    handle = self.chrome.open_in_new_tab(self.url+app+"/"+room+"?role=speaker&streamName=" + participant + ("&skipSpeedTest=true" if skip_speed_test else ""))
    
    #name_text_box = self.chrome.get_element_with_retry(By.ID,"participant_name")
    #self.chrome.write_to_element(name_text_box, participant)

    join_button = self.chrome.get_element_with_retry(By.ID,"room_join_button")

    self.chrome.click_element(join_button)

    if not skip_speed_test:
      time.sleep(5)

      speedTestCircularProgress = self.chrome.get_element_with_retry(By.ID,"speed-test-modal-circle-progress-bar", retries=20)
      assert(speedTestCircularProgress.is_displayed())

      time.sleep(5)

      timeoutCounter = 0

      isSpeedTestFinished = False
      isSpeedTestFailed = False

      while not isSpeedTestFailed and not isSpeedTestFinished and timeoutCounter < 100:
        time.sleep(1)
        timeoutCounter += 1
        script = "return window.conference.speedTestObject;"
        result_json = self.chrome.execute_script(script)
        if result_json is not None:
          isSpeedTestFinished = result_json["isfinished"]
          isSpeedTestFailed = result_json["isfailed"]

      speedTestModalJoinButton = self.chrome.get_element_with_retry(By.ID,"speed-test-modal-join-button")

      self.chrome.click_element(speedTestModalJoinButton)

 
    meeting_gallery = self.chrome.get_element_with_retry(By.ID,"meeting-gallery")

    assert(meeting_gallery.is_displayed())

    return handle
  
  def join_room_as_player(self, participant, room, skip_speed_test=True):
    print("url: "+self.url+"/"+self.test_app_name+"/"+room)
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    handle = self.chrome.open_in_new_tab(self.url+app+"/"+room+"?playOnly=true&role=listener&streamName=" + participant + "&streamId=" + participant + ("&skipSpeedTest=true" if skip_speed_test else ""))
    
    wait = self.chrome.get_wait()

    #name_text_box = self.chrome.get_element_with_retry(By.ID,"participant_name")
    #self.chrome.write_to_element(name_text_box, participant)

    join_button = self.chrome.get_element_with_retry(By.ID,"room_join_button")

    self.chrome.click_element(join_button)

    if not skip_speed_test:
      time.sleep(5)

      self.chrome.save_ss_as_file("join_room_as_player-1.png")

      speedTestCircularProgress = self.chrome.get_element_with_retry(By.ID,"speed-test-modal-circle-progress-bar", retries=20)
      wait.until(lambda x: speedTestCircularProgress.is_displayed())

      time.sleep(5)

      timeoutCounter = 0

      isSpeedTestFinished = False
      isSpeedTestFailed = False

      while not isSpeedTestFailed and not isSpeedTestFinished and timeoutCounter < 100:
        time.sleep(1)
        timeoutCounter += 1
        script = "return window.conference.speedTestObject;"
        result_json = self.chrome.execute_script(script)
        if result_json is not None:
          isSpeedTestFinished = result_json["isfinished"]
          isSpeedTestFailed = result_json["isfailed"]
          print("player speed test test isFinished:" + str(isSpeedTestFinished) + " isFailed:"+ str(isSpeedTestFailed))

      speedTestModalJoinButton = self.chrome.get_element_with_retry(By.ID,"speed-test-modal-join-button")

      self.chrome.save_ss_as_file("join_room_as_player-1.png")

      self.chrome.mouse_click_on(speedTestModalJoinButton)
 
    meeting_gallery = self.chrome.get_element_with_retry(By.ID,"meeting-gallery")

    assert(meeting_gallery.is_displayed())

    return handle
  
  def accept_raising_hand_request(self, participant):
    accept_button = self.chrome.get_element_with_retry(By.ID,"approve-become-speaker-"+participant)
    self.chrome.click_element(accept_button)

  def reject_raising_hand_request(self, participant):
    reject_button = self.chrome.get_element_with_retry(By.ID,"reject-become-speaker-"+participant)
    self.chrome.click_element(reject_button)
  
  def add_presenter_to_listener_room(self, presenter):
    add_button = self.chrome.get_element(By.ID,"add-presenter-"+presenter)
    self.chrome.click_element(add_button)

  def remove_presenter_from_listener_room(self, presenter):
    remove_speaker_button = self.chrome.get_element_with_retry(By.ID,"remove-presenter-"+presenter)
    self.chrome.click_element(remove_speaker_button)

  def remove_temporary_speaker_from_presenter_room(self, presenter):
    remove_speaker_button = self.chrome.get_element_with_retry(By.ID,"remove-speaker-"+presenter)
    self.chrome.click_element(remove_speaker_button)

  def open_close_participant_list_drawer(self):
    participant_list_button = None
    try:
      participant_list_button = self.chrome.get_element_with_retry(By.ID,"participant-list-button")
    except exceptions.NoSuchElementException:
      more_button = self.chrome.get_element_with_retry(By.ID, "more-button")
      self.chrome.click_element(more_button)
      participant_list_button = self.chrome.get_element_with_retry(By.ID,"more-options-participant-list-button")
    self.chrome.click_element(participant_list_button)

  def open_close_publisher_request_list_drawer(self):
    open_participant_list_button = None

    try:
      open_participant_list_button = self.chrome.get_element_with_retry(By.ID,"publisher-request-list-button")
    except exceptions.NoSuchElementException:
      more_button = self.chrome.get_element_with_retry(By.ID, "more-button")
      self.chrome.click_element(more_button)
      open_participant_list_button = self.chrome.get_element_with_retry(By.ID,"more-options-publisher-request-list-button")

    self.chrome.click_element(open_participant_list_button)

  def get_participants(self):
    script = "return window.conference;"
    result_json = self.chrome.execute_script_with_retry(script)
    if result_json is None:
      return []
    #print("result_json:" + str(result_json))
    print ("all participant count:" + str(len(result_json["allParticipants"])))
    print("allParticipants: "+str(result_json["allParticipants"]))
    return result_json["allParticipants"]
  
  def get_video_track_assignments(self):
    script = "return window.conference;"
    result_json = self.chrome.execute_script_with_retry(script)
    if result_json is None:
      return []
    #print("result_json:" + str(result_json))
    print ("videoTrackAssignments count:" + str(len(result_json["videoTrackAssignments"])))
    print("videoTrackAssignments: "+str(result_json["videoTrackAssignments"]))
    return result_json["videoTrackAssignments"]
  
  def get_request_publisher_list(self):
    script = "return window.conference;"
    result_json = self.chrome.execute_script_with_retry(script)
    if result_json is None:
      return []
    #print("result_json:" + str(result_json))
    print ("request publisher list count:" + str(len(result_json["requestSpeakerList"])))
    return result_json["requestSpeakerList"]
  
  def get_approved_speaker_request_list(self):
    script = "return window.conference;"
    result_json = self.chrome.execute_script_with_retry(script)
    if result_json is None:
      return []
    #print("result_json:" + str(result_json))
    print ("approved speaker request list count:" + str(len(result_json["approvedSpeakerRequestList"])))
    return result_json["approvedSpeakerRequestList"]
  
  def get_track_stats(self):
    script = "return window.conference.getTrackStats();"
    result_json = self.chrome.execute_script_with_retry(script)
    if result_json is None:
      return []

    return result_json
  
  def get_video_container_by_stream_name(self, stream_name):
    # Get all video card elements
    video_cards = self.chrome.get_all_elements(By.CSS_SELECTOR, "div.single-video-container")

    # Loop through each video card
    for video_card in video_cards:
        # Get the innerHTML of the video card
        inner_html = video_card.get_attribute("innerHTML")
        
        # Check if the stream_name is present in the innerHTML
        if stream_name in inner_html:
            return video_card
    
    # If no matching video card is found, return None
    return None
  
  def get_conference(self):
    script = "return window.conference;"
    result_json = self.chrome.execute_script_with_retry(script)
    print("conference: "+str(result_json))
    if result_json is None:
      return []
    return result_json
  
  # it tooks too long to get videoTrackAssignments so we need to wait for it
  def get_publishStreamId(self, index=0):
    # to avoid infinite loop
    if index == 500:
      return ""
    
    print("get_publishStreamId index: "+str(index))
    conference = self.get_conference()
    print("conference: "+str(conference))

    videoTrackAssignments = conference.get("videoTrackAssignments")

    if videoTrackAssignments:
      return videoTrackAssignments[0]["streamId"] 
    else:
      return self.get_publishStreamId(index=index+1)
  
  def get_id_of_participant(self, name):
    participants = self.get_participants()
    for participant in participants:
      if participants[participant]["name"] == name:
        return participants[participant]["streamId"]
    return None
  
  def leave_room(self):
    leave_button = self.chrome.get_element_with_retry(By.ID,"leave-room-button")
    self.chrome.click_element(leave_button)
  
  def open_close_chat_drawer(self):
    if(self.chrome.is_element_exist(By.ID, "messages-button")):
      messages_button = self.chrome.get_element(By.ID, "messages-button")
    else:
      more_button = self.chrome.get_element(By.ID, "more-button")
      self.chrome.click_element_as_script(more_button)
      messages_button = self.chrome.get_element(By.ID, "more-options-chat-button")

    self.chrome.click_element_as_script(messages_button)

  def call_debugme(self):
    self.open_close_chat_drawer()

    message_input = self.chrome.get_element_with_retry(By.ID, "message-input")
    self.chrome.write_to_element(message_input, "debugme")

    send_button = self.chrome.get_element_with_retry(By.ID, "message-send-button")
    self.chrome.click_element_as_script(send_button)

  def get_role(self, streamId):
    all_participants = self.get_participants()
    role = all_participants[streamId]["role"]
    print("role of: "+str(role))
    return role
 
  def test_presenter_room(self):
    room = "room"+str(random.randint(100, 999))
    handle_admin = self.join_room_as_admin("adminA", room, skip_speed_test=False)   
    handle_presenter = self.join_room_as_presenter("presenterA", room, skip_speed_test=False)

    assert(handle_presenter == self.chrome.get_current_tab_id())

    presenterId = self.get_publishStreamId()

    assert(self.chrome.get_element_with_retry(By.ID,presenterId).is_displayed())

    wait = self.chrome.get_wait()

    wait.until(lambda x: len(self.get_participants()) == 2)

    self.chrome.switch_to_tab(handle_admin)

    wait.until(lambda x: len(self.get_participants()) == 2)

    self.chrome.switch_to_tab(handle_presenter)

    time.sleep(1)

    self.leave_room()

    self.chrome.switch_to_tab(handle_admin)

    wait.until(lambda x: len(self.get_participants()) == 1)

    #self.chrome.close_all()

  def test_both_rooms(self):
    self.chrome.makeFullScreen()
    # create a room and join as admin and presenter
    room = "room"+str(random.randint(100, 999))
    handle_admin = self.join_room_as_admin("adminA", room)   
    handle_presenter = self.join_room_as_presenter("presenterA", room)

    assert(handle_presenter == self.chrome.get_current_tab_id())

    presenterId = self.get_publishStreamId()

    assert(self.chrome.get_element_with_retry(By.ID,presenterId).is_displayed())

    wait = self.chrome.get_wait()

    # check if both participants are in the room and see each other
    wait.until(lambda x: len(self.get_participants()) == 2)

    print("publisher can see admin and himself")

    self.chrome.switch_to_tab(handle_admin)

    wait.until(lambda x: len(self.get_participants()) == 2)

    print("admin can see publisher and himself")

    self.chrome.switch_to_tab(handle_presenter)

    # playerA joins to listener room
    handle_player_A = self.join_room_as_player("playerA", room)
    # there should be no video in listener room
    wait.until(lambda x: len(self.get_video_track_assignments()) == 0)

    print("player doesn't see publisher and admin")

    # switch to admin and add presenter to listener room
    self.chrome.switch_to_tab(handle_admin)

    presenterId = self.get_id_of_participant("presenterA")

    self.open_close_participant_list_drawer()

    print("admin opened participant list")

    time.sleep(5)

    self.add_presenter_to_listener_room(presenterId)
   
    print("admin added publisher to listeners room")

    wait.until(lambda x: self.get_role(presenterId) == "active_speaker")

    print("publisher is active_speaker now")

    remove_speaker_button = self.chrome.get_element_with_retry(By.ID,"remove-presenter-"+presenterId)

    assert(remove_speaker_button.is_displayed())

    print("add button turned to remove now")

    # switch to playerA and check if presenter is added to listener room
    self.chrome.switch_to_tab(handle_player_A)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 1)

    print("listener can see publisher now")

    # switch to admin and remove presenter from listener room
    self.chrome.switch_to_tab(handle_admin)

    self.remove_presenter_from_listener_room(presenterId)

    print("admin removed publisher from listeners room")

    # switch to playerA and check if presenter is removed from listener room
    self.chrome.switch_to_tab(handle_player_A)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 0)

    print("listener cannot see publisher now")

    self.chrome.close_all()

  def get_videoTrackAssignments(self, expected_value=None):
    script = "return window.conference;"
    result_json = self.chrome.execute_script_with_retry(script)
    
    if result_json is None:
      return []
    
    #self.chrome.print_console_logs()
    vtas = result_json["videoTrackAssignments"]
    if expected_value is not None and len(vtas) != expected_value:
      print("\n ++++++++++ start trial ++++++++++")
      print("VTA expected: "+str(expected_value) + " but got: "+str(len(vtas)))
      self.call_debugme()
      print("\n")
      self.print_message()

      print("\n screen shot")
      self.chrome.print_ss_as_base64()

      self.open_close_chat_drawer()
      print("++++++++++ end trial ++++++++++\n")


   
    cpu_usage = psutil.cpu_percent(interval=0)
    print(f"Instant CPU Usage: {cpu_usage}%")
    return vtas
  
  def assertLocalVideoAvailable(self):
    publishStreamId = self.get_publishStreamId()
    print("assertLocalVideoAvailable -> publishStreamId: "+publishStreamId)

    localVideo = self.chrome.get_element_with_retry(By.ID, publishStreamId)

    assert(localVideo.is_displayed())

  def test_with_stats(self):
    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_as_presenter("participantA", room)
    handle_2 = self.join_room_as_presenter("participantB", room)
    handle_3 = self.join_room_as_presenter("participantB", room)


    assert(handle_3 == self.chrome.get_current_tab_id())

    self.assertLocalVideoAvailable()

    wait = self.chrome.get_wait()

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 3)

    self.chrome.switch_to_tab(handle_1)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 3)

    print("self.get_track_stats()", self.get_track_stats())

    wait.until(lambda x: len(self.get_track_stats()['inboundRtpList']) == 4)
    stats = self.get_track_stats()

    # comment out for now
    #for track_stat in stats['inboundRtpList']:
    #  assert(track_stat['bytesReceived'] > 0)


    print("stats: "+str(stats))

    # comment out for now
    #assert(stats is not None)

    self.chrome.close_all()

  def test_pin_scenario(self):
    # create a room and join as admin and 3 presenters
    room = "room"+str(random.randint(100, 999))
    handle_admin = self.join_room_as_admin("adminA", room)   
    handle_presenter1 = self.join_room_as_presenter("presenterA", room)
    handle_presenter2 = self.join_room_as_presenter("presenterB", room)
    handle_presenter3 = self.join_room_as_presenter("presenterC", room)

    assert(handle_presenter3 == self.chrome.get_current_tab_id())

    presenterId = self.get_publishStreamId()

    assert(self.chrome.get_element_with_retry(By.ID,presenterId).is_displayed())

    wait = self.chrome.get_wait()

    # check if participants are in the room and see each other
    self.chrome.switch_to_tab(handle_admin)

    wait.until(lambda x: len(self.get_participants()) == 4)

    self.chrome.switch_to_tab(handle_presenter1)

    wait.until(lambda x: len(self.get_participants()) == 4)

    self.chrome.switch_to_tab(handle_presenter2)

    wait.until(lambda x: len(self.get_participants()) == 4)

    self.chrome.switch_to_tab(handle_presenter3)

    wait.until(lambda x: len(self.get_participants()) == 4)

    # switch to admin and pin presenterC
    self.chrome.switch_to_tab(handle_admin)

    presenterId = self.get_id_of_participant("presenterC")

    self.open_close_participant_list_drawer()

    time.sleep(15)

    # pin presenterC

    pin_button = self.chrome.get_element_with_retry(By.ID,"pin-"+presenterId)

    self.chrome.click_element(pin_button)

    # unpin presenterC

    pin_button = self.chrome.get_element_with_retry(By.ID,"unpin-"+presenterId)

    self.chrome.click_element(pin_button)

    # pin presenterC again

    pin_button = self.chrome.get_element_with_retry(By.ID,"pin-"+presenterId)

    self.chrome.click_element(pin_button)

    self.chrome.close_all()

  def test_multiple_player(self):
    # create a room and join as admin and presenter
    room = "room"+str(random.randint(100, 999))
    handle_admin = self.join_room_as_admin("adminA", room)   
    handle_presenter = self.join_room_as_presenter("presenterA", room)

    assert(handle_presenter == self.chrome.get_current_tab_id())

    presenterId = self.get_publishStreamId()

    assert(self.chrome.get_element_with_retry(By.ID,presenterId).is_displayed())

    wait = self.chrome.get_wait()

    # check if both participants are in the room and see each other
    wait.until(lambda x: len(self.get_participants()) == 2)

    self.chrome.switch_to_tab(handle_admin)

    wait.until(lambda x: len(self.get_participants()) == 2)

    self.chrome.switch_to_tab(handle_presenter)


    # playerA joins to listener room
    handle_player_A = self.join_room_as_player("playerA", room)
    # there should be no video in listener room
    wait.until(lambda x: len(self.get_video_track_assignments()) == 0)

    # playerB joins to listener room
    handle_player_B = self.join_room_as_player("playerB", room)
    # there should be no video in listener room
    wait.until(lambda x: len(self.get_video_track_assignments()) == 0)

    # playerC joins to listener room
    handle_player_C = self.join_room_as_player("playerC", room)
    # there should be no video in listener room
    wait.until(lambda x: len(self.get_video_track_assignments()) == 0)


    # switch to admin and add presenter to listener room
    self.chrome.switch_to_tab(handle_admin)

    presenterId = self.get_id_of_participant("presenterA")

    self.open_close_participant_list_drawer()

    time.sleep(15)

    self.add_presenter_to_listener_room(presenterId)

    # switch to playerA and check if presenter is added to listener room
    self.chrome.switch_to_tab(handle_player_A)

    time.sleep(15)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 1)

    # switch to playerB and check if presenter is added to listener room
    self.chrome.switch_to_tab(handle_player_B)

    time.sleep(15)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 1)

    # switch to playerC and check if presenter is added to listener room
    self.chrome.switch_to_tab(handle_player_C)

    time.sleep(15)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 1)

    # switch to admin and remove presenter from listener room
    self.chrome.switch_to_tab(handle_admin)

    time.sleep(15)

    self.remove_presenter_from_listener_room(presenterId)

    # switch to playerA and check if presenter is removed from listener room
    self.chrome.switch_to_tab(handle_player_A)

    time.sleep(15)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 0)

    # switch to playerB and check if presenter is removed from listener room
    self.chrome.switch_to_tab(handle_player_B)

    time.sleep(15)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 0)

    # switch to playerC and check if presenter is removed from listener room
    self.chrome.switch_to_tab(handle_player_C)

    time.sleep(15)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 0)


    self.chrome.close_all()

  #FIXME: the buttons are appears on mouse hovers the card. This causes some issue in headless mode 
  def _test_admin_video_card_controls(self):
    # create a room and join as admin and presenter
    room = "room"+str(random.randint(100, 999))
    handle_admin = self.join_room_as_admin("adminA", room, skip_speed_test=True)   
    handle_presenter = self.join_room_as_presenter("presenterA", room, skip_speed_test=True)

    assert(handle_presenter == self.chrome.get_current_tab_id())

    presenterId = self.get_publishStreamId()

    assert(self.chrome.get_element_with_retry(By.ID,presenterId).is_displayed())

    wait = self.chrome.get_wait()

    # check if both participants are in the room and see each other
    wait.until(lambda x: len(self.get_participants()) == 2)

    self.chrome.switch_to_tab(handle_admin)

    wait.until(lambda x: len(self.get_participants()) == 2)


    wait.until(lambda x: len(self.chrome.get_all_elements(By.CSS_SELECTOR, "div.single-video-container.not-pinned")) == 2)

    presenterA_video_card = self.get_video_container_by_stream_name("presenterA")

    #check muted icon is not visible
    assert(not self.chrome.is_nested_element_exist(presenterA_video_card, By.XPATH, ".//div[@aria-label='mic is muted']"))

    #mute presenterA
    mute_button = self.chrome.get_element_in_element(presenterA_video_card, By.XPATH, ".//button[@type='button' and @aria-label='mute']", wait_until_clickable=False)
    mute_button.click()

    #check muted icon will be visible
    wait.until(lambda x: self.chrome.get_element_in_element(presenterA_video_card, By.XPATH, ".//div[@aria-label='mic is muted']") is not None)

    #mute presenterA
    unmute_button = self.chrome.get_element_in_element(presenterA_video_card, By.XPATH, ".//button[@type='button' and @aria-label='unmute']", wait_until_clickable=False)
    unmute_button.click()

    #check muted icon will be disappeared
    wait.until(lambda x: not self.chrome.is_nested_element_exist(presenterA_video_card, By.XPATH, ".//div[@aria-label='mic is muted']"))

    #turn off presenterA camera
    turn_off_button = self.chrome.get_element_in_element(presenterA_video_card, By.XPATH, ".//button[@type='button' and @aria-label='turn-off-camera']", wait_until_clickable=False)
    turn_off_button.click()

    #check turn off button returned turn on
    wait.until(lambda x: self.chrome.get_element_in_element(presenterA_video_card, By.XPATH, ".//button[@type='button' and @aria-label='turn-on-camera']") is not None)
    

    self.chrome.switch_to_tab(handle_presenter)
    camera_button = self.chrome.get_element_with_retry(By.ID, "camera-button")
    camera_button.click()


    self.chrome.switch_to_tab(handle_admin)

    #check turn off button returned turn on
    wait.until(lambda x: self.chrome.get_element_in_element(presenterA_video_card, By.XPATH, ".//button[@type='button' and @aria-label='turn-off-camera']") is not None)
   
    
    self.chrome.close_all()

  def get_request_publish_button(self):
    rp_button = None
    if(self.chrome.is_element_exist(By.ID, "request-publish-button")):
      rp_button = self.chrome.get_element(By.ID, "request-publish-button")
    else:
      more_button = self.chrome.get_element_with_retry(By.ID, "more-button")
      self.chrome.click_element(more_button)
      rp_button = self.chrome.get_element_with_retry(By.ID, "more-options-request-publish-button")
    return rp_button

  def _test_raising_hand(self):
    # create a room and join as admin and 2 players
    room = "room"+str(random.randint(100, 999))
    handle_admin = self.join_room_as_admin("admin", room, True)
    handle_player_A = self.join_room_as_player("playerA", room, True)
    handle_player_B = self.join_room_as_player("playerB", room, True)

    wait = self.chrome.get_wait()

    # switch to playerA and raise hand
    self.chrome.switch_to_tab(handle_player_A)

    raise_hand_button = self.get_request_publish_button()
    self.chrome.click_element(raise_hand_button)

    # switch to admin and check if playerA is in the request list
    self.chrome.switch_to_tab(handle_admin)

    self.open_close_publisher_request_list_drawer()

    time.sleep(5)

    self.accept_raising_hand_request("playerA")

    # switch to playerA and join the room
    self.chrome.switch_to_tab(handle_player_A)

    time.sleep(10)

    join_button = self.chrome.get_element_with_retry(By.ID,"room_join_button")
    self.chrome.click_element(join_button)


    meeting_gallery = self.chrome.get_element_with_retry(By.ID,"meeting-gallery")
    assert(meeting_gallery.is_displayed())

    wait.until(lambda x: len(self.get_participants()) == 2)

    # switch to admin
    self.chrome.switch_to_tab(handle_admin)

    wait.until(lambda x: len(self.get_participants()) == 2)

    # switch to playerB
    self.chrome.switch_to_tab(handle_player_B)

    self.chrome.close_all()

if __name__ == '__main__':
    unittest.main()