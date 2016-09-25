from scipy import misc
from config import config
from utils import image_utils
from utils.logger import Logger

logger = Logger('prepare_dataset')

# Load dataset
items_dataset = image_utils.load_model_images(config['item']['original_folder'])
lists_dataset = image_utils.load_model_images(config['list']['original_folder'])
lists_generated = image_utils.load_model_images(config['list']['generated_folder'])
backgrounds_dataset = image_utils.load_model_images(config['backgrounds']['original_folder'])
outliers_dataset = image_utils.load_model_images(config['outlier']['original_folder'])

lists_dataset = lists_dataset + lists_generated

# Rotate items 90, 180 and 270 degrees
generated_images = image_utils.rotate_images(items_dataset)
items_dataset = items_dataset + generated_images

# Rotate lists 180 degrees
generated_images = image_utils.rotate_images(lists_dataset, rotations=[2])
lists_dataset = lists_dataset + generated_images

# Rotate outliers 90, 180 and 270 degrees
generated_images = image_utils.rotate_images(outliers_dataset)
outliers_dataset = outliers_dataset + generated_images

# Group outliers and backgrounds
outliers_dataset = outliers_dataset + backgrounds_dataset

# Save items
for i in range(len(items_dataset)):
    path = config['item']['folder'] + '/' + str(i) + '.jpg'
    logger.info('creating %s' % path)
    image = image_utils.clean_shape(items_dataset[i])
    misc.imsave(path, image)

# Save lists
for i in range(len(lists_dataset)):
    path = config['list']['folder'] + '/' + str(i) + '.jpg'
    logger.info('creating %s' % path)
    image = image_utils.clean_shape(lists_dataset[i])
    misc.imsave(path, image)

# Save outliers
for i in range(len(outliers_dataset)):
    path = config['outlier']['folder'] + '/' + str(i) + '.jpg'
    logger.info('creating %s' % path)
    image = image_utils.clean_shape(outliers_dataset[i])
    misc.imsave(path, image)