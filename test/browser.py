from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.alert import Alert
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import StaleElementReferenceException
from selenium.common.exceptions import NoSuchElementException, JavascriptException

from selenium.webdriver import ActionChains

import time
import subprocess

class Browser:
  def init(self, is_headless=True, is_fake_camera=True, mic_file=None):
    browser_options = Options()
    browser_options.add_experimental_option("detach", True)
    if is_fake_camera:
      browser_options.add_argument("--use-fake-ui-for-media-stream") 
      browser_options.add_argument("--use-fake-device-for-media-stream")
      if mic_file is not None:
        browser_options.add_argument(f"--use-file-for-fake-audio-capture={mic_file}") 
    browser_options.add_argument('--log-level=0')
    browser_options.add_argument('--no-sandbox')
    browser_options.add_argument('--disable-extensions')
    browser_options.add_argument('--disable-gpu')
    browser_options.add_argument('--disable-dev-shm-usage')
    browser_options.add_argument('--disable-setuid-sandbox')
    browser_options.add_argument('--enable-logging')
    browser_options.add_argument('--v=1')
    browser_options.add_argument("--mute-audio") 
    
    if is_headless:
      browser_options.add_argument("--headless")
    
    service = Service(executable_path='/tmp/chromedriver', service_args=["--verbose","--log-path=/tmp/chromedriver.log"])
    
    browser_options.set_capability( "goog:loggingPrefs", { 'browser':'ALL' } )
    self.driver = webdriver.Chrome(service=service, options=browser_options)

  def open_in_new_tab(self, url):
    print("url opening:" + url)
    self.driver.switch_to.new_window('tab')
    self.driver.get(url)
    return self.driver.current_window_handle

  def switch_to_tab(self,tab_id):
    self.driver.switch_to.window(tab_id)

  def get_current_tab_id(self):
    return self.driver.current_window_handle

  def execute_script(self, script, *args):
    try:
      return self.driver.execute_script(script, *args)
    except StaleElementReferenceException as e:
      return None
    
  def print_ss_as_base64(self):
    print(self.driver.get_screenshot_as_base64()) 

  def get_screenshot_as_base64(self):
    return self.driver.get_screenshot_as_base64()
  
  def save_ss_as_file(self, file_path):
    self.driver.save_screenshot(file_path)

  def print_log_file(self):
    file_path = "/tmp/chromedriver.log"
    print("Printing log file: "+file_path)
    with open(file_path, 'r') as file:
      print(file.read())
    print("End of log file")
    
  def execute_script_with_retry(self, script, retries=3, wait_time=2):
    for attempt in range(retries):
        try:
            result_json = self.driver.execute_script(script)
            return result_json
        except (JavascriptException, StaleElementReferenceException) as e:
            print(f"Attempt {attempt + 1} failed for script: {script}")
            if attempt < retries - 1:
                # Wait before retrying
                time.sleep(wait_time)
            else:
                print(f"Script {script} failed after {retries} attempts: {e}")
                raise
            
  def get_element_with_retry(self, by, value, retries=5, wait_time=2):
    print(f"Looking for element by {by} with value {value}")
    for attempt in range(retries):
        try:
            element = self.driver.find_element(by, value)
            return element
        except (NoSuchElementException, StaleElementReferenceException) as e:
            print(f"Attempt {attempt + 1} failed")
            if attempt < retries - 1:
                # Wait before retrying
                time.sleep(wait_time)
            else:
                print(f"Element not found by {by} with value {value} after {retries} attempts: {e}")
                #print("SS as base64: \n"+self.driver.get_screenshot_as_base64())
                self.save_ss_as_file("not-found.png")

                raise
            
  def get_all_elements(self, by, value):
    return self.driver.find_elements(by, value)
    
  def makeFullScreen(self):
    self.driver.maximize_window()

  def print_console_logs(self):
    for entry in self.driver.get_log('browser'):
      print("#####\n"+str(entry)+"\n#####")
    
  def get_element(self, by, value, timeout=15):
    try:
      element_present = EC.element_to_be_clickable((by, value))
      WebDriverWait(self.driver, timeout).until(element_present)
    except TimeoutException:
      print("Timed out waiting for element to be clickable by "+str(by)+" with value "+str(value))
      #print("SS as base64: \n"+self.driver.get_screenshot_as_base64())
      
    return self.driver.find_element(by, value)


  def get_all_elements_in_element(self, element, by, value, timeout=15):
    try:
      element_present = EC.element_to_be_clickable((by, value))
      WebDriverWait(element, timeout).until(element_present)
    except TimeoutException:
      print("Timed out waiting for nested element to be clickable by "+str(by)+" with value "+str(value))

    return element.find_elements(by, value)
  
  def get_element_in_element(self, element, by, value, timeout=15, wait_until_clickable=True):
    if wait_until_clickable:
      try:
        element_present = EC.element_to_be_clickable((by, value))
        WebDriverWait(element, timeout).until(element_present)
      except TimeoutException:
        print("Timed out waiting for nested element to be clickable by "+str(by)+" with value "+str(value))

    return element.find_element(by, value)

  def is_element_displayed(self, by, value):
    try:
        element = self.driver.find_element(by, value)
        return element.is_displayed()
    except NoSuchElementException:
        print(f"Element not found by {by} with value {value}")
        return False

  def is_element_exist(self, by, value):
    try:
      elements = self.driver.find_elements(by, value)
      return len(elements) != 0
    except NoSuchElementException:
      print("Element not exist")
      return False

  def is_nested_element_exist(self, element, by, value):
    try:
      elements = element.find_elements(by, value)
      return len(elements) != 0
    except NoSuchElementException:
      print("Nested element not exist")
      return False
      
  def mouse_click_on(self, element):
    ActionChains(self.driver).move_to_element(element).click().perform()

  def write_to_element(self, element, text):
    element.send_keys(text)

  def click_element(self, element):
    element.click()

  def click_element_as_script(self, element):
    self.driver.execute_script("arguments[0].click();", element)


  def move_slider_to(self, element, value):
    move = ActionChains(self.driver)
    move.click_and_hold(element).move_by_offset(value, 0).release().perform()

  def move_to_element(self, element):
    move = ActionChains(self.driver)
    move.move_to_element(element).perform()

  def get_wait(self, wait_time=25, poll_frequency=1):
    return WebDriverWait(self.driver, wait_time, poll_frequency)

  def close(self):
    self.driver.close()

  def close_tab(self, tab_id):
    self.driver.switch_to.window(tab_id)
    self.driver.close()

  def close_all(self):
    for handle in self.driver.window_handles:
      self.driver.switch_to.window(handle)
      self.driver.close()
