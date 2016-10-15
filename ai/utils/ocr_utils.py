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


def read_user(image_data):
    txt = _read_user_two_letters(image_data)
    txt = ''.join([i for i in txt if i.isalpha()])
    if len(txt) != 2:
        txt = _read_user_one_letter(image_data)
        txt = ''.join([i for i in txt if i.isalpha()])
    return txt.upper()


def _read_user_one_letter(image_data):
    image_data = _remove_border(image_data, .1)
    return ocr.image_to_string(
        Image.fromarray(image_data),
        builder=pyocr.builders.TextBuilder(10)
    )


def _read_user_two_letters(image_data):
    image_data = _remove_border(image_data)
    return ocr.image_to_string(
        Image.fromarray(image_data),
        builder=pyocr.builders.TextBuilder(7)
    )


def _remove_border(image, extra=0.):
    size = min(image.shape[0], image.shape[1])
    i = 0
    while _user_has_border(image) and i < size // 3:
        i += 1
        image = image[1:image.shape[0] - 1, 1:image.shape[1] - 1]
    for i in range(int(size * extra)):
        image = image[1:image.shape[0] - 1, 1:image.shape[1] - 1]
    return image


def _user_has_border(image):
    color = max(image[0, 0], image[image.shape[0] - 1, 0], image[0, image.shape[1] - 1],
                image[image.shape[0] - 1, image.shape[1] - 1])
    return color > 128


def _map_language(lang):
    return {
        'english': 'eng',
        'spanish': 'spa',
    }.get(lang, 'eng')
