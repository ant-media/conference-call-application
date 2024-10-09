from browser import Browser
from selenium.webdriver.common.by import By
from selenium.common import exceptions  

import sys
import unittest
import os
import random
import json
import time
import subprocess
import threading

class TestTestFakeehScenario(unittest.TestCase):
  def setUp(self):
    print(self._testMethodName, " starting...")
    self.url = os.environ.get('SERVER_URL')
    self.test_app_name = os.environ.get('TEST_APP_NAME')
    self.chrome = Browser()
    self.chrome.init(True)
    #self.startLoadTest()

  def tearDown(self):
    print(self._testMethodName, " ending...")

  def startLoadTest(self):
    def start_load_test():
      subprocess.run(["./webrtc-load-test/run.sh", "-f", "test.mp4", "-m", "publisher", "-n", "12", "-s", self.url, "-q", "true", "-p", "5443", "-a", self.test_app_name])

    # Create a new thread for running the load test
    load_test_thread = threading.Thread(target=start_load_test)
    load_test_thread.start()

  def join_room_as_admin(self, participant, room):
    print("url: "+self.url+"/"+self.test_app_name+"/"+room)
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    handle = self.chrome.open_in_new_tab(self.url+app+"/"+room+"?role=host&streamName="+participant)
    
    #name_text_box = self.chrome.get_element_with_retry(By.ID,"participant_name")
    #self.chrome.write_to_element(name_text_box, participant)

    join_button = self.chrome.get_element_with_retry(By.ID,"room_join_button")

    time.sleep(5)

    self.chrome.click_element(join_button)

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
  
  def join_room_as_presenter(self, participant, room):
    print("url: "+self.url+"/"+self.test_app_name+"/"+room)
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    handle = self.chrome.open_in_new_tab(self.url+app+"/"+room+"?role=speaker&streamName="+participant)
    
    #name_text_box = self.chrome.get_element_with_retry(By.ID,"participant_name")
    #self.chrome.write_to_element(name_text_box, participant)

    join_button = self.chrome.get_element_with_retry(By.ID,"room_join_button")

    time.sleep(5)

    self.chrome.click_element(join_button)

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
  
  def join_room_as_player(self, participant, room):
    print("url: "+self.url+"/"+self.test_app_name+"/"+room)
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    handle = self.chrome.open_in_new_tab(self.url+app+"/"+room+"?playOnly=true&role=listener&streamName="+participant)
    
    #name_text_box = self.chrome.get_element_with_retry(By.ID,"participant_name")
    #self.chrome.write_to_element(name_text_box, participant)

    join_button = self.chrome.get_element_with_retry(By.ID,"room_join_button")

    time.sleep(5)

    self.chrome.click_element(join_button)

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
  
  def add_presenter_to_listener_room(self, presenter):
    add_button = self.chrome.get_element(By.ID,"add-presenter-"+presenter)
    self.chrome.click_element(add_button)

  def remove_presenter_from_listener_room(self, presenter):
    remove_speaker_button = self.chrome.get_element(By.ID,"remove-presenter-"+presenter)
    self.chrome.click_element(remove_speaker_button)

  def remove_temporary_speaker_from_presenter_room(self, presenter):
    remove_speaker_button = self.chrome.get_element(By.ID,"remove-speaker-"+presenter)
    self.chrome.click_element(remove_speaker_button)

  def open_close_participant_list_drawer(self):
    participant_list_button = None
    try:
      participant_list_button = self.chrome.get_element(By.ID,"participant-list-button")
    except exceptions.NoSuchElementException:
      more_button = self.chrome.get_element(By.ID, "more-button")
      self.chrome.click_element(more_button)
      participant_list_button = self.chrome.get_element(By.ID,"more-options-participant-list-button")
    self.chrome.click_element(participant_list_button)

  def open_close_publisher_request_list_drawer(self):
    open_participant_list_button = None

    try:
      open_participant_list_button = self.chrome.get_element(By.ID,"publisher-request-list-button")
    except exceptions.NoSuchElementException:
      more_button = self.chrome.get_element(By.ID, "more-button")
      self.chrome.click_element(more_button)
      open_participant_list_button = self.chrome.get_element(By.ID,"more-options-publisher-request-list-button")

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
    
    print("mustafa get_publishStreamId index: "+str(index))
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
  
 
  def test_presenter_room(self):
    room = "room"+str(random.randint(100, 999))
    handle_admin = self.join_room_as_admin("adminA", room)   
    handle_presenter = self.join_room_as_presenter("presenterA", room)

    assert(handle_presenter == self.chrome.get_current_tab_id())

    presenterId = self.get_publishStreamId()

    assert(self.chrome.get_element_with_retry(By.ID,presenterId).is_displayed())

    wait = self.chrome.get_wait()

    wait.until(lambda x: len(self.get_participants()) == 2)

    self.chrome.switch_to_tab(handle_admin)

    wait.until(lambda x: len(self.get_participants()) == 2)

    self.chrome.switch_to_tab(handle_presenter)

    self.leave_room()

    self.chrome.switch_to_tab(handle_admin)

    wait.until(lambda x: len(self.get_participants()) == 1)

    self.chrome.close_all()

  def test_both_rooms(self):
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

    # switch to admin and add presenter to listener room
    self.chrome.switch_to_tab(handle_admin)

    presenterId = self.get_id_of_participant("presenterA")

    self.open_close_participant_list_drawer()

    self.add_presenter_to_listener_room(presenterId)

    # switch to playerA and check if presenter is added to listener room
    self.chrome.switch_to_tab(handle_player_A)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 1)


    # switch to admin and remove presenter from listener room
    self.chrome.switch_to_tab(handle_admin)

    self.remove_presenter_from_listener_room(presenterId)

    # switch to playerA and check if presenter is removed from listener room
    self.chrome.switch_to_tab(handle_player_A)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 0)


    self.chrome.close_all()

  def _test_with_stats(self):
    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)
    handle_2 = self.join_room_in_new_tab("participantB", room)
    handle_3 = self.join_room_in_new_tab("participantB", room)


    assert(handle_3 == self.chrome.get_current_tab_id())

    self.assertLocalVideoAvailable()

    wait = self.chrome.get_wait()

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 3)

    self.chrome.switch_to_tab(handle_1)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 3)

    wait.until(lambda x: len(self.get_track_stats()['inboundRtpList']) == 4)
    stats = self.get_track_stats()

    for track_stat in stats['inboundRtpList']:
      assert(track_stat['bytesReceived'] > 0)


    print("stats: "+str(stats))

    assert(stats is not None)

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

    self.add_presenter_to_listener_room(presenterId)

    # switch to playerA and check if presenter is added to listener room
    self.chrome.switch_to_tab(handle_player_A)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 1)

    # switch to playerB and check if presenter is added to listener room
    self.chrome.switch_to_tab(handle_player_B)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 1)

    # switch to playerC and check if presenter is added to listener room
    self.chrome.switch_to_tab(handle_player_C)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 1)

    # switch to admin and remove presenter from listener room
    self.chrome.switch_to_tab(handle_admin)

    self.remove_presenter_from_listener_room(presenterId)

    # switch to playerA and check if presenter is removed from listener room
    self.chrome.switch_to_tab(handle_player_A)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 0)

    # switch to playerB and check if presenter is removed from listener room
    self.chrome.switch_to_tab(handle_player_B)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 0)

    # switch to playerC and check if presenter is removed from listener room
    self.chrome.switch_to_tab(handle_player_C)

    wait.until(lambda x: len(self.get_video_track_assignments()) == 0)


    self.chrome.close_all()

  def test_request_to_speak(self):
    return
    # create a room and join as admin and presenter
    room = "room"+str(random.randint(100, 999))
    handle_admin = self.join_room_as_admin("adminA", room)   
    handle_presenter = self.join_room_as_presenter("presenterA", room)

    assert(handle_presenter == self.chrome.get_current_tab_id())

    assert(self.chrome.get_element_with_retry(By.LABEL,"localVideo").is_displayed())

    wait = self.chrome.get_wait()

    # check if both participants are in the room and see each other
    wait.until(lambda x: len(self.get_participants()) == 2)

    self.chrome.switch_to_tab(handle_admin)

    wait.until(lambda x: len(self.get_participants()) == 2)

    self.chrome.switch_to_tab(handle_presenter)

    # playerA joins to listener room
    handle_player_A = self.join_room_as_player("playerA", room+"listener")
    # there should be no video in listener room
    wait.until(lambda x: len(self.get_participants()) == 0)

    # playerB joins to listener room
    handle_player_B = self.join_room_as_player("playerB", room+"listener")
    # there should be no video in listener room
    wait.until(lambda x: len(self.get_participants()) == 0)

    # switch to admin and add presenter to listener room
    self.chrome.switch_to_tab(handle_admin)

    presenterId = self.get_id_of_participant("presenterA")

    self.open_close_participant_list_drawer()

    self.add_presenter_to_listener_room(presenterId)

    # switch to playerA and check if presenter is added to listener room
    self.chrome.switch_to_tab(handle_player_A)

    wait.until(lambda x: len(self.get_participants()) == 1)

    # playerA requests to become a publisher
    request_to_publisher_button = self.chrome.get_element_with_retry(By.ID,"request-to-publisher-button")
    self.chrome.click_element(request_to_publisher_button)

    # switch to admin and check if playerA is added to listener room
    self.chrome.switch_to_tab(handle_admin)

    # participant list should 1 beacuse playerA requested to speak but we did not approve it yet
    wait.until(lambda x: len(self.get_participants()) == 2)

    # admin checks if there is a request to speak
    self.open_close_publisher_request_list_drawer()
    wait.until(lambda x: len(self.get_request_publisher_list()) == 1)

    # admin approves playerA to become a speaker
    approve_button = self.chrome.get_element_with_retry(By.ID,"approve-publisher-request-"+presenterId)
    self.chrome.click_element(approve_button)

    wait.until(lambda x: len(self.get_request_publisher_list()) == 0)
    wait.until(lambda x: len(self.get_participants()) == 3)

    # switch to playerA and check if playerA is added to publisher room
    self.chrome.switch_to_tab(handle_player_A)
    wait.until(lambda x: len(self.get_participants()) == 3)

    # switch to playerB and check if there is still 1 participant in the listener room
    self.chrome.switch_to_tab(handle_player_B)
    wait.until(lambda x: len(self.get_participants()) == 1)

    # switch to admin and remove presenter from listener room
    self.chrome.switch_to_tab(handle_admin)

    tempPresenterId = self.get_id_of_participant("playerA")
    self.remove_temporary_speaker_from_presenter_room(tempPresenterId)

    wait.until(lambda x: len(self.get_participants()) == 2)

    self.chrome.switch_to_tab(handle_player_A)
    wait.until(lambda x: len(self.get_participants()) == 1)

    self.chrome.close_all()

if __name__ == '__main__':
    unittest.main()