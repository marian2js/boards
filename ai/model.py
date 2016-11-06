import tensorflow as tf
from config import config


def conv2d(x, W):
    return tf.nn.conv2d(x, W, strides=[1, 1, 1, 1], padding='SAME')


def max_pool_2x2(x):
    return tf.nn.max_pool(x, ksize=[1, 2, 2, 1], strides=[1, 2, 2, 1], padding='SAME')


def weight(shape):
    initial = tf.truncated_normal(shape, stddev=0.1)
    return tf.Variable(initial)


def bias(shape):
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
        self.image_fc_size = self.image_size // 4
        self.fc1_num_neurons = 1024
        self.fc2_num_neurons = 1024

        self.train_data = None
        self.keep_prob = None

    def prepare(self):
        self.train_data = tf.placeholder(tf.float32,
                                         shape=[None, self.image_size, self.image_size, self.image_channels])

        # Convolutional Layer 1

        conv1_weights = weight(
            [self.conv1_patch_size, self.conv1_patch_size, self.image_channels, self.conv1_num_channels])
        conv1_biases = bias([self.conv1_num_channels])
        conv1 = tf.nn.relu(conv2d(self.train_data, conv1_weights) + conv1_biases)

        # Pooling Layer 1

        pool1 = max_pool_2x2(conv1)

        # Convolutional Layer 2

        conv2_weights = weight(
            [self.conv2_patch_size, self.conv2_patch_size, self.conv1_num_channels, self.conv2_num_channels])
        conv2_biases = bias([self.conv2_num_channels])
        conv2 = tf.nn.relu(conv2d(pool1, conv2_weights) + conv2_biases)

        # Pooling Layer 2

        pool2 = max_pool_2x2(conv2)

        # Fully Connected Layer

        fc1_weights = weight([pow(self.image_fc_size, 2) * self.conv2_num_channels, self.fc1_num_neurons])
        fc1_biases = bias([self.fc1_num_neurons])
        pool2 = tf.reshape(pool2, [-1, pow(self.image_fc_size, 2) * self.conv2_num_channels])
        fc1 = tf.nn.relu(tf.matmul(pool2, fc1_weights) + fc1_biases)

        fc2_weights = weight([self.fc1_num_neurons, self.fc2_num_neurons])
        fc2_biases = bias([self.fc2_num_neurons])
        fc2 = tf.nn.relu(tf.matmul(fc1, fc2_weights) + fc2_biases)

        # Dropout

        self.keep_prob = tf.placeholder(tf.float32)
        fc1_drop = tf.nn.dropout(fc2, self.keep_prob)

        # Readout Layer

        layer4_weights = weight([self.fc2_num_neurons, self.num_labels])
        layer4_biases = bias([self.num_labels])

        return tf.nn.softmax(tf.matmul(fc1_drop, layer4_weights) + layer4_biases)
