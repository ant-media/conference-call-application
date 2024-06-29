from rest_helper import RestHelper 
import unittest
import sys
import os
import time



class TestDeployment(unittest.TestCase):
  def setUp(self):
    print(self._testMethodName, " starting...")
    url = os.environ.get('SERVER_URL')
    user = os.environ.get('AMS_USER')
    password = os.environ.get('AMS_PASSWORD')
    self.test_app_name = os.environ.get('TEST_APP_NAME')
    self.war_file=os.environ.get('WAR_FILE')
    self.rest_helper = RestHelper(url, user, password, None)
    self.rest_helper.login()

  def tearDown(self):
    print(self._testMethodName, " ending...")
    
  def test_install_app(self):
    response = self.rest_helper.call_install_app(self.war_file, self.test_app_name)
    print(response)
    assert(response["success"])
    time.sleep(30)
    app_settings = self.rest_helper.call_get_app_settings(self.test_app_name)
    app_settings["stunServerURI"] = "turn:coturn.antmedia.svc.cluster.local"
    app_settings["turnServerUsername"] = "ovh36"
    app_settings["turnServerCredential"] = "ovh36"
    response = self.rest_helper.call_set_app_settings(self.test_app_name, app_settings)
    assert(response["success"])
    time.sleep(20)
    app_settings = self.rest_helper.call_get_app_settings(self.test_app_name)
    #print("App Settings after:" + str(app_settings))




  def test_delete_app(self):
    response = self.rest_helper.call_delete_app(self.test_app_name)
    print(response)
    assert(response["success"])

if __name__ == '__main__':
    unittest.main()