from rest_helper import RestHelper 
import unittest
import sys
import os


class TestDeployment(unittest.TestCase):
  def setUp(self):
    url = os.environ.get('SERVER_URL')
    user = os.environ.get('AMS_USER')
    password = os.environ.get('AMS_PASSWORD')
    self.test_app_name = os.environ.get('TEST_APP_NAME')
    self.rest_helper = RestHelper(url, user, password)
    self.rest_helper.login()
    
  def test_install_app(self):
    response = self.rest_helper.call_install_app(os.environ.get('WAR_FILE'), self.test_app_name)
    print(response)
    assert(response["success"])

  def test_delete_app(self):
    print("burak")
    #response = self.rest_helper.call_delete_app(self.test_app_name)
    #print(response)
    #assert(response["success"])

if __name__ == '__main__':
    unittest.main()
