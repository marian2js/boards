import random
from scipy import misc
from config import config
from utils import image_utils
from utils.logger import Logger

logger = Logger('generate')

task_objects = image_utils.load_original_images(config['task']['objects_folder'])
list_objects = image_utils.load_original_images(config['list']['objects_folder'])
list_backgrounds = image_utils.load_model_images(config['backgrounds']['original_folder'], image_size=1100)
task_backgrounds = image_utils.load_model_images(config['backgrounds']['original_folder'], image_size=420)


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
    list_object = random.choice(list_objects)
    background = random.choice(list_backgrounds)
    append_images(list_object, background, config['list']['generated_folder'] + '/' + str(i) + '.jpg')
    if i % 100 == 0:
        logger.info('Generated %d lists' % i)

for i in range(3000):
    task_object = random.choice(task_objects)
    background = random.choice(task_backgrounds)
    append_images(task_object, background, config['task']['generated_folder'] + '/' + str(i) + '.jpg')
    if i % 100 == 0:
        logger.info('Generated %d tasks' % i)
