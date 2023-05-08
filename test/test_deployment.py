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
    response = self.rest_helper.login()
    assert(response["success"])
    print("logged in")

    
  def test_install_app(self):
    # burak: install app is currently not working through LB
    # so we get first node ip and call install through it
    nodes_json = self.rest_helper.call_get_cluster_nodes()
    print(nodes_json)
    ip_of_first_node = nodes_json[0]["ip"]
    temp_rest_helper = RestHelper("http://"+ip_of_first_node+":5080", self.rest_helper.user, self.rest_helper.password)
    temp_rest_helper.login()

    response = temp_rest_helper.call_install_app(os.environ.get('WAR_FILE'), self.test_app_name)
    print(response)
    assert(response["success"])

  def test_delete_app(self):
    response = self.rest_helper.call_delete_app(self.test_app_name)
    print(response)
    assert(response["success"])
    
if __name__ == '__main__':
    unittest.main()