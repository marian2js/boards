import tensorflow as tf
from config import config


def conv2d(x, W):
    return tf.nn.conv2d(x, W, strides=[1, 1, 1, 1], padding='SAME')


def max_pool_2x2(x):
    return tf.nn.max_pool(x, ksize=[1, 2, 2, 1], strides=[1, 2, 2, 1], padding='SAME')


def weight_variable(shape):
    initial = tf.truncated_normal(shape, stddev=0.1)
    return tf.Variable(initial)


def bias_variable(shape):
    initial = tf.constant(0.1, shape=shape)
    return tf.Variable(initial)


class Model:
    def __init__(self):
        self.num_labels = config['num_labels']
        self.image_size = config['image_size']
        self.image_channels = config['image_channels']
        self.conv1_patch_size = 5
        self.conv1_num_channels = 32
        self.conv2_patch_size = 5
        self.conv2_num_channels = 64
        self.fc1_num_neurons = 1024

        self.train_data = None

    def prepare(self):
        self.train_data = tf.placeholder(tf.float32,
                                         shape=[None, self.image_size, self.image_size, self.image_channels])

        # ------ Convolutional Layer 1 ------ #

        conv1_weights = weight_variable(
            [self.conv1_patch_size, self.conv1_patch_size, self.image_channels, self.conv1_num_channels])
        conv1_biases = bias_variable([self.conv1_num_channels])

        h_conv1 = tf.nn.relu(conv2d(self.train_data, conv1_weights) + conv1_biases)
        h_pool1 = max_pool_2x2(h_conv1)

        # ------ Convolutional Layer 2 ------ #

        conv2_weights = weight_variable(
            [self.conv2_patch_size, self.conv2_patch_size, self.conv1_num_channels, self.conv2_num_channels])
        conv2_biases = bias_variable([self.conv2_num_channels])

        h_conv2 = tf.nn.relu(conv2d(h_pool1, conv2_weights) + conv2_biases)
        h_pool2 = max_pool_2x2(h_conv2)

        # ------ Fully Connected Layer ------ #

        image_patch_size = self.image_size // 4
        fc1_weights = weight_variable(
            [image_patch_size * image_patch_size * self.conv2_num_channels, self.fc1_num_neurons])
        fc1_biases = bias_variable([self.fc1_num_neurons])

        h_pool2_flat = tf.reshape(h_pool2, [-1, image_patch_size * image_patch_size * self.conv2_num_channels])
        h_fc1 = tf.nn.relu(tf.matmul(h_pool2_flat, fc1_weights) + fc1_biases)

        # ------ Readout Layer ------ #

        layer4_weights = weight_variable([self.fc1_num_neurons, self.num_labels])
        layer4_biases = bias_variable([self.num_labels])

        return tf.nn.softmax(tf.matmul(h_fc1, layer4_weights) + layer4_biases)


