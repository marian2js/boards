import tensorflow as tf
import numpy as np
from six.moves import cPickle as pickle
import time
from model import Model
from config import config

start_time = time.time()

with open(config['dataset_pickle_file'], 'rb') as f:
    pickle_data = pickle.load(f)
    train_dataset = pickle_data['train_dataset']
    train_labels = pickle_data['train_labels']
    test_dataset = pickle_data['test_dataset']
    test_labels = pickle_data['test_labels']
    del pickle_data

image_size = config['image_size']
num_labels = config['num_labels']
num_channels = config['image_channels']

batch_size = 5

num_training_steps = 20000


def reformat(dataset, labels):
    dataset = np.asarray(dataset)
    labels = np.asarray(labels)
    dataset = dataset.reshape((-1, image_size, image_size, num_channels)).astype(np.float32)
    labels = (np.arange(num_labels) == labels[:, None]).astype(np.float32)
    return dataset, labels


train_dataset, train_labels = reformat(train_dataset, train_labels)
test_dataset, test_labels = reformat(test_dataset, test_labels)

print('Training set', train_dataset.shape, train_labels.shape)
print('Test set', test_dataset.shape, test_labels.shape)

graph = tf.Graph()

with graph.as_default():
    model = Model()
    y_conv = model.prepare()

    label_data = tf.placeholder(tf.float32, shape=[None, num_labels])
    cross_entropy = tf.reduce_mean(-tf.reduce_sum(label_data * tf.log(y_conv), reduction_indices=[1]))

    train_step = tf.train.AdamOptimizer(1e-4).minimize(cross_entropy)
    correct_prediction = tf.equal(tf.argmax(y_conv, 1), tf.argmax(label_data, 1))
    accuracy = tf.reduce_mean(tf.cast(correct_prediction, tf.float32))

    # Add an op to initialize the variables.
    init_op = tf.initialize_all_variables()

    # Add ops to save and restore all the variables.
    saver = tf.train.Saver()

with tf.Session(graph=graph) as sess:
    sess.run(init_op)

    # Train the CNN
    for i in range(num_training_steps):
        offset = (i * batch_size) % (train_labels.shape[0] - batch_size)
        batch_data = train_dataset[offset:(offset + batch_size), :, :, :]
        batch_labels = train_labels[offset:(offset + batch_size), :]

        if i % 100 == 0:
            train_accuracy = accuracy.eval(
                feed_dict={model.train_data: batch_data, label_data: batch_labels})
            print("step %d, training accuracy %g" % (i, train_accuracy))

        train_step.run(feed_dict={model.train_data: batch_data, label_data: batch_labels})

    save_path = saver.save(sess, config['model_file'])
    print("Model saved in file: %s" % save_path)

    # Evaluate test data
    print("test accuracy %g" % accuracy.eval(
        feed_dict={model.train_data: test_dataset, label_data: test_labels}))

    print("Training Time: %s seconds" % (time.time() - start_time))