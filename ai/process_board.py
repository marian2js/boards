#!/usr/bin/python

import tensorflow as tf
import sys, getopt
import time
import json
from scipy import misc
from model import Model
from config import config
from utils import data_utils
from utils import image_utils
from utils.logger import Logger

logger = Logger('process_board')


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
        logger.info("Model restored.")

        start_time = time.time()

        image_data, image = image_utils.read_image(image_file)
        lists, tasks = data_utils.locate_labels(image_data, model, y_conv, sess)
        image_data = image_utils.clean_shape(image_data)

        # Creates an image showing the matches
        for match in (lists + tasks):
            image_data = image_utils.draw_border(image_data, match['zone'][0], match['zone'][2], match['zone'][1], match['zone'][3])
        path = 'dataset/results.jpg'
        logger.debug('Saving results image on %s' % path)
        misc.imsave(path, image_data)

        lists, tasks = data_utils.read_text(image, lists, tasks)
        lists = data_utils.group_by_list(lists, tasks)
        data_utils.sort_by_position(lists)
        data_utils.prepare_response_data(lists)

        # Print the JSON response
        print(json.dumps(lists))

        logger.info('Found %d tasks and %d lists' % (len(tasks), len(lists)))
        logger.info("Prediction Time: %s seconds" % (time.time() - start_time))


def main(argv):
    help_text = 'Usage: process_board.py -i <image>'
    try:
        opts, args = getopt.getopt(argv, "hi:l:", ['help', 'image=', 'log='])
    except getopt.GetoptError:
        print(help_text)
        sys.exit(2)

    image = None
    log_level = None
    for o, a in opts:
        if o in ("-h", "--help"):
            print(help_text)
            sys.exit()
        elif o in ("-i", "--image"):
            image = a
        elif o in ("-l", "--logger"):
            log_level = a

    if image is None:
        print(help_text)
        sys.exit(2)

    if not log_level is None:
        Logger.set_level(log_level)

    process_board(image)


if __name__ == "__main__":
    main(sys.argv[1:])
