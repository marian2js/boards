import numpy as np
from random import shuffle
from six.moves import cPickle as pickle
from config import config
from utils import image_utils

tasks_train_dataset = image_utils.load_model_images(config['task']['folder'])
lists_train_dataset = image_utils.load_model_images(config['list']['folder'])
outliers_train_dataset = image_utils.load_model_images(config['outlier']['folder'])
labels = []

for i in range(len(tasks_train_dataset)):
    labels.append(0)
for i in range(len(lists_train_dataset)):
    labels.append(1)
for i in range(len(outliers_train_dataset)):
    labels.append(2)

dataset = tasks_train_dataset + lists_train_dataset + outliers_train_dataset

# Shuffle dataset
list1_shuf = []
list2_shuf = []
index_shuf = list(range(len(dataset)))
shuffle(index_shuf)
for i in index_shuf:
    list1_shuf.append(dataset[i])
    list2_shuf.append(labels[i])
dataset = np.asarray(list1_shuf)
labels = np.asarray(list2_shuf)

dataset = dataset.reshape((-1, config['image_size'], config['image_size']))

num_train = int(dataset.shape[0] * (1 - config['test_dataset_percentage']))

train_dataset = dataset[0:num_train]
train_labels = labels[0:num_train]

test_dataset = dataset[num_train:]
test_labels = labels[num_train:]

print('Train Dataset:', train_dataset.shape, train_labels.shape)
print('Test Dataset:', test_dataset.shape, test_labels.shape)

try:
    with open(config['dataset_pickle_file'], 'wb') as f:
        pickle_data = {
            'train_dataset': train_dataset,
            'train_labels': train_labels,
            'test_dataset': test_dataset,
            'test_labels': test_labels,
        }
        pickle.dump(pickle_data, f, pickle.HIGHEST_PROTOCOL)
        print('Created pickle: %s' % config['dataset_pickle_file'])
except Exception as e:
    print('Error creating pickle: %s' % config['dataset_pickle_file'], e)