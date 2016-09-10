import tensorflow as tf
import os
from scipy import ndimage
from scipy import misc
from skimage.draw import line_aa
from config import config
from utils.logger import Logger

logger = Logger('image_utils')


def load_model_images(folder, image_size=config['image_size'], max_images=0):
    """Load all the images in a folder and prepare them to be used by the model"""
    images = os.listdir(folder)
    model_images = []
    total_images = max_images if max_images and max_images < len(images) else len(images)
    for i in range(total_images):
        if not images[i].startswith('.'):
            image_file = os.path.join(folder, images[i])
            model_images.append(prepare_model_image(image_file, image_size))
            if i % 100 == 0:
                logger.info('Loading images... %d/%d' % (i, total_images))

    logger.info('Loaded %d images' % len(model_images))

    return model_images


def prepare_model_image(image_file, image_size):
    """Prepare an image to be used by the model"""
    image_data = ndimage.imread(image_file, mode='L').astype(float)
    image_data = resize_image(image_data, image_size, image_size)
    return normalize_image(image_data)


def load_original_images(folder):
    images = os.listdir(folder)
    dataset = []
    for image in images:
        if not image.startswith('.'):
            image_file = os.path.join(folder, image)
            image_data = read_image(image_file)
            dataset.append(image_data)
    return dataset


def read_image(image_file):
    image_data = ndimage.imread(image_file, mode='L').astype(float)
    return normalize_image(image_data), image_data


def normalize_image(image_data):
    """Normalize image values to the range -1,1"""
    if len(image_data.shape) == 2:
        image_data = image_data.reshape(image_data.shape[0], image_data.shape[1], 1)
    return (image_data - 255 / 2) / 255


def resize_image(image_data, height, width):
    return misc.imresize(image_data, (height, width), interp='bicubic', mode='L')


def rotate_images(images, rotations=[1,2,3]):
    tensors = []
    for image in images:
        if len(image.shape) == 2:
            image = image.reshape(image.shape[0], image.shape[1], 1)
        for i in rotations:
            tensors.append(tf.image.rot90(image, i))
    with tf.Session() as sess:
        tf.initialize_all_variables().run()
        return sess.run(tensors)


def apply_random_brightness(images):
    new_images = []
    for image in images:
        new_images.append(ndimage.zoom(image, 3))
    return new_images


def draw_border(image, x_start, y_start, x_end, y_end):
    rr, cc, val = line_aa(x_start, y_start, x_end, y_start)
    image[rr, cc] = 1
    rr, cc, val = line_aa(x_start, y_start, x_start, y_end)
    image[rr, cc] = 1
    rr, cc, val = line_aa(x_end, y_start, x_end, y_end)
    image[rr, cc] = 1
    rr, cc, val = line_aa(x_start, y_end, x_end, y_end)
    image[rr, cc] = 1
    return image


def clean_shape(image):
    """If the image only have one channel, removes the third dimension"""
    if len(image.shape) == 3:
        channels = image.shape[2]
        if not channels or channels == 1:
            return image.reshape(image.shape[0], image.shape[1])
    return image
