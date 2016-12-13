#!/usr/bin/python

import tensorflow as tf
import sys, getopt
import time
import json
from scipy import misc
from model import Model
from model_config import model_config
from utils import data_utils
from utils import image_utils
from utils.logger import Logger

logger = Logger('process_board')


def process_board(image_file, lang, free_mode):
    graph = tf.Graph()

    with graph.as_default():
        model = Model()
        y_conv = model.get_model()

        # Add an op to initialize the variables.
        init_op = tf.initialize_all_variables()

        # Add ops to save and restore all the variables.
        saver = tf.train.Saver()

    with tf.Session(graph=graph) as sess:
        sess.run(init_op)

        saver.restore(sess, model_config.get('model_file'))
        logger.info("Model restored.")

        start_time = time.time()

        image_data, image = image_utils.read_image(image_file)
        relations, items, users = data_utils.locate_labels(image_data, model, y_conv, sess)

        # data_utils.clean_directory('./tmp')
        # i = 0
        # for elem in relations:
        #     tmp_image = color_image[elem['zone'][0]:elem['zone'][1], elem['zone'][2]:elem['zone'][3]]
        #     tmp_image = image_utils.clean_shape(tmp_image)
        #     path = 'tmp/relation_' + str(i) + '.jpg'
        #     i += 1
        #     logger.debug('Saving results image on %s' % path)
        #     misc.imsave(path, tmp_image)
        #
        # i = 0
        # for elem in items:
        #     tmp_image = color_image[elem['zone'][0]:elem['zone'][1], elem['zone'][2]:elem['zone'][3]]
        #     tmp_image = image_utils.clean_shape(tmp_image)
        #     path = 'tmp/item_' + str(i) + '.jpg'
        #     i += 1
        #     logger.debug('Saving results image on %s' % path)
        #     misc.imsave(path, tmp_image)

        # Creates an image showing the matches
        # tmp_image = image_utils.clean_shape(image_data)
        # for match in (relations + items + users):
        #     tmp_image = image_utils.draw_border(tmp_image, match['zone'][0], match['zone'][2], match['zone'][1], match['zone'][3])
        # path = 'dataset/results.jpg'
        # logger.debug('Saving results image on %s' % path)
        # misc.imsave(path, tmp_image)

        relations, items = data_utils.read_text(image, relations, items, lang=lang)
        relations, items = data_utils.find_element_centers(relations, items)

        if not free_mode:
            relations = data_utils.find_relation_types(relations)
            relations, items = data_utils.group_by_relation(relations, items)
            relations,items = data_utils.sort_by_position(relations, items)
            data_utils.prepare_response_data(relations, items, users)

        # Print the JSON response
        print(json.dumps({
            'items': items,
            'relations': relations
        }))

        logger.info('Found %d items and %d relations' % (len(items), len(relations)))
        logger.info("Prediction Time: %s seconds" % (time.time() - start_time))


def main(argv):
    help_text = 'Usage: process_board.py -i <image>'
    try:
        opts, args = getopt.getopt(argv, "hi:l:g:f", ['help', 'image=', 'lang=', 'log=', 'free'])
    except getopt.GetoptError:
        print(help_text)
        sys.exit(2)

    image = None
    lang = None
    log_level = None
    free_mode = False
    for o, a in opts:
        if o in ("-h", "--help"):
            print(help_text)
            sys.exit()
        elif o in ("-i", "--image"):
            image = a
        elif o in ("-l", "--lang"):
            lang = a
        elif o in ("-g", "--log"):
            log_level = a
        elif o in ("-f", "--free"):
            free_mode = True

    if image is None:
        print(help_text)
        sys.exit(2)

    if not log_level is None:
        Logger.set_level(log_level)

    process_board(image, lang, free_mode)


if __name__ == "__main__":
    main(sys.argv[1:])
