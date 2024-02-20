from browser import Browser
from selenium.webdriver.common.by import By

import sys
import unittest
import os
import random
import json
import time

class TestTestFakeehScenario(unittest.TestCase):
  def setUp(self):
    print(self._testMethodName, " starting...")
    self.url = os.environ.get('SERVER_URL')
    self.test_app_name = os.environ.get('TEST_APP_NAME')
    self.chrome = Browser()
    self.chrome.init(True)

  def tearDown(self):
    print(self._testMethodName, " ending...")

  def join_room_as_admin(self, participant, room):
    print("url: "+self.url+"/"+self.test_app_name+"/"+room)
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    handle = self.chrome.open_in_new_tab(self.url+app+"/"+room+"/?admin=true&streamName="+participant)
    
    #name_text_box = self.chrome.get_element_by_id("participant_name")
    #self.chrome.write_to_element(name_text_box, participant)

    join_button = self.chrome.get_element_by_id("room_join_button")

    time.sleep(5)
    self.chrome.click_element(join_button)

    meeting_gallery = self.chrome.get_element_by_id("meeting-gallery")

    assert(meeting_gallery.is_displayed())

    return handle
  
  def join_room_as_presenter(self, participant, room):
    print("url: "+self.url+"/"+self.test_app_name+"/"+room)
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    handle = self.chrome.open_in_new_tab(self.url+app+"/"+room+"/?streamName="+participant)
    
    #name_text_box = self.chrome.get_element_by_id("participant_name")
    #self.chrome.write_to_element(name_text_box, participant)

    join_button = self.chrome.get_element_by_id("room_join_button")

    time.sleep(5)
    self.chrome.click_element(join_button)
 
    meeting_gallery = self.chrome.get_element_by_id("meeting-gallery")

    assert(meeting_gallery.is_displayed())

    return handle
  
  def join_room_as_player(self, participant, room):
    print("url: "+self.url+"/"+self.test_app_name+"/"+room)
    app = "/"+self.test_app_name
    if self.url.endswith("localhost:3000"):
      app = ""
    handle = self.chrome.open_in_new_tab(self.url+app+"/"+room+"/?playOnly=true&streamName="+participant)
    
    #name_text_box = self.chrome.get_element_by_id("participant_name")
    #self.chrome.write_to_element(name_text_box, participant)

    join_button = self.chrome.get_element_by_id("room_join_button")

    time.sleep(5)
    self.chrome.click_element(join_button)
 
    meeting_gallery = self.chrome.get_element_by_id("meeting-gallery")

    assert(meeting_gallery.is_displayed())

    return handle
  
  def add_presenter_to_listener_room(self, presenter):
    add_button = self.chrome.get_element_by_id("add-presenter-"+presenter)
    self.chrome.click_element(add_button)

  def remove_presenter_from_listener_room(self, presenter):
    remove_button = self.chrome.get_element_by_id("remove-presenter-"+presenter)
    self.chrome.click_element(remove_button)

  def open_close_participant_list_drawer(self):
    participant_list_button = self.chrome.get_element_by_id("participant-list-button")
    self.chrome.click_element(participant_list_button)

  def get_participants(self):
    script = "return window.conference;"
    result_json = self.chrome.execute_script(script)
    if result_json is None:
      return []
    #print("result_json:" + str(result_json))
    print ("participant count:" + str(len(result_json["participants"])))
    return result_json["participants"]
  
  def get_conference(self):
    script = "return window.conference;"
    result_json = self.chrome.execute_script(script)
    if result_json is None:
      return []
    return result_json
  
  def get_id_of_participant(self, name):
    participants = self.get_participants()
    for participant in participants:
      if participant["name"] == name:
        return participant["streamId"]
    return None
  
  def leave_room(self):
    leave_button = self.chrome.get_element_by_id("leave-room-button")
    self.chrome.click_element(leave_button)
  
 
  def test_presenter_room(self):
    room = "room"+str(random.randint(100, 999))
    handle_admin = self.join_room_as_admin("adminA", room)   
    handle_presenter = self.join_room_as_presenter("presenterA", room)

    assert(handle_presenter == self.chrome.get_current_tab_id())

    assert(self.chrome.get_element_by_id("localVideo").is_displayed())

    wait = self.chrome.get_wait(30)

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

    assert(self.chrome.get_element_by_id("localVideo").is_displayed())

    wait = self.chrome.get_wait(30)

    # check if both participants are in the room and see each other
    wait.until(lambda x: len(self.get_participants()) == 2)

    self.chrome.switch_to_tab(handle_admin)

    wait.until(lambda x: len(self.get_participants()) == 2)

    self.chrome.switch_to_tab(handle_presenter)


    # playerA joins to listener room
    handle_player_A = self.join_room_as_player("playerA", room+"listener")
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


    # switch to admin and remove presenter from listener room
    self.chrome.switch_to_tab(handle_admin)

    self.remove_presenter_from_listener_room(presenterId)

    # switch to playerA and check if presenter is removed from listener room
    self.chrome.switch_to_tab(handle_player_A)

    wait.until(lambda x: len(self.get_participants()) == 0)


    self.chrome.close_all()



  

  


if __name__ == '__main__':
    unittest.main()
