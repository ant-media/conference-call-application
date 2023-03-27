from browser import Browser
from selenium.webdriver.common.by import By

import sys
import unittest
import os


class TestJoinLeave(unittest.TestCase):
  def setUp(self):
    self.url = os.environ.get('SERVER_URL')
    self.test_app_name = os.environ.get('TEST_APP_NAME')
    self.chrome = Browser()
    self.chrome.init(True)

  def test_join_room(self):
    self.join_room("participantA")
    
  def join_room(self, participant):
    self.chrome.open_in_new_tab(self.url+"/"+self.test_app_name+"/test", participant)
    
    name_text_box = self.chrome.get_element_by_id("participant_name")
    self.chrome.write_to_element(name_text_box, participant)

    join_button = self.chrome.get_element_by_id("room_join_button")
    self.chrome.click_element(join_button)
 
    meeting_gallery = self.chrome.get_element_by_id("meeting-gallery")

    assert(meeting_gallery.is_displayed())

    local_video = meeting_gallery.find_element(By.TAG_NAME, "video")
    assert(local_video.is_displayed())

    self.chrome.close_all()
    

if __name__ == '__main__':
    unittest.main()