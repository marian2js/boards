import numpy as np
import math
import functools
from config import config
from utils import image_utils
from utils import ocr_utils
from utils.logger import Logger

logger = Logger('data_utils')


def classify_image(image_data, model, y_conv, sess):
    """Classify an Image"""
    result = y_conv.eval(feed_dict={model.train_data: [image_data], model.keep_prob: 1.0}, session=sess)
    result = result[0]
    type = np.argmax(result)
    confidence = result[type]
    return type, confidence


def classify_with_window(image, targets, zone_marks, resize, model, y_conv, sess):
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
            if prediction in targets and confidence > config['match_min_confidence']:
                logger.debug('Prediction %d with confidence %f' % (prediction, confidence))

                matches.append({
                    'type': prediction,
                    'zone': zone
                })
                zone_marks[zone[0]:zone[1], zone[2]:zone[3]] = 1

    return matches


def localte_users(image, item, model, y_conv, sess):
    """Locate users in an item"""
    logger.info('Classifying users in item %s' % item)

    item_image = image[item['zone'][0]:item['zone'][1], item['zone'][2]:item['zone'][3]]
    zone_marks = np.zeros((item_image.shape[0], item_image.shape[1]))
    resize = 5
    targets = [2]

    matches = classify_with_window(item_image, targets, zone_marks, resize, model, y_conv, sess)
    for match in matches:
        match['zone'][0] += item['zone'][0]
        match['zone'][1] += item['zone'][0]
        match['zone'][2] += item['zone'][2]
        match['zone'][3] += item['zone'][2]

    return matches


def locate_labels(image, model, y_conv, sess):
    zone_marks = np.zeros((image.shape[0], image.shape[1]))
    resize = 21
    matches = []
    targets = [0, 1]
    matches += classify_with_window(image, targets, zone_marks, resize, model, y_conv, sess)
    matches += classify_with_window(image, targets, zone_marks, int(resize // pow(1.2, 2)), model, y_conv, sess)
    matches += classify_with_window(image, targets, zone_marks, int(resize // pow(1.2, 3)), model, y_conv, sess)
    matches += classify_with_window(image, targets, zone_marks, int(resize // pow(1.2, 4)), model, y_conv, sess)
    matches += classify_with_window(image, targets, zone_marks, int(resize // pow(1.2, 5)), model, y_conv, sess)

    relations = list(filter(lambda m: m['type'] == 1, matches))
    items = list(filter(lambda m: m['type'] == 0, matches))

    users = []
    for item in items:
        item['users'] = localte_users(image, item, model, y_conv, sess)
        users += item['users']

    for elem in (relations + items + users):
        elem.pop('type', None)

    return relations, items, users


def find_element_centers(relations, items):
    for elem in (relations + items):
        elem['center_x'] = (elem['zone'][3] - elem['zone'][2]) // 2 + elem['zone'][2]
        elem['center_y'] = (elem['zone'][1] - elem['zone'][0]) // 2 + elem['zone'][0]
    return relations, items


def find_relation_types(relations):
    # Set ids of each relation
    relation_id = 1
    for relation in relations:
        relation['id'] = relation_id
        relation_id += 1

    # Set vertical/horizontal relation type
    x_count = 0
    y_count = 0
    first_x_relation = min(relations, key=lambda r: r['zone'][2])
    first_y_relation = min(relations, key=lambda r: r['zone'][0])
    for relation in relations:
        if first_x_relation['id'] != relation['id'] and relation['zone'][2] < first_x_relation['center_x'] < relation['zone'][3]:
            relation['type'] = 'horizontal'
            x_count += 1
    for relation in relations:
        if first_y_relation['id'] != relation['id'] and relation['zone'][0] < first_y_relation['center_y'] < relation['zone'][1]:
            relation['type'] = 'vertical'
            y_count += 1
    if type not in first_x_relation and x_count > 0:
        first_x_relation['type'] = 'horizontal'
    if type not in first_y_relation and y_count > 0:
        first_y_relation['type'] = 'vertical'

    return relations


def group_by_relation(relations, items):
    vertical_relations = list(filter(lambda r: r['type'] == 'vertical', relations))
    horizontal_relations = list(filter(lambda r: r['type'] == 'horizontal', relations))
    for item in items:
        # Set vertical relations
        min_distance = math.inf
        current_relation = None
        for relation in vertical_relations:
            distance = abs(relation['center_x'] - item['center_x'])
            if distance < min_distance:
                min_distance = distance
                current_relation = relation
        if current_relation is not None:
            item['vertical_relation'] = current_relation['id']

        # Set horizontal relations
        min_distance = math.inf
        current_relation = None
        for relation in horizontal_relations:
            distance = abs(relation['center_y'] - item['center_y'])
            if distance < min_distance:
                min_distance = distance
                current_relation = relation
        if current_relation is not None:
            item['horizontal_relation'] = current_relation['id']

    return relations, items


def compare_relations(relation1, relation2):
    if relation1['type'] == 'horizontal' and relation2['type'] == 'vertical':
        return 1
    if relation1['type'] == 'vertical' and relation2['type'] == 'horizontal':
        return -1
    if relation1['type'] == 'vertical' and relation2['type'] == 'vertical':
        return relation1['center_x'] - relation2['center_x']
    if relation1['type'] == 'horizontal' and relation2['type'] == 'horizontal':
        return relation1['center_y'] - relation2['center_y']
    return 0


def sort_by_position(relations, items):
    relations.sort(key=functools.cmp_to_key(compare_relations))
    items.sort(key=lambda e: (e['center_y'], e['center_x']))
    return relations, items


def read_text(image_data, relations, items, lang):
    for elem in (relations + items):
        elem_image = image_data[elem['zone'][0]:elem['zone'][1], elem['zone'][2]:elem['zone'][3]]
        elem['text'] = ocr_utils.read_text(elem_image, lang)
    return relations, items


def prepare_response_data(relations, items, users):
    for elem in (relations + items + users):
        elem.pop('zone', None)
        elem.pop('center_x', None)
        elem.pop('center_y', None)
    return relations, items, users
