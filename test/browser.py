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
    #self.driver = webdriver.Chrome('drivers/chromedriver.exe', chrome_options=browser_options)

    service = Service(executable_path='/tmp/chromedriver')
    self.driver = webdriver.Chrome(service=service, options=browser_options)

  def open_in_new_tab(self, url, tab_id):
    self.driver.execute_script("window.open('about:blank', '"+tab_id+"');")
    self.driver.switch_to.window(tab_id)
    self.driver.get(url)

  def get_element_by_id(self, id):
    timeout = 5
    try:
      element_present = EC.element_to_be_clickable((By.ID, id))
      WebDriverWait(self.driver, timeout).until(element_present)
    except TimeoutException:
      print ("Timed out waiting for page to load")

    element = self.driver.find_element(By.ID, id)
    return element

  def write_to_element(self, element, text):
    element.send_keys(text)

  def click_element(self, element):
    element.click()

  def close(self):
    self.driver.close()

  def close_all(self):
    for handle in self.driver.window_handles:
      self.driver.switch_to.window(handle)
      self.driver.close()