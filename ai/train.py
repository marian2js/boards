import numpy as np
from six.moves import cPickle as pickle
from model import Model
from model_config import model_config
from training_session import TrainingSession
from utils.logger import Logger

logger = Logger('train')


def reformat(dataset, labels):
    dataset = np.asarray(dataset)
    labels = np.asarray(labels)
    dataset = dataset.reshape((-1, image_size, image_size, num_channels)).astype(np.float32)
    labels = (np.arange(num_labels) == labels[:, None]).astype(np.float32)
    return dataset, labels

with open(model_config.get('dataset_pickle_file'), 'rb') as f:
    pickle_data = pickle.load(f)
    train_dataset = pickle_data['train_dataset']
    train_labels = pickle_data['train_labels']
    test_dataset = pickle_data['test_dataset']
    test_labels = pickle_data['test_labels']
    del pickle_data

image_size = model_config.get('image_size')
num_labels = model_config.get('num_labels')
num_channels = model_config.get('image_channels')

train_dataset, train_labels = reformat(train_dataset, train_labels)
test_dataset, test_labels = reformat(test_dataset, test_labels)

logger.info('Training set %s %s' % (train_dataset.shape, train_labels.shape))
logger.info('Test set %s %s' % (test_dataset.shape, test_labels.shape))

model = Model()
training_session = TrainingSession()
training_session.run_session(model, train_dataset, train_labels, test_dataset, test_labels)
