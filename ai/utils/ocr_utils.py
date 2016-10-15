from PIL import Image
import pyocr
import pyocr.builders

ocr = pyocr.get_available_tools()[0]


def read_text(image_data, lang='english'):
    return ocr.image_to_string(
        Image.fromarray(image_data),
        lang=_map_language(lang),
        builder=pyocr.builders.TextBuilder()
    )


def _map_language(lang):
    return {
        'english': 'eng',
        'spanish': 'spa',
    }.get(lang, 'eng')
