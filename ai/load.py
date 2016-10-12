import numpy as np
from random import shuffle
from six.moves import cPickle as pickle
from config import config
from utils import image_utils
from utils.logger import Logger

logger = Logger('load')

items_train_dataset = image_utils.load_model_images(config['item']['folder'])
relations_train_dataset = image_utils.load_model_images(config['relation']['folder'])
users_train_dataset = image_utils.load_model_images(config['user']['folder'])
outliers_train_dataset = image_utils.load_model_images(config['outlier']['folder'])
labels = []

for i in range(len(items_train_dataset)):
    labels.append(0)
for i in range(len(relations_train_dataset)):
    labels.append(1)
for i in range(len(users_train_dataset)):
    labels.append(2)
for i in range(len(outliers_train_dataset)):
    labels.append(3)

dataset = items_train_dataset + relations_train_dataset + users_train_dataset + outliers_train_dataset

# Shuffle dataset
relation1_shuf = []
relation2_shuf = []
index_shuf = list(range(len(dataset)))
shuffle(index_shuf)
for i in index_shuf:
    relation1_shuf.append(dataset[i])
    relation2_shuf.append(labels[i])
dataset = np.asarray(relation1_shuf)
labels = np.asarray(relation2_shuf)

dataset = dataset.reshape((-1, config['image_size'], config['image_size']))

num_train = int(dataset.shape[0] * (1 - config['test_dataset_percentage']))

train_dataset = dataset[0:num_train]
train_labels = labels[0:num_train]

test_dataset = dataset[num_train:]
test_labels = labels[num_train:]

logger.info('Train Dataset: %s %s' % (train_dataset.shape, train_labels.shape))
logger.info('Test Dataset: %s %s' % (test_dataset.shape, test_labels.shape))

try:
    with open(config['dataset_pickle_file'], 'wb') as f:
        pickle_data = {
            'train_dataset': train_dataset,
            'train_labels': train_labels,
            'test_dataset': test_dataset,
            'test_labels': test_labels,
        }
        pickle.dump(pickle_data, f, pickle.HIGHEST_PROTOCOL)
        logger.info('Created pickle: %s' % config['dataset_pickle_file'])
except Exception as e:
    logger.error('Error creating pickle: %s' % config['dataset_pickle_file'], e)