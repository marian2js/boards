import sys
import json
import os.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from utils import image_utils
from utils import ocr_utils
from utils import data_utils
from tests.test_helper import TestHelper

test_perfect = TestHelper()
test_acceptable = TestHelper()

data_utils.clean_directory('../tmp_ocr')
relations = os.listdir('./relations_data')
for relation in relations:
    if not relation.startswith('.'):
        relation_num = ''.join([i for i in relation if i.isdigit()])
        data = board_data = json.loads(open('./relations_data/' + relation).read())
        image_data, image = image_utils.read_image('../dataset/relations_original/' + relation_num + '.jpg')
        real_text = data['text']
        read_text = ocr_utils.read_text(image).replace('\n', ' ').replace('  ', ' ')
        test_perfect.expect_equal(real_text, read_text)
        test_acceptable.expect_equal(data_utils.compare_strings(real_text, read_text) >= 0.7, True)
        print('Relation #', relation_num, ' - ', data_utils.compare_strings(real_text, read_text))
        print(real_text)
        print(read_text)

print('\n\nRead Perfect: %i/%i - %f%%' % (test_perfect.match, test_perfect.total, test_perfect.get_percentage()))
print('Read Acceptable: %i/%i - %f%%' % (test_acceptable.match, test_acceptable.total, test_acceptable.get_percentage()))
