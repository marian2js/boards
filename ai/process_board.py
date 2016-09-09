#!/usr/bin/python

import tensorflow as tf
import sys, getopt
import time
from scipy import misc
from model import Model
from config import config
from utils import data_utils
from utils import image_utils


def process_board(image_file):
    graph = tf.Graph()

    with graph.as_default():
        model = Model()
        y_conv = model.prepare()

        # Add an op to initialize the variables.
        init_op = tf.initialize_all_variables()

        # Add ops to save and restore all the variables.
        saver = tf.train.Saver()

    with tf.Session(graph=graph) as sess:
        sess.run(init_op)

        saver.restore(sess, config['model_file'])
        print("Model restored.")

        start_time = time.time()

        image = image_utils.read_image(image_file)
        lists, tasks = data_utils.locate_labels(image, model, y_conv, sess)
        image = image_utils.clean_shape(image)

        # Creates an image showing the matches
        for match in (lists + tasks):
            image = image_utils.draw_border(image, match['zone'][0], match['zone'][2], match['zone'][1], match['zone'][3])
        path = 'dataset/results.jpg'
        print('creating', path)
        misc.imsave(path, image)

        lists, tasks = data_utils.read_text(image, lists, tasks)
        lists = data_utils.group_by_list(lists, tasks)

        print('Found %d tasks and %d lists' % (len(tasks), len(lists)))
        print("Prediction Time: %s seconds" % (time.time() - start_time))


def main(argv):
    help_text = 'Usage: process_board.py -i <image>'
    try:
        opts, args = getopt.getopt(argv, "h:i:", ['image='])
    except getopt.GetoptError:
        print(help_text)
        sys.exit(2)

    image = None
    for o, a in opts:
        if o in ("-h", "--help"):
            print(help_text)
            sys.exit()
        elif o in ("-i", "--image"):
            image = a
        else:
            print(help_text)
            sys.exit(2)

    process_board(image)


if __name__ == "__main__":
    main(sys.argv[1:])
