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
from selenium.common.exceptions import NoSuchElementException

from selenium.webdriver import ActionChains


class Browser:
  def init(self, is_headless):
    browser_options = Options()
    browser_options.add_experimental_option("detach", True)
    browser_options.add_argument("--use-fake-ui-for-media-stream") 
    browser_options.add_argument("--use-fake-device-for-media-stream")
    browser_options.add_argument('--log-level=3')
    browser_options.add_argument('--no-sandbox')
    browser_options.add_argument('--disable-extensions')
    browser_options.add_argument('--disable-gpu')
    browser_options.add_argument('--disable-dev-shm-usage')
    browser_options.add_argument('--disable-setuid-sandbox')
    if is_headless:
      browser_options.add_argument("--headless")
    
    dc = DesiredCapabilities.CHROME.copy()
    dc['goog:loggingPrefs'] = { 'browser':'ALL' }
    #service = Service(executable_path='C:/WebDriver/chromedriver.exe') 
    service = Service(executable_path='/tmp/chromedriver')
    self.driver = webdriver.Chrome(service=service, options=browser_options)

  def open_in_new_tab(self, url):
    self.driver.switch_to.new_window('tab')
    self.driver.get(url)
    return self.driver.current_window_handle

  def switch_to_tab(self,tab_id):
    self.driver.switch_to.window(tab_id)

  def get_current_tab_id(self):
    return self.driver.current_window_handle

  def execute_script(self, script):
    try:
      return self.driver.execute_script(script)
    except StaleElementReferenceException as e:
      return None
    

  def get_element_by_id(self, id):
    timeout = 15
    try:
      element_present = EC.element_to_be_clickable((By.ID, id))
      WebDriverWait(self.driver, timeout).until(element_present)
    except TimeoutException:
      print ("Timed out waiting for page to load")

    element = self.driver.find_element(By.ID, id)
    return element
  
  def is_element_exist_by_id(self, id):
    try:
      element = self.driver.find_elements(By.ID, id)
      return len(element) != 0
    except NoSuchElementException:
      print("element not exist")
      return False
  
  def is_element_exist_by_class_name(self, id):
    try:
      element = self.driver.find_elements(By.CLASS_NAME, id)
      return len(element) != 0
    except NoSuchElementException:
      print("element not exist")
      return False
    
  def get_elements_of_an_element_by_class_name(self, element, class_name):
    timeout = 15
    try:
      element_present = EC.element_to_be_clickable((By.CLASS_NAME, class_name))
      WebDriverWait(self.driver, timeout).until(element_present)
    except TimeoutException:
      print ("Timed out waiting for page to load")

    elemnets = element.find_elements(By.CLASS_NAME, class_name)
    return elemnets
  
  def is_element_of_element_exist_by_class_name(self, element, class_name):
    try:
      subs = element.find_elements(By.CLASS_NAME, class_name)
      return len(subs) != 0
    except NoSuchElementException:
      return False
      
  def mouse_click_on(self, element):
    ActionChains(self.driver).move_to_element(element).click().perform()

  def write_to_element(self, element, text):
    element.send_keys(text)

  def click_element(self, element):
    element.click()

  def move_slider_to(self, element, value):
    move = ActionChains(self.driver)
    move.click_and_hold(element).move_by_offset(value, 0).release().perform()

  def get_wait(self):
    return WebDriverWait(self.driver, 25)

  def close(self):
    self.driver.close()

  def close_tab(self, tab_id):
    self.driver.switch_to.window(tab_id)
    self.driver.close()

  def close_all(self):
    for handle in self.driver.window_handles:
      self.driver.switch_to.window(handle)
      self.driver.close()