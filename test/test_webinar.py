from browser import Browser
from selenium.webdriver.common.by import By
from rest_helper import RestHelper 


import subprocess
import sys
import unittest
import os
import random
import json
import time
import psutil


class TestWebinar(unittest.TestCase):
  def setUp(self):
    print("----------------\n", self._testMethodName, " starting...")
    
  def tearDown(self):
    print(self._testMethodName, " ending...\n","----------------")

  def test_x(self):
    print("test")


if __name__ == '__main__':
    unittest.main()
