import numpy as np
import math
from config import config
from utils import image_utils
from utils import ocr_utils
from utils.logger import Logger

logger = Logger('data_utils')


def classify_image(image_data, model, y_conv, sess):
    """Classify an Image"""
    result = y_conv.eval(feed_dict={model.train_data: [image_data]}, session=sess)
    result = result[0]
    type = np.argmax(result)
    confidence = result[type]
    return type, confidence


def classify_with_window(image, zone_marks, resize, model, y_conv, sess):
    """Use a sliding window to classify multiple elements in the image"""
    logger.info('Classifying with %dx resize' % resize)

    window_size = config['image_size']
    window_stride = 3

    new_height = image.shape[0] // resize
    new_width = image.shape[1] // resize
    image_data = image_utils.clean_shape(image)
    image_data = image_utils.resize_image(image_data, new_height, new_width)
    image_data = image_utils.normalize_image(image_data)
    matches = []
    for y in range(new_height // window_stride):
        for x in range(new_width // window_stride):
            x_offset = x * window_stride
            y_offset = y * window_stride
            if x_offset + window_size > new_width or y_offset + window_size > new_height:
                break

            zone = [
                y_offset * resize,
                (y_offset + window_size) * resize,
                x_offset * resize,
                (x_offset + window_size) * resize,
            ]
            zone_mathes = zone_marks[zone[0]:zone[1], zone[2]:zone[3]]
            zone_size = zone_mathes.shape[0] * zone_mathes.shape[1]
            zone_matches = np.sum(zone_mathes)

            if zone_matches > zone_size * config['match_max_shared_zone']:
                continue

            window_image = image_data[y_offset:y_offset + window_size, x_offset:x_offset + window_size]
            prediction, confidence = classify_image(window_image, model, y_conv, sess)
            if (prediction == 0 or prediction == 1) and confidence > config['match_min_confidence']:
                logger.debug('Prediction %d with confidence %f' % (prediction, confidence))

                matches.append({
                    'type': prediction,
                    'zone': zone
                })
                zone_marks[zone[0]:zone[1], zone[2]:zone[3]] = 1

    return matches


def locate_labels(image, model, y_conv, sess):
    zone_marks = np.zeros((image.shape[0], image.shape[1]))
    resize = 21
    matches = []
    matches += classify_with_window(image, zone_marks, resize, model, y_conv, sess)
    matches += classify_with_window(image, zone_marks, int(resize // pow(1.2, 2)), model, y_conv, sess)
    matches += classify_with_window(image, zone_marks, int(resize // pow(1.2, 3)), model, y_conv, sess)
    matches += classify_with_window(image, zone_marks, int(resize // pow(1.2, 4)), model, y_conv, sess)
    matches += classify_with_window(image, zone_marks, int(resize // pow(1.2, 5)), model, y_conv, sess)

    relations = list(filter(lambda m: m['type'] == 1, matches))
    items = list(filter(lambda m: m['type'] == 0, matches))

    return relations, items


def group_by_relation(relations, items):
    for elem in (relations + items):
        elem['center_x'] = (elem['zone'][3] - elem['zone'][2]) // 2 + elem['zone'][2]
        elem['center_y'] = (elem['zone'][1] - elem['zone'][0]) // 2 + elem['zone'][0]
    if len(relations) == 0:
        return [{
            'items': items
        }]
    for relation in relations:
        relation['items'] = []
    for item in items:
        min_distance = math.inf
        current_relation = None
        for relation in relations:
            distance = abs(relation['center_x'] - item['center_x'])
            if distance < min_distance:
                min_distance = distance
                current_relation = relation
        current_relation['items'].append(item)
    return relations


def sort_by_position(relations):
    relations.sort(key=lambda e: e['center_x'] if 'center_x' in e else 0)
    for relation in relations:
        relation['items'].sort(key=lambda e: (e['center_y'], e['center_x']))
    return relations


def read_text(image_data, relations, items):
    for elem in (relations + items):
        elem_image = image_data[elem['zone'][0]:elem['zone'][1], elem['zone'][2]:elem['zone'][3]]
        elem['text'] = ocr_utils.read_text(elem_image)
    return relations, items


def prepare_response_data(relations):
    for relation in relations:
        relation.pop('zone', None)
        relation.pop('type', None)
        relation.pop('center_x', None)
        relation.pop('center_y', None)
        for item in relation['items']:
            item.pop('zone', None)
            item.pop('type', None)
            item.pop('center_x', None)
            item.pop('center_y', None)
    return relations
