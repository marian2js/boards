
config = {
    'dataset_pickle_file': './dataset.pickle',
    'model_file': './model.ckpt',
    'num_labels': 4,
    'image_size': 28,
    'image_channels': 1,
    'test_dataset_percentage': 0.05,
    'item': {
        'original_folder': './dataset/items_original',
        'objects_folder': './dataset/item_objects',
        'generated_folder': './dataset/items_generated',
        'folder': './dataset/items'
    },
    'relation': {
        'original_folder': './dataset/relations_original',
        'objects_folder': './dataset/relation_objects',
        'generated_folder': './dataset/relations_generated',
        'folder': './dataset/relations'
    },
    'user': {
        'original_folder': './dataset/users_original',
        'folder': './dataset/users'
    },
    'backgrounds': {
        'original_folder': './dataset/backgrounds'
    },
    'outlier': {
        'original_folder': './dataset/outliers_original',
        'folder': './dataset/outliers'
    },
    'match_min_confidence': 0.9,
    'match_max_shared_zone': 0.35,
    'log_level': 'DEBUG'
}