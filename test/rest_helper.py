from datetime import datetime
import sys
import time
import signal
import requests
import json
import random


REST_URL="/rest/v2"

class RestHelper:
  def __init__(self, url, user, password, app_name):
    self.url = url
    if(url.endswith("localhost:3000")):
      self.url = "http://localhost:5080"
    print("rest url: "+self.url)
    self.user = user
    self.password = password
    self.rest_url = self.url+REST_URL
    self.session = requests.Session()
    self.app_name = app_name

  def login(self):
    resp = self.session.post(self.rest_url + "/users/authenticate", json={"email":self.user,"password":self.password})
    print("login resp:"+str(resp))

  def get_broadcasts(self):
    response = self.session.get(self.rest_url +"/request?_path="+self.app_name+"/rest/v2/broadcasts/list/0/50")
    if response.status_code == 200:
        json_data = json.loads(response.text)
        print("broadcasts:" + str(json_data))
        return json_data
    else:
        response.raise_for_status()

  def getVoDFor(self, streamId):
    resp = self.session.get(self.rest_url +"/request?_path="+self.app_name+"/rest/v2/vods/list/0/5")
    json_data = json.loads(resp.text)
    
    for item in json_data:
      if item["streamId"] == streamId:
        return item
  

  def call_get_app_settings(self, app_name):
    resp = self.session.get(self.rest_url+"/applications/settings/"+app_name)
    json_data = json.loads(resp.text)
    return json_data
  
  def call_set_app_settings(self, app_name, settings_data):
    url = self.rest_url + "/applications/settings/" + app_name
    headers = {
        'Content-Type': 'application/json'
    }
    response = self.session.post(url, headers=headers, json=settings_data)
    
    if response.status_code == 200:
        return json.loads(response.text)
    else:
        response.raise_for_status()

  def call_get_cluster_nodes(self):
    response = self.session.get(self.rest_url+"/cluster/nodes/0/10")
    print ("status code " + str(response.status_code))
    if(response.status_code == 200):
      json_data = json.loads(response.text)
      return json_data

  def call_install_app(self, file, app_name):
    with open(file, 'rb') as f:
      response = self.session.put(self.rest_url+"/applications/"+app_name, files={'file': f})
      print ("status code " + str(response.status_code))
      json_data = json.loads(response.text)
      return json_data

  def call_delete_app(self, app_name):
    response = self.session.delete(self.rest_url+"/applications/"+app_name)
    print ("status code " + str(response.status_code))
    json_data = json.loads(response.text)
    return json_data
