import sys
import os.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from utils import image_utils
from utils import ocr_utils
from config import config
from tests.test_helper import TestHelper

images, names = image_utils.load_original_images(config['user']['original_folder'])

test = TestHelper()

for i in range(len(images)):
    user = names[i].split('.')[0]
    user = ''.join([i for i in user if not i.isdigit()])
    user = user.upper()
    text = ocr_utils.read_user(images[i])
    test.expect_equal(user, text)
    print('Result: ', user, text)

print('Correct: %i/%i - %f%%' % (test.match, test.total, test.get_percentage()))
