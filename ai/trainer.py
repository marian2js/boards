import tensorflow as tf
from model_config import model_config
from utils.logger import Logger

logger = Logger('Trainer')


def get_train_step(ce):
    return tf.train.AdamOptimizer(1e-4).minimize(ce)


def get_cross_entropy(data, y):
    return tf.reduce_mean(-tf.reduce_sum(data * tf.log(y), reduction_indices=[1]))


def get_correct_prediction(t1, t2):
    return tf.equal(tf.argmax(t1, 1), tf.argmax(t2, 1))


def get_accuracy(cp):
    return tf.reduce_mean(tf.cast(cp, tf.float32))


class Trainer:
    def __init__(self, model):
        self.model = model
        self.config = model_config
        self.batch_size = 10
        self.num_labels = model_config.get('num_labels')
        self.num_channels = model_config.get('image_channels')

        y_conv = model.get_model()
        self.label_data = tf.placeholder(tf.float32, shape=[None, self.num_labels])
        cross_entropy = get_cross_entropy(self.label_data, y_conv)

        self.train_step = get_train_step(cross_entropy)
        self.cross_entropy = get_correct_prediction(y_conv, self.label_data)
        self.accuracy = get_accuracy(self.cross_entropy)

    def train_model(self, steps, labels, dataset):
        for i in range(steps):
            offset = (i * self.batch_size) % (labels.shape[0] - self.batch_size)
            batch_data = dataset[offset:(offset + self.batch_size), :, :, :]
            batch_labels = labels[offset:(offset + self.batch_size), :]

            if i % 50 == 0:
                train_accuracy = self.accuracy.eval(
                    feed_dict={self.model.train_data: batch_data, self.label_data: batch_labels,
                               self.model.keep_prob: 1.0})
                logger.info("step %d/%d, training accuracy %g" % (i, steps, train_accuracy))

            self.train_step.run(feed_dict={self.model.train_data: batch_data, self.label_data: batch_labels,
                                           self.model.keep_prob: 0.5})

    def evaluate_model(self, labels, dataset):
        # Evaluate test data
        test_data_accuracy = self.accuracy.eval(
            feed_dict={self.model.train_data: dataset, self.label_data: labels, self.model.keep_prob: 1.0})
        logger.info("test accuracy %g" % test_data_accuracy)
        return test_data_accuracy
