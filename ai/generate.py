import random
from scipy import misc
from config import config
from utils import image_utils
from utils.logger import Logger

logger = Logger('generate')

item_objects = image_utils.load_original_images(config['item']['objects_folder'])
relation_objects = image_utils.load_original_images(config['relation']['objects_folder'])
relation_backgrounds = image_utils.load_model_images(config['backgrounds']['original_folder'], image_size=1100)
item_backgrounds = image_utils.load_model_images(config['backgrounds']['original_folder'], image_size=420)


def append_images(object_image, background, dest):
    object_image = image_utils.clean_shape(object_image)
    background = image_utils.clean_shape(background)
    object_size = object_image.shape
    background_size = background.shape
    position = [
        (background_size[0] - object_size[0]) // 2,
        (background_size[1] - object_size[1]) // 2,
    ]
    background[position[0]:object_size[0] + position[0], position[1]:object_size[1] + position[1]] = object_image
    misc.imsave(dest, background)

for i in range(3000):
    relation_object = random.choice(relation_objects)
    background = random.choice(relation_backgrounds)
    append_images(relation_object, background, config['relation']['generated_folder'] + '/' + str(i) + '.jpg')
    if i % 100 == 0:
        logger.info('Generated %d relations' % i)

for i in range(3000):
    item_object = random.choice(item_objects)
    background = random.choice(item_backgrounds)
    append_images(item_object, background, config['item']['generated_folder'] + '/' + str(i) + '.jpg')
    if i % 100 == 0:
        logger.info('Generated %d items' % i)
