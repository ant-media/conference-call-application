from browser import Browser
from selenium.webdriver.common.by import By
from rest_helper import RestHelper 


import subprocess
import sys
import unittest
import os
import random
import json
import time
import psutil
import re
import threading



class TestJoinLeave(unittest.TestCase):
  def setUp(self):
      print("----------------\n", self._testMethodName, " starting...")
      self.is_local = False
      #self.is_local = True
      self.verbose = False
      self.url = os.environ.get('SERVER_URL')
      self.test_app_name = os.environ.get('TEST_APP_NAME')
      self.user = os.environ.get('AMS_USER')
      self.password = os.environ.get('AMS_PASSWORD')
      self.chrome = Browser()
      current_dir = os.path.dirname(os.path.abspath(__file__))
      fake_audio_file_path = os.path.join(current_dir, "fake_mic.wav")
      self.chrome.init(not self.is_local, mic_file=fake_audio_file_path)
      self.chrome.makeFullScreen()
      self.rest_helper = RestHelper(self.url, self.user, self.password, self.test_app_name)
      self.rest_helper.login()

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

  def create_participants_with_test_tool(self, participant_name, room, count):
    
    directory = os.path.expanduser("~/test/webrtc-load-test")
    script = "run.sh"
    ws_url = self.url.replace("https://", "").replace("http://", "")

    if self.is_local:
      parameters = ["-m", "publisher", "-f", "test.mp4", "-r", "true", "-a", self.test_app_name, "-i", participant_name, "-t", room, "-n", str(count)]  
    else:
      parameters = ["-m", "publisher", "-s", ws_url, "-p", "443", "-q", "true", "-f", "test.mp4", "-r", "true", "-a", self.test_app_name, "-i", participant_name, "-t", room, "-n", str(count)]  
    
    print("test tool is running with parameters: "+str(parameters))
    # Full path to the script
    script_path = os.path.join(directory, script)

    # Run the script silently with parameters
    process = subprocess.Popen(
        ["bash", script_path] + parameters,
        cwd=directory,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    return process

  def kill_participants_with_test_tool(self, process):
    print(f"Before killing process: {process.pid}")
    try:
        # Kill the given process and its children
        parent = psutil.Process(process.pid)
        for child in parent.children(recursive=True):
            child.kill()
        parent.kill()
    except psutil.NoSuchProcess:
        print("Process already terminated.")

    # Call `pkill java` to ensure no stray Java processes are left running
    
    try:
        #subprocess.run(["pkill", "java"], check=True)
        print("pkill java executed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error executing pkill java: {e}")
    except FileNotFoundError:
        print("pkill command not found on the system.")

    
    print(f"After killing process: {process.pid}")



  def join_room_in_new_tab(self, participant, room, play_only=False):
    print("url: "+self.url+"/"+self.test_app_name+"/"+room)
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    
    handle = self.chrome.open_in_new_tab(self.url + app + "/" + room + ("?playOnly=true" if play_only else ""))
    
    name_text_box = self.chrome.get_element_with_retry(By.ID, "participant_name")

    self.chrome.write_to_element(name_text_box, participant)

    join_button = self.chrome.get_element_with_retry(By.ID, "room_join_button")
    self.chrome.click_element(join_button)
 
    #self.chrome.print_console_logs()

    meeting_gallery = self.chrome.get_element_with_retry(By.ID, "meeting-gallery")
    #self.chrome.print_ss_as_base64()

    assert(meeting_gallery.is_displayed())

    return handle
    
  def get_videoTrackAssignments(self, expected_value=None):
    script = "return window.conference;"
    result_json = self.chrome.execute_script_with_retry(script, 5, 3)
    
    if result_json is None:
      return []
        
    #self.chrome.print_console_logs()
    vtas = result_json["videoTrackAssignments"]
    if expected_value is not None and len(vtas) != expected_value:
      print("VTA expected: "+str(expected_value) + " but got: "+str(len(vtas)))
      if self.verbose:
        self.call_debugme()
        print("\n")
        self.print_message()

        #print("\n screen shot")
        #self.chrome.print_ss_as_base64()
   
    cpu_usage = psutil.cpu_percent(interval=0)
    print(f"Instant CPU Usage: {cpu_usage}%")
    return vtas
  
  def get_track_stats(self):
    script = "return window.conference.getTrackStats();"
    result_json = self.chrome.execute_script_with_retry(script)
    if result_json is None:
      return []

    return result_json
  
  def fake_reconnect(self):
    script = "return window.conference.fakeReconnect();"
    result_json = self.chrome.execute_script_with_retry(script)
    if result_json is None:
      return []

    return result_json
  
  def set_audio_level(self, audioLevel):
    script = "return window.conference.setMicAudioLevel("+str(audioLevel)+");"
    self.chrome.execute_script_with_retry(script)
  
  def get_conference(self):
    script = "return window.conference;"
    result_json = self.chrome.execute_script_with_retry(script)
    #print(result_json)
    if result_json is None:
      return {}
    #print(result_json)
    return result_json
  
  def get_tile_count(self):
    script = "return window.conference;"
    result_json = self.chrome.execute_script_with_retry(script)
    if result_json is None:
      return -1
    return result_json["globals"]["desiredTileCount"]
  
  def set_layout(self, type):
    settings_button = self.chrome.get_element_with_retry(By.ID, "settings-button")
    self.chrome.click_element(settings_button)

    time.sleep(1)

    change_layout_button = self.chrome.get_element_with_retry(By.ID, "change-layout-button")
    self.chrome.click_element(change_layout_button)

    time.sleep(1)

    change_layout_button = self.chrome.get_element_with_retry(By.XPATH, "//input[@type='radio' and @value='"+type+"']")
    self.chrome.click_element(change_layout_button)

    time.sleep(1)

    layout_dialog_close_button = self.chrome.get_element_with_retry(By.ID, "layout-dialog-close-button")
    self.chrome.click_element(layout_dialog_close_button)
  
  def change_tile_count(self, count):
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

    settings_button = self.chrome.get_element_with_retry(By.ID, "settings-button")
    self.chrome.click_element(settings_button)

    time.sleep(1)

    change_layout_button = self.chrome.get_element_with_retry(By.ID, "change-layout-button")
    self.chrome.click_element(change_layout_button)

    time.sleep(1)

    tile_count_slider = self.chrome.get_element_with_retry(By.ID, "tile-count-slider")
    points = self.chrome.get_all_elements_in_element(tile_count_slider, By.CLASS_NAME, "MuiSlider-mark")
    self.chrome.mouse_click_on(points[index])

    layout_dialog_close_button = self.chrome.get_element_with_retry(By.ID, "layout-dialog-close-button")
    self.chrome.click_element(layout_dialog_close_button)

  def get_start_recording_button(self):
    settings_button = self.chrome.get_element(By.ID, "settings-button")
    self.chrome.click_element(settings_button)

    start_recording_button = self.chrome.get_element(By.ID, "start-recording-button")
    return start_recording_button
  
  def get_share_screen_button(self):
    if(self.chrome.is_element_exist(By.ID, "share-screen-button")):
      ss_button = self.chrome.get_element(By.ID, "share-screen-button")
    else:
      more_button = self.chrome.get_element_with_retry(By.ID, "more-button")
      self.chrome.click_element(more_button)
      ss_button = self.chrome.get_element_with_retry(By.ID, "more-options-share-screen-button")
    return ss_button
  
  def get_stop_recording_button(self):
    settings_button = self.chrome.get_element(By.ID, "settings-button")
    self.chrome.click_element(settings_button)

    stop_recording_button = self.chrome.get_element(By.ID, "stop-recording-button")
    return stop_recording_button
  
  def test_home_page_create_room(self):
    room = "room"+str(random.randint(100, 999))
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    handle = self.chrome.open_in_new_tab(self.url+app)
    room_name_text_box = self.chrome.get_element_with_retry(By.ID, "room_name")

    self.chrome.write_to_element(room_name_text_box, room)

    join_button = self.chrome.get_element_with_retry(By.ID, "room_join_button")
    self.chrome.click_element(join_button)
    waiting_gallery = self.chrome.get_element_with_retry(By.ID, "waiting-room")

    assert(waiting_gallery.is_displayed())

    self.chrome.close_all()

  def test_home_page_create_random_room(self):
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    handle = self.chrome.open_in_new_tab(self.url+app)
    link = self.chrome.get_element_with_retry(By.XPATH, "//p[text()='Create Meeting']") 
    link.click()
    waiting_gallery = self.chrome.get_element_with_retry(By.ID, "waiting-room")
    assert(waiting_gallery.is_displayed())

    self.chrome.close_all()

  def test_camera_mic_setting_in_waiting_room(self):
    room = "room"+str(random.randint(100, 999))
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    handle = self.chrome.open_in_new_tab(self.url+app+"/"+room)
    more_options_button = self.chrome.get_element_with_retry(By.ID, "waiting-room-more-options")
    more_options_button.click()

    camera_select = self.chrome.get_element_with_retry(By.ID, "setting-dialog-camera-select")
    self.chrome.mouse_click_on(camera_select)

    time.sleep(1)

    camera = self.chrome.get_element_with_retry(By.XPATH, "//li[contains(text(), 'fake_device_0')]")
    self.chrome.mouse_click_on(camera)


    resolution_select = self.chrome.get_element_with_retry(By.ID, "setting-dialog-resolution-select")
    self.chrome.mouse_click_on(resolution_select)

    time.sleep(1)

    resolution = self.chrome.get_element_with_retry(By.XPATH, "//li[contains(text(), 'Low definition (180p)')]")
    self.chrome.mouse_click_on(resolution)

    mic_select = self.chrome.get_element_with_retry(By.ID, "setting-dialog-mic-select")
    self.chrome.mouse_click_on(mic_select)

    time.sleep(1)

    self.chrome.save_ss_as_file("test_camera_mic_setting_in_waiting_room-1.png")

    #TODO: sometimes audio input 2 is not available, check it.
    if self.chrome.is_element_exist(By.XPATH, "//li[contains(text(), 'Fake Audio Input 2')]"):
      mic = self.chrome.get_element_with_retry(By.XPATH, "//li[contains(text(), 'Fake Audio Input 2')]")
      self.chrome.mouse_click_on(mic)

    close_button = self.chrome.get_element_with_retry(By.CSS_SELECTOR, "button[aria-label='close']")
    close_button.click()


    name_text_box = self.chrome.get_element_with_retry(By.ID, "participant_name")

    self.chrome.write_to_element(name_text_box, "participant1")

    join_button = self.chrome.get_element_with_retry(By.ID, "room_join_button")
    self.chrome.click_element(join_button)
 
    meeting_gallery = self.chrome.get_element_with_retry(By.ID, "meeting-gallery")
    assert(meeting_gallery.is_displayed())
    self.chrome.close_all()

  def test_join_as_camera_mic_off(self):
      room = "room"+str(random.randint(100, 999))
      app = "/"+self.test_app_name
      if self.url.endswith("localhost:3000"):
        app = ""
      handle = self.chrome.open_in_new_tab(self.url+app+"/"+room)

      camera_button = self.chrome.get_element_with_retry(By.ID, "camera-button")
      camera_button.click()

      min_button = self.chrome.get_element_with_retry(By.ID, "mic-button")
      min_button.click()

      name_text_box = self.chrome.get_element_with_retry(By.ID, "participant_name")

      self.chrome.write_to_element(name_text_box, "participant1")

      join_button = self.chrome.get_element_with_retry(By.ID, "room_join_button")
      self.chrome.click_element(join_button)
  
      meeting_gallery = self.chrome.get_element_with_retry(By.ID, "meeting-gallery")
      assert(meeting_gallery.is_displayed())
      self.chrome.close_all()

  #this test will not work on local since we have camera and mic in local
  def _test_join_without_camera_mic(self):
      self.chrome.close_all()
      self.chrome = Browser()
      self.chrome.init(True, False)
     
      self.chrome.makeFullScreen()
      room = "room"+str(random.randint(100, 999))
      app = "/"+self.test_app_name
      if self.url.endswith("localhost:3000"):
        app = ""

      handle = self.chrome.open_in_new_tab(self.url+app+"/"+room)

      more_options_button = self.chrome.get_element_with_retry(By.ID, "waiting-room-more-options")
      more_options_button.click()

      self.chrome.save_ss_as_file("settings-1.png")

      time.sleep(2)

      close_button = self.chrome.get_element_with_retry(By.CSS_SELECTOR, "button[aria-label='close']")
      close_button.click()

      time.sleep(2)

      camera_button = self.chrome.get_element_with_retry(By.ID, "camera-button")
      camera_button.click()

      min_button = self.chrome.get_element_with_retry(By.ID, "mic-button")
      min_button.click()

      name_text_box = self.chrome.get_element_with_retry(By.ID, "participant_name")

      self.chrome.write_to_element(name_text_box, "participant1")

      join_button = self.chrome.get_element_with_retry(By.ID, "room_join_button")
      self.chrome.click_element(join_button)
  
      meeting_gallery = self.chrome.get_element_with_retry(By.ID, "meeting-gallery")
      assert(meeting_gallery.is_displayed())
      self.chrome.close_all()
    

  def test_join_room(self):
    room = "room"+str(random.randint(100, 999))
    self.join_room_in_new_tab("participantA", room)   
    self.chrome.close_all()

  def set_and_test_tile_count(self, limit):
      print("set_track_limit -> count: "+str(limit))
      self.change_tile_count(limit)
      wait = self.chrome.get_wait()
      wait.until(lambda x: self.get_tile_count() == limit)
      print("video_track_limit: "+str(limit))
  
  def test_tile_count(self):
    #self.chrome.makeFullScreen()
    room = "room"+str(random.randint(100, 999))
    self.join_room_in_new_tab("participantA", room)

    self.set_and_test_tile_count(2)
    time.sleep(5)
    self.set_and_test_tile_count(4)
    time.sleep(5)
    self.set_and_test_tile_count(6)
    time.sleep(5)
    self.set_and_test_tile_count(12)

    self.chrome.close_all()

  def assertLocalVideoAvailable(self):
    publishStreamId = self.get_publishStreamId()
    print("assertLocalVideoAvailable -> publishStreamId: "+publishStreamId)

    localVideo = self.chrome.get_element_with_retry(By.ID, publishStreamId)

    assert(localVideo.is_displayed())


  def leave_room(self):
    leave_button = self.chrome.get_element(By.ID, "leave-room-button")
    self.chrome.click_element(leave_button)

  def open_close_chat_drawer(self):
    if(self.chrome.is_element_exist(By.ID, "messages-button")):
      messages_button = self.chrome.get_element(By.ID, "messages-button")
    else:
      more_button = self.chrome.get_element(By.ID, "more-button")
      self.chrome.click_element_as_script(more_button)
      messages_button = self.chrome.get_element(By.ID, "more-options-chat-button")

    self.chrome.click_element_as_script(messages_button)

  def send_message(self, message):
    if not self.chrome.is_element_displayed(By.ID, "message-input"):
      self.open_close_chat_drawer()
    
    wait = self.chrome.get_wait()
    wait.until(lambda x: self.chrome.is_element_exist(By.ID, "message-send-button"))

    message_input = self.chrome.get_element_with_retry(By.ID, "message-input")
    time.sleep(1)
    self.chrome.write_to_element(message_input, message)

    send_button = self.chrome.get_element_with_retry(By.ID, "message-send-button")
    self.chrome.click_element_as_script(send_button)


  def call_debugme(self):
    self.send_message("debugme")

  def call_clearme_debugme(self):
    self.send_message("clearme")
    self.send_message("debugme")
    
    wait = self.chrome.get_wait()
    wait.until(lambda x: "Client Debug Info" in self.get_debugme_response())

    return self.get_debugme_response()

  def get_debugme_response(self):
    messages = self.chrome.get_all_elements(By.ID, "message")
    last_message = messages[-1]
    content = last_message.get_attribute("innerHTML")

    return content if content is not None else ""



  def print_message(self):
    messages = self.chrome.get_all_elements(By.ID, "message")
    print(">>>>>>>\nlast 2 messages:"+str(len(messages)))
    last_two_messages = messages[-2:]
    for message in last_two_messages:
      print("message:" + message.get_attribute("innerHTML"))
    print("<<<<<<<\n")

  def parse_backend_video_trackAssignments(self, debug_info):
    pattern = re.compile(r"{label:(\w+),assigned stream id:(\w+),reserved:(\w+),")
    matches = pattern.findall(debug_info)

    video_track_assignments = [
      {"label": match[0], "assigned_stream_id": match[1], "reserved": match[2] == 'true'}
      for match in matches
    ]

    print("video_track_assignments:"+str(video_track_assignments))
    return video_track_assignments
  
  def send_reaction(self, reaction):
    reaction_button = self.chrome.get_element(By.XPATH, "//button[@type='button' and @aria-label='Emoji reactions']")
    reaction_button.click()
    reaction_button = self.chrome.get_element(By.XPATH, "//div[text()='" + reaction + "']")
    print("before click:"+reaction)
    self.chrome.mouse_click_on(reaction_button)
    print("after click:"+reaction)

  #FIXME: rerun test
  def _test_others_tile(self):
    self.chrome.makeFullScreen()
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

    time.sleep(3)
    
    ss_button = self.get_share_screen_button()
    self.chrome.click_element(ss_button)

    time.sleep(3)

    self.chrome.switch_to_tab(handle_2)
    assert(self.chrome.get_element(By.ID, "unpinned-gallery").is_displayed())

    wait.until(lambda x: len(self.get_videoTrackAssignments(3)) == 3) 

    assert(not self.chrome.is_element_exist(By.CLASS_NAME, 'others-tile-inner'))

    self.set_and_test_tile_count(2)


    others_tile = self.chrome.get_element_with_retry(By.CLASS_NAME, 'others-tile-inner', retries=10, wait_time=3)
    assert(others_tile.is_displayed())

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

  def test_with_stats(self):
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

    time.sleep(5)
    stats = self.get_track_stats()

    assert(stats is not None)
    print("stats: "+str(stats))

    for track_stat in stats['inboundRtpList']:
      assert(track_stat['bytesReceived'] > 0)

    self.chrome.close_all()

  def is_first_participant_pinned(self):
    conference = self.get_conference()
    videoTrackAssignments = conference["videoTrackAssignments"]
    return videoTrackAssignments[1]["streamId"] == conference["pinnedVideoId"]
  
  def open_close_participant_list_drawer(self):
    participant_list_button = None

    if(self.chrome.is_element_exist(By.ID, "participant-list-button")):
      participant_list_button = self.chrome.get_element(By.ID, "participant-list-button")
    else:
      more_button = self.chrome.get_element_with_retry(By.ID, "more-button")
      self.chrome.click_element(more_button)
      participant_list_button = self.chrome.get_element_with_retry(By.ID, "more-options-participant-list-button")
    
    self.chrome.click_element(participant_list_button)
    time.sleep(2)
  
  def test_screen_share(self):
    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)
    handle_2 = self.join_room_in_new_tab("participantB", room)

    print("current: "+self.chrome.get_current_tab_id())

    assert(handle_2 == self.chrome.get_current_tab_id())

    self.assertLocalVideoAvailable()

    wait = self.chrome.get_wait()

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    participantA_stream_id = self.get_videoTrackAssignments()[1]["streamId"]

    self.chrome.switch_to_tab(handle_1)

    wait.until(lambda x: 
          (len(self.get_videoTrackAssignments()) == 2)
          and
          (self.get_videoTrackAssignments()[1]["streamId"].startswith("participantB"))
    )

    participantB_stream_id = self.get_videoTrackAssignments()[1]["streamId"]

    share_screen_button = self.get_share_screen_button()
    self.chrome.click_element(share_screen_button)

    self.chrome.switch_to_tab(handle_2)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 3)

    participantA_share_stream_id = participantA_stream_id+"_presentation"


    #check first video track is assigned to A's screen   
    wait.until(lambda x: 
          (backend_assignments := self.parse_backend_video_trackAssignments(self.call_clearme_debugme()))
          and 
          (2 == len(backend_assignments))
          and
          (self.get_background_assignment_for(backend_assignments, participantA_share_stream_id)["reserved"])
          and
          (not self.get_background_assignment_for(backend_assignments, participantA_stream_id)["reserved"])
    )
    
    #now share your video
    share_screen_button = self.get_share_screen_button()
    self.chrome.click_element(share_screen_button)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 4)

    participantB_share_stream_id = participantB_stream_id+"_presentation"

    wait.until(lambda x: 
          (backend_assignments := self.parse_backend_video_trackAssignments(self.call_clearme_debugme()))
          and 
          (3 == len(backend_assignments))
          and
          (not self.get_background_assignment_for(backend_assignments, participantA_share_stream_id)["reserved"])
          and
          (self.get_background_assignment_for(backend_assignments, participantB_share_stream_id)["reserved"])
          and
          (not self.get_background_assignment_for(backend_assignments, participantA_stream_id)["reserved"])
    )


    self.chrome.close_all()

  def get_background_assignment_for(self, backend_assignments, stream_id):
    print("getttt:"+stream_id)
    for assignment in backend_assignments:
        if assignment["assigned_stream_id"] == stream_id:
            return assignment

    return None

  def test_reconnection_while_screen_sharing(self):
    self.chrome.close_all()
    current_dir = os.path.dirname(os.path.abspath(__file__))
    fake_audio_file_path = os.path.join(current_dir, "fake_mic.wav")
    self.chrome = Browser()
    self.chrome.init(not self.is_local, mic_file=fake_audio_file_path)

    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)
    handle_2 = self.join_room_in_new_tab("participantB", room)

    print("current: "+self.chrome.get_current_tab_id())

    assert(handle_2 == self.chrome.get_current_tab_id())

    self.assertLocalVideoAvailable()

    wait = self.chrome.get_wait()

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    participantA_stream_id = self.get_videoTrackAssignments()[1]["streamId"]

    self.chrome.switch_to_tab(handle_1)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    participantB_stream_id = self.get_videoTrackAssignments()[1]["streamId"]

    share_screen_button = self.get_share_screen_button()
    self.chrome.click_element(share_screen_button)

    self.chrome.switch_to_tab(handle_2)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 3)

    participantA_share_stream_id = participantA_stream_id+"_presentation"


    #check first vide track is assigned to A's screen   
    wait.until(lambda x: 
          (backend_assignments := self.parse_backend_video_trackAssignments(self.call_clearme_debugme()))
          and 
          (2 == len(backend_assignments))
          and
          (backend_assignments[0]["assigned_stream_id"] == participantA_share_stream_id)
          and
          (backend_assignments[0]["reserved"])
          and
          (backend_assignments[1]["assigned_stream_id"] == participantA_stream_id)
          and
          (not backend_assignments[1]["reserved"])
    )
    
    self.chrome.switch_to_tab(handle_1)
    self.fake_reconnect()

    wait.until(lambda x: self.chrome.is_element_exist(By.XPATH, "//span[text()='Reconnecting...']"))

    wait.until(lambda x: not self.chrome.is_element_exist(By.XPATH, "//span[text()='Reconnecting...']"))

    self.chrome.switch_to_tab(handle_2)

    print("------------------")

   


    for i in range(20):
      stats = self.get_track_stats()
      assert stats is not None

      for track_stat in stats['inboundRtpList']:  # Access 'inboundRtpList' properly
          if 'trackIdentifier' in track_stat and track_stat['trackIdentifier'] == "ARDAMSvvideoTrack0":
            print("* framesReceived: " + str(track_stat['framesReceived']))
            assert track_stat['framesReceived'] > 0
      time.sleep(2)


    self.chrome.close_all()




  def test_join_room_N_participants(self):
    self.chrome.makeFullScreen()
    N = 5
    room = "room"+str(random.randint(100, 999))
    wait = self.chrome.get_wait(30, 3)

    process = self.create_participants_with_test_tool("participant", room, N-1)

    self.join_room_in_new_tab("participant"+str(N-1), room)     

    self.assertLocalVideoAvailable()

    print("len(self.get_videoTrackAssignments()): "+str(len(self.get_videoTrackAssignments())))
    print("N: "+str(N))
    print("**********************************************")
    wait.until(lambda x: len(self.get_videoTrackAssignments(5)) == N)


    print("screen shot 1 start: default")
    #self.chrome.print_ss_as_base64()
    self.chrome.save_ss_as_file("shot-1.png")
    print("screen shot 1 end: default")

    # Print the current working directory
    print("Current Directory:", os.getcwd())

    # List all files in the current directory
    files = os.listdir()
    print("Files in Directory:", files)


    self.set_and_test_tile_count(4)  
  
    wait.until(lambda x: len(self.get_videoTrackAssignments(3)) == 3) 

    print("screen shot 2 start: 4")
    #self.chrome.print_ss_as_base64()
    self.chrome.save_ss_as_file("shot-2.png")
    print("screen shot 2 end: default")  

    # TODO: sometimes it doesn't work, check it
    #self.set_and_test_tile_count(6)
    

    #wait.until(lambda x: len(self.get_videoTrackAssignments(5)) == N)

    print("screen shot 3 start: 6")
    #self.chrome.print_ss_as_base64()
    self.chrome.save_ss_as_file("shot-3.png")
    print("screen shot 3 end: 6")


    self.kill_participants_with_test_tool(process)
    self.chrome.close_all()

  def test_get_debugme_info(self):
    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)
    handle_2 = self.join_room_in_new_tab("participantB", room)

    print("current: "+self.chrome.get_current_tab_id())
    assert(handle_2 == self.chrome.get_current_tab_id())
    self.assertLocalVideoAvailable()
    wait = self.chrome.get_wait()
    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    self.call_debugme()
    time.sleep(5)
    self.print_message()

    self.chrome.close_all()


  def is_avatar_displayed_for(self, stream_id):
    video_card = self.chrome.get_element(By.ID, "card-"+stream_id)
    return self.chrome.is_nested_element_exist(video_card, By.CLASS_NAME, "MuiAvatar-root")
  
  def is_video_displayed_for(self, stream_id):
    video_tag = self.chrome.get_element(By.ID, stream_id)
    return video_tag.is_displayed()
  
  def is_mic_off_displayed_for(self, stream_id):
    return self.chrome.is_element_exist(By.ID, "mic-muted-"+stream_id)
 
  def test_on_off_mic_cam(self):
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
   


  def test_recording(self):
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


  #FIXME test in headles mode
  def _test_tiled_layout_test(self):
    self.chrome.makeFullScreen()
    room = "room"+str(random.randint(100, 999))
    wait = self.chrome.get_wait(30, 3)

    self.join_room_in_new_tab("participant"+str(random.randint(100, 999)), room)     
    self.assertLocalVideoAvailable()

    #add 3 participants, check video track assignments size is 4=1+3, then remove
    process = self.create_participants_with_test_tool("participant", room, 3)
    wait.until(lambda x: len(self.get_videoTrackAssignments(4)) == 4)
    self.kill_participants_with_test_tool(process)

    #check video track assignments size is 1
    wait.until(lambda x: len(self.get_videoTrackAssignments(1)) == 1)

    #set video tile count 4
    self.set_and_test_tile_count(4)  

    #add 3 participants, check video track assignments size is 4=1+3, then remove
    process = self.create_participants_with_test_tool("participant", room, 3)
    wait.until(lambda x: len(self.get_videoTrackAssignments(4)) == 4)
    self.kill_participants_with_test_tool(process)

    #add 4 participants, check video track assignments size is 3=1+2 one tile is for others
    process = self.create_participants_with_test_tool("participant", room, 4)
    wait.until(lambda x: len(self.get_videoTrackAssignments(3)) == 3)

    #set video tile count 6
    self.set_and_test_tile_count(6)  

    #add 3 participants, check video track assignments size is 4=1+3, then remove
    wait.until(lambda x: len(self.get_videoTrackAssignments(5)) == 5)

    #remove participants
    self.kill_participants_with_test_tool(process)
  
 
    self.chrome.close_all()

  #FIXME: rerun test
  def _test_pinned_layout_test(self):
    self.chrome.makeFullScreen()
    room = "room"+str(random.randint(100, 999))
    wait = self.chrome.get_wait(30, 3)

    self.join_room_in_new_tab("participant"+str(random.randint(100, 999)), room)     
    self.assertLocalVideoAvailable()

    self.set_layout("sidebar")

    #add 4 participants, check video track assignments size is 5=1+4, then remove
    process = self.create_participants_with_test_tool("participant", room, 4)
    wait.until(lambda x: len(self.get_videoTrackAssignments(5)) == 5)
    self.kill_participants_with_test_tool(process)

    #check video track assignments size is 1
    wait.until(lambda x: len(self.get_videoTrackAssignments(1)) == 1)

    #add 5 participants, check video track assignments size is 4=1+3, one tile is for others then remove
    process = self.create_participants_with_test_tool("participant", room, 5)
    wait.until(lambda x: len(self.get_videoTrackAssignments(4)) == 4)
    self.kill_participants_with_test_tool(process)

    #set video tile count 4
    self.set_and_test_tile_count(4)  

    #add 3 participants, check video track assignments size is 4=1+3, then remove
    process = self.create_participants_with_test_tool("participant", room, 3)
    wait.until(lambda x: len(self.get_videoTrackAssignments(4)) == 4)
    self.kill_participants_with_test_tool(process)

    #add 4 participants, check video track assignments size is 3=1+2 one tile is for others
    process = self.create_participants_with_test_tool("participant", room, 4)
    wait.until(lambda x: len(self.get_videoTrackAssignments(3)) == 3)

    #set video tile count 6
    self.set_and_test_tile_count(6)  

    #add 3 participants, check video track assignments size is 3=1+4 then remove
    wait.until(lambda x: len(self.get_videoTrackAssignments(5)) == 5)

    self.set_layout("tiled")

    wait.until(lambda x: len(self.get_videoTrackAssignments(5)) == 5)

    #remove participants
    self.kill_participants_with_test_tool(process)
  
 
    self.chrome.close_all()

  #FIXME: the buttons are appears on mouse hovers the card. This causes some issue in headless mode 
  def _test_pin_on_video_card(self):
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

    wait.until(lambda x: len(self.chrome.get_all_elements(By.CSS_SELECTOR, "div.single-video-container.not-pinned")) == 2)

    #pin yourself
    print("pin participantA")
    participantA_video_card = self.get_video_container_by_stream_name("participantA")
    self.chrome.move_to_element(participantA_video_card)
    participantA_pin_button = self.chrome.get_element_in_element(participantA_video_card, By.XPATH, ".//button[@type='button' and @aria-label='pin']", wait_until_clickable=False)
    participantA_pin_button.click()
   

    wait.until(lambda x: self.chrome.is_element_exist(By.CSS_SELECTOR, "div.single-video-container.pinned"))

    pinned_video_card = self.chrome.get_element_with_retry(By.CSS_SELECTOR, "div.single-video-container.pinned")
    inner_html = pinned_video_card.get_attribute("innerHTML") 
    assert ("participantA" in inner_html)

    #unpin yourself
    print("unpin participantA")
    participantA_video_card = self.get_video_container_by_stream_name("participantA")
    self.chrome.move_to_element(participantA_video_card)
    participantA_unpin_button = self.chrome.get_element_in_element(participantA_video_card, By.XPATH, ".//button[@type='button' and @aria-label='unpin']")
    participantA_unpin_button.click()

    wait.until(lambda x: not self.chrome.is_element_exist(By.CSS_SELECTOR, "div.single-video-container.pinned"))

    #pin participantB
    print("pin participantB")
    participantB_video_card = self.get_video_container_by_stream_name("participantB")
    print("participantB_video_card:"+participantB_video_card.get_attribute("innerHTML"))
    self.chrome.move_to_element(participantB_video_card)
    participantB_pin_button = self.chrome.get_element_in_element(participantB_video_card, By.XPATH, ".//button[@type='button' and @aria-label='pin']")
    button_position = self.chrome.execute_script("return arguments[0].getBoundingClientRect();", participantB_pin_button)
    print("Button position:", button_position)
    time.sleep(1)
    participantB_pin_button.click()


    wait.until(lambda x: self.chrome.is_element_exist(By.CSS_SELECTOR, "div.single-video-container.pinned"))

    pinned_video_card = self.chrome.get_element_with_retry(By.CSS_SELECTOR, "div.single-video-container.pinned")
    inner_html = pinned_video_card.get_attribute("innerHTML") 
    assert ("participantB" in inner_html)

    #check if reserved true
    debug_info = self.call_clearme_debugme()
    backend_assignments = self.parse_backend_video_trackAssignments(debug_info)
    assert(1 == len(backend_assignments))
    assert(backend_assignments[0]["reserved"])
    
    #unpin participantB
    print("unpin participantB")
    participantB_video_card = self.get_video_container_by_stream_name("participantB")
    self.chrome.move_to_element(participantB_video_card)
    participantB_unpin_button = self.chrome.get_element_in_element(participantB_video_card, By.XPATH, ".//button[@type='button' and @aria-label='unpin']")
    participantB_unpin_button.click()

    wait.until(lambda x: not self.chrome.is_element_exist(By.CSS_SELECTOR, "div.single-video-container.pinned"))

    #check if reserved false
    debug_info = self.call_clearme_debugme()
    print("debug info:"+debug_info)
    backend_assignments = self.parse_backend_video_trackAssignments(debug_info)
    assert(1 == len(backend_assignments))
    assert(False == backend_assignments[0]["reserved"])
    
    #pin yourself
    participantA_video_card = self.get_video_container_by_stream_name("participantA")
    self.chrome.move_to_element(participantA_video_card)
    participantA_pin_button = self.chrome.get_element_in_element(participantA_video_card, By.XPATH, ".//button[@type='button' and @aria-label='pin']")
    participantA_pin_button.click()

    pinned_video_card = self.chrome.get_element_with_retry(By.CSS_SELECTOR, "div.single-video-container.pinned")
    inner_html = pinned_video_card.get_attribute("innerHTML") 
    assert ("participantA" in inner_html)

    #pin participantB
    participantB_video_card = self.get_video_container_by_stream_name("participantB")
    self.chrome.move_to_element(participantB_video_card)
    participantB_pin_button = self.chrome.get_element_in_element(participantB_video_card, By.XPATH, ".//button[@type='button' and @aria-label='pin']")
    participantB_pin_button.click()

    pinned_video_card = self.chrome.get_element_with_retry(By.CSS_SELECTOR, "div.single-video-container.pinned")
    inner_html = pinned_video_card.get_attribute("innerHTML") 
    assert ("participantB" in inner_html)
  
 
    self.chrome.close_all()
  


  def test_pin_on_participant_list(self):
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

    wait.until(lambda x: len(self.chrome.get_all_elements(By.CSS_SELECTOR, "div.single-video-container.not-pinned")) == 2)

    self.open_close_participant_list_drawer()

    #pin yourself
    participantA_pin_button = self.chrome.get_element_with_retry(By.XPATH, "//button[starts-with(@id, 'pin-participantA_')]")
    participantA_pin_button.click()
    wait.until(lambda x: self.chrome.is_element_exist(By.CSS_SELECTOR, "div.single-video-container.pinned"))

    pinned_video_card = self.chrome.get_element_with_retry(By.CSS_SELECTOR, "div.single-video-container.pinned")
    inner_html = pinned_video_card.get_attribute("innerHTML") 
    assert ("participantA" in inner_html)

    #unpin yourself
    participantA_unpin_button = self.chrome.get_element_with_retry(By.XPATH, "//button[starts-with(@id, 'unpin-participantA_')]")
    participantA_unpin_button.click()

    wait.until(lambda x: not self.chrome.is_element_exist(By.CSS_SELECTOR, "div.single-video-container.pinned"))


    #pin participantB
    participantB_pin_button = self.chrome.get_element_with_retry(By.XPATH, "//button[starts-with(@id, 'pin-participantB_')]")
    participantB_pin_button.click()

    pinned_video_card = self.chrome.get_element_with_retry(By.CSS_SELECTOR, "div.single-video-container.pinned")
    inner_html = pinned_video_card.get_attribute("innerHTML") 
    assert ("participantB" in inner_html)

    #check if reserved true
    debug_info = self.call_clearme_debugme()
    backend_assignments = self.parse_backend_video_trackAssignments(debug_info)
    assert(1 == len(backend_assignments))
    assert(backend_assignments[0]["reserved"])

    self.open_close_participant_list_drawer()


    #unpin participantB
    participantB_unpin_button = self.chrome.get_element_with_retry(By.XPATH, "//button[starts-with(@id, 'unpin-participantB_')]")
    participantB_unpin_button.click()


    wait.until(lambda x: not self.chrome.is_element_exist(By.CSS_SELECTOR, "div.single-video-container.pinned"))

    #check if reserved false
    debug_info = self.call_clearme_debugme()
    print("debug info:"+debug_info)
    backend_assignments = self.parse_backend_video_trackAssignments(debug_info)
    assert(1 == len(backend_assignments))
    assert(False == backend_assignments[0]["reserved"])
    
    #### Now we will test pinning other while I am pinned

    self.open_close_participant_list_drawer()

    #pin yourself
    participantA_unpin_button = self.chrome.get_element_with_retry(By.XPATH, "//button[starts-with(@id, 'pin-participantA_')]")
    participantA_pin_button.click()
    wait.until(lambda x: self.chrome.is_element_exist(By.CSS_SELECTOR, "div.single-video-container.pinned"))

    pinned_video_card = self.chrome.get_element_with_retry(By.CSS_SELECTOR, "div.single-video-container.pinned")
    inner_html = pinned_video_card.get_attribute("innerHTML") 
    assert ("participantA" in inner_html)


    #pin participantB
    participantB_pin_button = self.chrome.get_element_with_retry(By.XPATH, "//button[starts-with(@id, 'pin-participantB_')]")
    participantB_pin_button.click()

    pinned_video_card = self.chrome.get_element_with_retry(By.CSS_SELECTOR, "div.single-video-container.pinned")
    inner_html = pinned_video_card.get_attribute("innerHTML") 
    assert ("participantB" in inner_html)

    self.chrome.close_all()

  def test_mute_on_video_card(self):
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

    wait.until(lambda x: len(self.chrome.get_all_elements(By.CSS_SELECTOR, "div.single-video-container.not-pinned")) == 2)

    participantB_video_card = self.get_video_container_by_stream_name("participantB")

    #check muted icon is not visible
    assert(not self.chrome.is_nested_element_exist(participantB_video_card, By.XPATH, ".//div[@aria-label='mic is muted']"))

    #move mouse to make overlay buttons visible
    self.chrome.move_to_element(participantB_video_card)

    #mute participantB
    mute_button = self.chrome.get_element_in_element(participantB_video_card, By.XPATH, ".//button[@type='button' and @aria-label='mute']")
    mute_button.click()

    '''
    #accept mute
    wait.until(lambda x: self.chrome.is_element_exist(By.XPATH, "//button[text()='Mute']"))
    mute_accept_button = self.chrome.get_element_with_retry(By.XPATH, "//button[text()='Mute']")
    mute_accept_button.click()
    '''

    #check muted icon will be visible
    wait.until(lambda x: self.chrome.get_element_in_element(participantB_video_card, By.XPATH, ".//div[@aria-label='mic is muted']") is not None)

    #switch participantB tab and open mic
    self.chrome.switch_to_tab(handle_2)
    mic = self.chrome.get_element(By.ID, "mic-button")
    self.chrome.click_element(mic)

    #switch participantA tab and check muted icon is not visible
    self.chrome.switch_to_tab(handle_1)
    participantB_video_card = self.get_video_container_by_stream_name("participantB")
    wait.until(lambda x: not self.chrome.is_nested_element_exist(participantB_video_card, By.XPATH, "//div[@aria-label='mic is muted']"))

    self.chrome.close_all()

  def test_talking_people_frame(self):
    self.chrome.close_all()
    current_dir = os.path.dirname(os.path.abspath(__file__))
    fake_audio_file_path = os.path.join(current_dir, "fake_mic.wav")
    self.chrome = Browser()
    self.chrome.init(not self.is_local, mic_file=fake_audio_file_path)

    wait = self.chrome.get_wait()

    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)
    handle_2 = self.join_room_in_new_tab("participantB", room)

    print("current: "+self.chrome.get_current_tab_id())

    assert(handle_2 == self.chrome.get_current_tab_id())

    self.assertLocalVideoAvailable()

    participantA_stream_id = self.get_videoTrackAssignments()[1]["streamId"]

    self.chrome.switch_to_tab(handle_1)

    wait.until(lambda x: 
          (len(self.get_videoTrackAssignments()) == 2)
          and
          (self.get_videoTrackAssignments()[1]["streamId"].startswith("participantB"))
    )

    participantB_stream_id = self.get_videoTrackAssignments()[1]["streamId"]

    self.set_audio_level(1)

    self.chrome.switch_to_tab(handle_1)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    wait.until(lambda x: len(self.chrome.get_all_elements(By.CSS_SELECTOR, "div.single-video-container.not-pinned")) == 2)


    #switch participantA tab check green frame appear    
    talking_indicator = self.chrome.get_element(By.ID, participantB_stream_id+"-is-talking")
    wait.until(lambda x: talking_indicator.is_displayed())

    #switch participantB tab and mute
    self.chrome.switch_to_tab(handle_2)
    mic = self.chrome.get_element(By.ID, "mic-button")
    self.chrome.click_element(mic)
    
    #switch participantA tab check green frame disappear
    self.chrome.switch_to_tab(handle_1)
    talking_indicator = self.chrome.get_element(By.ID, participantB_stream_id+"-is-talking")
    wait.until(lambda x: not talking_indicator.is_displayed())

    self.chrome.close_all()

    
  def test_video_track_assignment(self):
    self.chrome.close_all()
    current_dir = os.path.dirname(os.path.abspath(__file__))
    fake_audio_file_path = os.path.join(current_dir, "fake_mic.wav")
    self.chrome = Browser()
    self.chrome.init(not self.is_local, mic_file=fake_audio_file_path)

    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)
    handle_2 = self.join_room_in_new_tab("participantB", room)
    self.change_tile_count(2)
    handle_3 = self.join_room_in_new_tab("participantC", room)
    self.change_tile_count(2)
    handle_4 = self.join_room_in_new_tab("participantD", room)
    self.change_tile_count(2)
    self.set_audio_level(0.1)
    handle_5 = self.join_room_in_new_tab("participantE", room)
    self.change_tile_count(2)
    self.set_audio_level(0.1)


    wait = self.chrome.get_wait()
    self.chrome.switch_to_tab(handle_1)
    wait.until(lambda x: len(self.get_videoTrackAssignments(5)) == 5)
    
    self.change_tile_count(4)

    wait.until(lambda x: len(self.get_videoTrackAssignments(3)) == 3) #1(you)+2(videos)+1(other)=4 tiles => 3 video tracks (don't count others)
    
    #check 2 video track assigned to B or C (because D and E have silent audio)
    wait.until(lambda x: 
      (backend_assignments := self.parse_backend_video_trackAssignments(self.call_clearme_debugme()))
      and 
      (2 == len(backend_assignments))
      and
      (
        backend_assignments[0]["assigned_stream_id"].startswith("participantB") 
        or 
        backend_assignments[0]["assigned_stream_id"].startswith("participantC")
      )
      and 
      (
        backend_assignments[1]["assigned_stream_id"].startswith("participantB") 
        or 
        backend_assignments[1]["assigned_stream_id"].startswith("participantC")
      )
      )

    #change audio levels: B and C are 0.1 ; D and E are 1
    self.chrome.switch_to_tab(handle_2)
    self.set_audio_level(0.1)
    self.chrome.switch_to_tab(handle_3)
    self.set_audio_level(0.1)
    self.chrome.switch_to_tab(handle_4)
    self.set_audio_level(1)
    self.chrome.switch_to_tab(handle_5)
    self.set_audio_level(1)

    self.chrome.switch_to_tab(handle_1)
 
    #check 2 video track assigned to D or E (because B and C have silent audio)
    wait.until(lambda x:  
      (backend_assignments := self.parse_backend_video_trackAssignments(self.call_clearme_debugme()))
      and 
      (2 == len(backend_assignments))
      and
      (
        backend_assignments[0]["assigned_stream_id"].startswith("participantD") 
        or 
        backend_assignments[0]["assigned_stream_id"].startswith("participantE")
      )
      and 
      (
        backend_assignments[1]["assigned_stream_id"].startswith("participantD") 
        or 
        backend_assignments[1]["assigned_stream_id"].startswith("participantE")
      )
      )

    self.chrome.close_all()


  def test_camera_mic_setting_in_meeting_room(self):
    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)

    more_options_button = self.chrome.get_element_with_retry(By.ID, "settings-button")
    more_options_button.click()

    time.sleep(1)

    call_settings_button = self.chrome.get_element(By.ID, "call-settings")
    self.chrome.mouse_click_on(call_settings_button)

    camera_select = self.chrome.get_element_with_retry(By.ID, "setting-dialog-camera-select")
    self.chrome.mouse_click_on(camera_select)

    camera = self.chrome.get_element_with_retry(By.XPATH, "//li[contains(text(), 'fake_device_0')]")
    self.chrome.mouse_click_on(camera)

    resolution_select = self.chrome.get_element_with_retry(By.ID, "setting-dialog-resolution-select")
    self.chrome.mouse_click_on(resolution_select)

    time.sleep(1)

    resolution = self.chrome.get_element_with_retry(By.XPATH, "//li[contains(text(), 'Low definition (180p)')]")
    self.chrome.mouse_click_on(resolution)

    mic_select = self.chrome.get_element_with_retry(By.ID, "setting-dialog-mic-select")
    self.chrome.mouse_click_on(mic_select)

    time.sleep(1)

    self.chrome.save_ss_as_file("test_camera_mic_setting_in_meeting_room-1.png")

    if self.chrome.is_element_exist(By.XPATH, "//li[contains(text(), 'Fake Audio Input 2')]"):
      mic = self.chrome.get_element_with_retry(By.XPATH, "//li[contains(text(), 'Fake Audio Input 2')]")
      self.chrome.mouse_click_on(mic)

    close_button = self.chrome.get_element_with_retry(By.CSS_SELECTOR, "button[aria-label='close']")
    close_button.click()
 
    meeting_gallery = self.chrome.get_element_with_retry(By.ID, "meeting-gallery")
    assert(meeting_gallery.is_displayed())

    self.chrome.close_all()

  def _test_chat_messages(self):
    message_A = "hello from A"
    message_B = "hello from B"
    message_C = "hello from C"


    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)
    handle_2 = self.join_room_in_new_tab("participantB", room)
    handle_3 = self.join_room_in_new_tab("participantC", room, play_only=True)

    self.assertLocalVideoAvailable()

    wait = self.chrome.get_wait()
    #VTA counts should be 2, because C is play only
    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    self.chrome.switch_to_tab(handle_2)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    self.chrome.switch_to_tab(handle_1)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)


    #send message from A
    self.send_message(message_A)
    messages = self.chrome.get_all_elements(By.ID, "message")
    last_message = messages[-1]
    assert(message_A in last_message.get_attribute("innerHTML"))

    time.sleep(1)

    #check messages on B and C
    self.chrome.switch_to_tab(handle_2)
    messages = self.chrome.get_all_elements(By.ID, "message")
    last_message = messages[-1]
    assert(message_A in last_message.get_attribute("innerHTML"))

    time.sleep(1)

    self.chrome.switch_to_tab(handle_3)
    messages = self.chrome.get_all_elements(By.ID, "message")
    last_message = messages[-1]
    assert(message_A in last_message.get_attribute("innerHTML"))

    time.sleep(1)

    #send message from B
    self.chrome.switch_to_tab(handle_2)
    self.send_message(message_B)
    messages = self.chrome.get_all_elements(By.ID, "message")
    last_message = messages[-1]
    assert(message_B in last_message.get_attribute("innerHTML"))

    time.sleep(1)

    #check messages on A and C
    self.chrome.switch_to_tab(handle_2)
    messages = self.chrome.get_all_elements(By.ID, "message")
    last_message = messages[-1]
    assert(message_B in last_message.get_attribute("innerHTML"))

    time.sleep(1)

    self.chrome.switch_to_tab(handle_3)
    messages = self.chrome.get_all_elements(By.ID, "message")
    last_message = messages[-1]
    assert(message_B in last_message.get_attribute("innerHTML"))

    time.sleep(1)

    #send message from C
    self.send_message(message_C)
    messages = self.chrome.get_all_elements(By.ID, "message")
    last_message = messages[-1]
    assert(message_C in last_message.get_attribute("innerHTML"))

    time.sleep(1)

    #check messages on A and B
    self.chrome.switch_to_tab(handle_1)
    messages = self.chrome.get_all_elements(By.ID, "message")
    last_message = messages[-1]
    assert(message_C in last_message.get_attribute("innerHTML"))

    time.sleep(1)

    self.chrome.switch_to_tab(handle_2)
    messages = self.chrome.get_all_elements(By.ID, "message")
    last_message = messages[-1]
    assert(message_C in last_message.get_attribute("innerHTML"))    

    
    self.chrome.close_all()

  #FIXME: test in headless mode
  def _test_reactions(self):
    reaction_A = "💖"
    reaction_B = "🤔"
    reaction_C = "🎉"


    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)
    handle_2 = self.join_room_in_new_tab("participantB", room)
    handle_3 = self.join_room_in_new_tab("participantC", room, play_only=True)

    self.assertLocalVideoAvailable()

    wait = self.chrome.get_wait()
    #VTA counts should be 2, because C is play only
    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    self.chrome.switch_to_tab(handle_2)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)

    self.chrome.switch_to_tab(handle_1)

    wait.until(lambda x: len(self.get_videoTrackAssignments()) == 2)


    #send reaction from A
    self.send_reaction(reaction_A)
    wait.until(lambda x: self.chrome.is_element_displayed(By.XPATH, f"//div[text()='{reaction_A}']/br/following-sibling::span[text()='You']"))
    
    #check messages on B and C
    self.chrome.switch_to_tab(handle_2)
    wait.until(lambda x: self.chrome.is_element_displayed(By.XPATH, f"//div[text()='{reaction_A}']/br/following-sibling::span[text()='participantA']"))
    self.chrome.switch_to_tab(handle_3)
    wait.until(lambda x: self.chrome.is_element_displayed(By.XPATH, f"//div[text()='{reaction_A}']/br/following-sibling::span[text()='participantA']"))

    time.sleep(1)

    #send reaction from B
    self.chrome.switch_to_tab(handle_2)
    self.send_reaction(reaction_B)
    wait.until(lambda x: self.chrome.is_element_displayed(By.XPATH, f"//div[text()='{reaction_B}']/br/following-sibling::span[text()='You']"))
    
    #check messages on A and C
    self.chrome.switch_to_tab(handle_1)
    wait.until(lambda x: self.chrome.is_element_displayed(By.XPATH, f"//div[text()='{reaction_B}']/br/following-sibling::span[text()='participantB']"))
    self.chrome.switch_to_tab(handle_3)
    wait.until(lambda x: self.chrome.is_element_displayed(By.XPATH, f"//div[text()='{reaction_B}']/br/following-sibling::span[text()='participantB']"))

    time.sleep(1)

    #send reaction from C
    self.send_reaction(reaction_C)
    wait.until(lambda x: self.chrome.is_element_displayed(By.XPATH, f"//div[text()='{reaction_C}']/br/following-sibling::span[text()='You']"))
    
    #check messages on A and B
    self.chrome.switch_to_tab(handle_1)
    wait.until(lambda x: self.chrome.is_element_displayed(By.XPATH, f"//div[text()='{reaction_C}']/br/following-sibling::span[text()='participantC']"))
    self.chrome.switch_to_tab(handle_2)
    wait.until(lambda x: self.chrome.is_element_displayed(By.XPATH, f"//div[text()='{reaction_C}']/br/following-sibling::span[text()='participantC']"))

    self.chrome.close_all()


  def test_background_replacement(self):
    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)

    more_options_button = self.chrome.get_element_with_retry(By.ID, "settings-button")
    more_options_button.click()

    time.sleep(1)

    virtual_effects_button = self.chrome.get_element(By.ID, "virtual-effects")
    self.chrome.mouse_click_on(virtual_effects_button)

    time.sleep(1)

    wait = self.chrome.get_wait()
    wait.until(lambda x: self.chrome.is_element_exist(By.ID, "slight-blur-button"))

    slight_blur_button = self.chrome.get_element(By.ID, "slight-blur-button")
    slight_blur_button.click()

    time.sleep(5)

    blur_button = self.chrome.get_element(By.ID, "blur-button")
    blur_button.click()

    time.sleep(5)

    '''
    custom_background_button = self.chrome.get_element(By.ID, "custom-virtual-background-button")
    custom_background_button.click()

    time.sleep(5)

    remove_effect_button = self.chrome.get_element(By.ID, "remove-effect-button")
    remove_effect_button.click() 
    '''
  
    meeting_gallery = self.chrome.get_element_with_retry(By.ID, "meeting-gallery")
    assert(meeting_gallery.is_displayed())

    self.chrome.close_all()

  def rgb_to_hex(self, rgb_string):
    # Extract RGB values from the string
    rgb_values = [int(x) for x in rgb_string.replace("rgb(", "").replace(")", "").split(",")]
    # Convert to hex and return
    color = "#{:02X}{:02X}{:02X}".format(*rgb_values)
    print ("background_color:"+color)
    return color


  def test_theme(self):
    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)

    more_options_button = self.chrome.get_element_with_retry(By.ID, "settings-button")
    more_options_button.click()

    time.sleep(1)

    general_button = self.chrome.get_element(By.ID, "general-button")
    self.chrome.mouse_click_on(general_button)

    theme_select = self.chrome.get_element(By.ID, "theme-select")
    self.chrome.mouse_click_on(theme_select)

    green = self.chrome.get_element(By.XPATH, "//li[@data-value='green']")
    self.chrome.mouse_click_on(green)

    meeting_gallery = self.chrome.get_element_with_retry(By.TAG_NAME, "body")
    background_color = self.chrome.execute_script("return window.getComputedStyle(arguments[0]).backgroundColor;", meeting_gallery)
    assert("#001D1A" == self.rgb_to_hex(background_color))

    theme_select = self.chrome.get_element(By.ID, "theme-select")
    self.chrome.mouse_click_on(theme_select)

    time.sleep(1)

    blue = self.chrome.get_element(By.XPATH, "//li[@data-value='blue']")
    self.chrome.mouse_click_on(blue)

    time.sleep(1)


    meeting_gallery = self.chrome.get_element_with_retry(By.TAG_NAME, "body")
    background_color = self.chrome.execute_script("return window.getComputedStyle(arguments[0]).backgroundColor;", meeting_gallery)
    assert("#00838F" == self.rgb_to_hex(background_color))

    theme_select = self.chrome.get_element(By.ID, "theme-select")
    self.chrome.mouse_click_on(theme_select)

    time.sleep(1)

    gray = self.chrome.get_element(By.XPATH, "//li[@data-value='gray']")
    self.chrome.mouse_click_on(gray)

    time.sleep(1)

    meeting_gallery = self.chrome.get_element_with_retry(By.TAG_NAME, "body")
    background_color = self.chrome.execute_script("return window.getComputedStyle(arguments[0]).backgroundColor;", meeting_gallery)
    assert("#424242" == self.rgb_to_hex(background_color))

    theme_select = self.chrome.get_element(By.ID, "theme-select")
    self.chrome.mouse_click_on(theme_select)

    time.sleep(1)

    white = self.chrome.get_element(By.XPATH, "//li[@data-value='white']")
    self.chrome.mouse_click_on(white)

    time.sleep(1)

    meeting_gallery = self.chrome.get_element_with_retry(By.TAG_NAME, "body")
    background_color = self.chrome.execute_script("return window.getComputedStyle(arguments[0]).backgroundColor;", meeting_gallery)
    assert("#FFFFFF" == self.rgb_to_hex(background_color))

    theme_select = self.chrome.get_element(By.ID, "theme-select")
    self.chrome.mouse_click_on(theme_select)

    time.sleep(1)

    green = self.chrome.get_element(By.XPATH, "//li[@data-value='green']")
    self.chrome.mouse_click_on(green)

    time.sleep(1)

    meeting_gallery = self.chrome.get_element_with_retry(By.TAG_NAME, "body")
    background_color = self.chrome.execute_script("return window.getComputedStyle(arguments[0]).backgroundColor;", meeting_gallery)
    assert("#001D1A" == self.rgb_to_hex(background_color))


    self.chrome.close_all()


  def test_language(self):
    room = "room"+str(random.randint(100, 999))
    handle_1 = self.join_room_in_new_tab("participantA", room)

    more_options_button = self.chrome.get_element_with_retry(By.ID, "settings-button")
    more_options_button.click()

    time.sleep(3)

    general_button = self.chrome.get_element(By.ID, "general-button")
    self.chrome.mouse_click_on(general_button)

    lang_select = self.chrome.get_element(By.ID, "language-select")
    self.chrome.mouse_click_on(lang_select)

    time.sleep(3)

    en = self.chrome.get_element(By.XPATH, "//li[@data-value='en']")
    self.chrome.mouse_click_on(en)

    assert(self.chrome.is_element_exist(By.XPATH, "//label[text()='Language']"))

    lang_select = self.chrome.get_element(By.ID, "language-select")
    self.chrome.mouse_click_on(lang_select)

    time.sleep(3)

    tr = self.chrome.get_element(By.XPATH, "//li[@data-value='tr']")
    self.chrome.mouse_click_on(tr)

    assert(self.chrome.is_element_exist(By.XPATH, "//label[text()='Dil']"))

    lang_select = self.chrome.get_element(By.ID, "language-select")
    self.chrome.mouse_click_on(lang_select)

    time.sleep(3)

    es = self.chrome.get_element(By.XPATH, "//li[@data-value='es']")
    self.chrome.mouse_click_on(es)

    assert(self.chrome.is_element_exist(By.XPATH, "//label[text()='Idioma']"))

    lang_select = self.chrome.get_element(By.ID, "language-select")
    self.chrome.mouse_click_on(lang_select)

    time.sleep(3)

    fr = self.chrome.get_element(By.XPATH, "//li[@data-value='fr']")
    self.chrome.mouse_click_on(fr)

    assert(self.chrome.is_element_exist(By.XPATH, "//label[text()='Langue']"))

    lang_select = self.chrome.get_element(By.ID, "language-select")
    self.chrome.mouse_click_on(lang_select)

    time.sleep(3)

    en = self.chrome.get_element(By.XPATH, "//li[@data-value='en']")
    self.chrome.mouse_click_on(en)

    assert(self.chrome.is_element_exist(By.XPATH, "//label[text()='Language']"))
    


    self.chrome.close_all()

if __name__ == '__main__':
    unittest.main()