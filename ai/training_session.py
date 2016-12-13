import tensorflow as tf
import time
from trainer import Trainer
from utils.logger import Logger

logger = Logger('Training Session')


class TrainingSession:
    def __init__(self):
        self.trainer = None
        self.sess = None
        self.graph = None
        self.saver = None
        self.num_training_steps = 10000

    def run_session(self, model, train_dataset, train_labels, test_dataset, test_labels):
        start_time = time.time()
        self.graph, init_op = self._create_graph(model)
        with tf.Session(graph=self.graph) as self.sess:
            self.sess.run(init_op)

            # Train the CNN
            self.trainer.train_model(self.num_training_steps, train_labels, train_dataset)

            # Evaluate test data
            self.trainer.evaluate_model(test_labels, test_dataset)

            # Train test data
            test_train_steps = int(self.num_training_steps * self.trainer.config.get('test_dataset_percentage'))
            self.trainer.train_model(test_train_steps, test_labels, test_dataset)

            logger.info("Training Time: %s seconds" % (time.time() - start_time))
            self._save_trained_model()

    def _save_trained_model(self):
        save_path = self.saver.save(self.sess, self.trainer.config.get('model_file'))
        logger.info("Model saved in file: %s" % save_path)

    def _create_graph(self, model):
        graph = tf.Graph()
        with graph.as_default():
            self.trainer = Trainer(model)

            # Add an op to initialize the variables.
            init_op = tf.initialize_all_variables()

            # Add ops to save and restore all the variables.
            self.saver = tf.train.Saver()

        return graph, init_op
