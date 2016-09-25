
config = {
    'dataset_pickle_file': './dataset.pickle',
    'model_file': './model.ckpt',
    'num_labels': 3,
    'image_size': 28,
    'image_channels': 1,
    'test_dataset_percentage': 0.05,
    'item': {
        'original_folder': './dataset/items_original',
        'objects_folder': './dataset/item_objects',
        'generated_folder': './dataset/items_generated',
        'folder': './dataset/items'
    },
    'list': {
        'original_folder': './dataset/lists_original',
        'objects_folder': './dataset/list_objects',
        'generated_folder': './dataset/lists_generated',
        'folder': './dataset/lists'
    },
    'backgrounds': {
        'original_folder': './dataset/backgrounds'
    },
    'outlier': {
        'original_folder': './dataset/outliers_original',
        'folder': './dataset/outliers'
    },
    'match_min_confidence': 0.8,
    'match_max_shared_zone': 0.2,
    'log_level': 'DEBUG'
}