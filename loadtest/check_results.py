from datetime import datetime

import sys

import signal
import requests
import json
import random
import time

import logging
from logging.handlers import RotatingFileHandler

# Set up rotating file handler to avoid massive log files
file_handler = RotatingFileHandler(
    'artifacts/results.log',
    maxBytes=1024 * 1024 * 5,  # 5 MB
    backupCount=3  # Keep up to 3 backup log files
)

# Configure the file handler
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))

# Create the logger and add the handler
logger = logging.getLogger('MyAppLogger')
logger.addHandler(file_handler)
logger.setLevel(logging.DEBUG)  # Log everything from DEBUG and higher
 
logger.info("Check Result started to run")

no_of_pods = int(sys.argv[1])

logger.info("number of pods "+str(no_of_pods))


URL="https://meet.antmedia.io"
REST_URL=URL+"/rest/v2"

session = requests.Session()


def login():
  resp = session.post(REST_URL+"/users/authenticate", json={"email":"test@antmedia.io","password":"05a671c66aefea124cc08b76ea6d30bb"})
  logger.info("resp:"+str(resp))

def getBroadcasts():
  resp = session.get(REST_URL+"/request?_path=Conference/rest/v2/broadcasts/list/0/50")
  jsonData = json.loads(resp.text)
  size = len(jsonData)
  total = 0
  for item in jsonData:
    viewer = item["webRTCViewerCount"]
    #print viewer
    total += viewer
  logger.info("total publishers:"+str(size))
  logger.info("total players:"+str(total))

def getBroadcast(streamId):
  resp = session.get(REST_URL+"/request?_path=Conference/rest/v2/broadcasts/"+streamId)
  broadcast = json.loads(resp.text)
  return broadcast

def getActiveBroadcastCount():
  resp = session.get(REST_URL+"/request?_path=Conference/rest/v2/broadcasts/active-live-stream-count")
  jsonData = json.loads(resp.text)
  count = jsonData["number"]
  return count

def callGetAppSettings():
  resp = session.get(REST_URL+"/applications/settings/Conference")
  jsonData = json.loads(resp.text)
  return jsonData

def getResources():
  resp = session.get(REST_URL+"/system-resources")
  resources = json.loads(resp.text)
  cpu = resources["cpuUsage"]["systemCPULoad"]
  inUseMemory = resources["systemMemoryInfo"]["inUseMemory"]
  totalMemory = resources["systemMemoryInfo"]["totalMemory"]
  ram = inUseMemory * 100 / totalMemory
  return cpu, ram

def main():
  logger.info("REST_URL:"+REST_URL)

  login()
  appSettings = callGetAppSettings()
  logger.info("appSettings:"+str(appSettings))
  
  # Calculate the end time (3 minutes from now)
  end_time = time.time() + 3 * 60  # 3 minutes in seconds

  # Loop until current time exceeds the end time
  while time.time() < end_time:
    count = getActiveBroadcastCount()
    mainTrack = getBroadcast("test2")
    viewerCount = mainTrack["webRTCViewerCount"]

    cpu, ram = getResources()

    logger.info("active stream count:" + str(count) + " viewerCount:" + str(viewerCount) + " cpu:" + str(cpu) + " ram:" + str(ram))

    
    # Sleep for 10 seconds
    time.sleep(10)

  logger.info("Check Result ended")

main()
