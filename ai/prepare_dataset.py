from scipy import misc
from config import config
from utils import image_utils
from utils import data_utils
from utils.logger import Logger

logger = Logger('prepare_dataset')

# Load dataset
items_dataset = image_utils.load_model_images(config['item']['original_folder'])
items_generated = image_utils.load_model_images(config['item']['generated_folder'])
relations_dataset = image_utils.load_model_images(config['relation']['original_folder'])
relations_generated = image_utils.load_model_images(config['relation']['generated_folder'])
users_dataset = image_utils.load_model_images(config['user']['original_folder'])
backgrounds_dataset = image_utils.load_model_images(config['backgrounds']['original_folder'])
outliers_dataset = image_utils.load_model_images(config['outlier']['original_folder'])

# Rotate items 90, 180 and 270 degrees
generated_images = image_utils.rotate_images(items_dataset)
items_dataset = items_dataset + generated_images

# Add generated items
items_dataset = items_dataset + items_generated

# Rotate relations 180 degrees
generated_images = image_utils.rotate_images(relations_dataset, rotations=[2])
relations_dataset = relations_dataset + generated_images

# Add generated relations
relations_dataset = relations_dataset + relations_generated

# Rotate outliers 90, 180 and 270 degrees
generated_images = image_utils.rotate_images(outliers_dataset)
outliers_dataset = outliers_dataset + generated_images

# Group outliers and backgrounds
outliers_dataset = outliers_dataset + backgrounds_dataset

# Save items
data_utils.clean_directory(config['item']['folder'])
for i in range(len(items_dataset)):
    path = config['item']['folder'] + '/' + str(i) + '.jpg'
    logger.info('creating %s' % path)
    image = image_utils.clean_shape(items_dataset[i])
    misc.imsave(path, image)

# Save relations
data_utils.clean_directory(config['relation']['folder'])
for i in range(len(relations_dataset)):
    path = config['relation']['folder'] + '/' + str(i) + '.jpg'
    logger.info('creating %s' % path)
    image = image_utils.clean_shape(relations_dataset[i])
    misc.imsave(path, image)

# Save users
data_utils.clean_directory(config['user']['folder'])
for i in range(len(users_dataset)):
    path = config['user']['folder'] + '/' + str(i) + '.jpg'
    logger.info('creating %s' % path)
    image = image_utils.clean_shape(users_dataset[i])
    misc.imsave(path, image)

# Save outliers
data_utils.clean_directory(config['outlier']['folder'])
for i in range(len(outliers_dataset)):
    path = config['outlier']['folder'] + '/' + str(i) + '.jpg'
    logger.info('creating %s' % path)
    image = image_utils.clean_shape(outliers_dataset[i])
    misc.imsave(path, image)
