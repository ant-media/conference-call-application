import test_join_leave
import test_webinar
from test_deployment import TestDeployment
from test_join_leave import TestJoinLeave


import unittest
import sys
import os
import random

os.environ['SERVER_URL'] = sys.argv[1]
os.environ['AMS_USER'] = sys.argv[2]
os.environ['AMS_PASSWORD'] = sys.argv[3]
os.environ['WAR_FILE'] = sys.argv[4]
use_test_webinar = sys.argv[5].lower() == 'true'
app_name_prefix = "webinar" if use_test_webinar else "conference"
os.environ['TEST_APP_NAME'] = app_name_prefix + str(random.randint(100, 999))

#Keep it True to stop tests immediately after a failed test
fail_fast = True

suite = unittest.TestSuite()
suite.addTest(TestDeployment('test_install_app'))

suite2 = None
if use_test_webinar:
    suite2 = unittest.TestLoader().loadTestsFromModule(test_webinar)
else:
    suite2 = unittest.TestLoader().loadTestsFromModule(test_join_leave)


suite.addTests(suite2)

#suite.addTest(TestJoinLeave("test_join_without_camera_mic")) 

suite.addTest(TestDeployment('test_delete_app'))

ret = not unittest.TextTestRunner(verbosity=2, failfast=fail_fast).run(suite).wasSuccessful()
sys.exit(ret)

