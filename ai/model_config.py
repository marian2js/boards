from config import config


class ModelConfig:

    def get_instance(self):
        return model_config

    def get(self, key):
        return config.get(key)


model_config = ModelConfig()
