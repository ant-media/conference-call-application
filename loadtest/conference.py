from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options

from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from datetime import datetime

import sys
import logging
from logging.handlers import RotatingFileHandler

id = str(sys.argv[2])

# Set up rotating file handler to avoid massive log files
file_handler = RotatingFileHandler(
    'artifacts/log_'+id+'.log',
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
 
logger.info("script started to run")

chrome_options = Options()
chrome_options.add_experimental_option("detach", True)
chrome_options.add_argument("--use-fake-ui-for-media-stream") 
chrome_options.add_argument("--use-fake-device-for-media-stream")
chrome_options.add_argument('--log-level=3')

chrome_options.add_argument("--headless")
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--no-sandbox')

#chrome_options.add_argument("--disable-extensions");
#chrome_options.add_argument("--disable-gpu");
#chrome_options.add_argument("--no-sandbox");
#chrome_options.setCapability(CapabilityType.ACCEPT_SSL_CERTS, true);
#chrome_options.setCapability(CapabilityType.ACCEPT_INSECURE_CERTS, true);
#chrome_options.add_argument("--unsafely-treat-insecure-origin-as-secure="+url);


#driver = webdriver.Chrome('./chromedriver')
#driver = webdriver.Chrome('drivers/chromedriver.exe', chrome_options=chrome_options)

selenium_grid_ur = str(sys.argv[1])
cmd_ext = selenium_grid_ur+'/wd/hub'

logger.info("cmd_ext:"+cmd_ext)

driver = webdriver.Remote(
    command_executor=cmd_ext,
    options=chrome_options
  )

logger.info("driver okay")

no_of_paticipants = int(sys.argv[3])

URL="https://meet.antmedia.io"

def openPage(index):
  id_index = id+"_"+str(index)
  logger.info(id+" "+id+" "+id+" "+"******** index:"+id_index+" "+datetime.now().strftime("%H:%M:%S"))
  driver.execute_script("window.open('');")
  driver.switch_to.window(driver.window_handles[index+1])
  driver.get(URL+"/Conference/test2")
  logger.info(driver.title+" "+datetime.now().strftime("%H:%M:%S"))

  timeout = 15
  try:
    element_present = EC.element_to_be_clickable((By.ID, "participant_name"))
    WebDriverWait(driver, timeout).until(element_present)
  except TimeoutException:
    print ("Timed out waiting for page to load")

  ss_name = "artifacts/"+id_index+".png"

  if driver.save_screenshot(ss_name):
    print ("SS recorded as "+ss_name)
  else:
    print ("SS cannot be recorded as "+ss_name)


  logger.info("Login page loaded "+id_index+" "+datetime.now().strftime("%H:%M:%S"))


  participant_name = driver.find_element(By.ID, "participant_name")
  participant_name.send_keys(id_index)

  logger.info("Name entered "+id_index+" "+datetime.now().strftime("%H:%M:%S"))



  join_button = driver.find_element(By.ID, "room_join_button")
  join_button.click()

  logger.info("Join clicked "+id_index+" "+datetime.now().strftime("%H:%M:%S"))


def main():
  for i in range(no_of_paticipants):
    openPage(i)  

main()
