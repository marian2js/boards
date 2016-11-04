from PIL import Image
import pyocr
import pyocr.builders

border_limit_color = 162
user_border_limit_color = 128
ocr = pyocr.get_available_tools()[0]


def read_text(image_data, lang='english'):
    text = ocr.image_to_string(
        Image.fromarray(image_data),
        lang=_map_language(lang),
        builder=pyocr.builders.TextBuilder()
    )
    if text == '':
        image_data = _remove_elem_border(image_data)
        text = ocr.image_to_string(
            Image.fromarray(image_data),
            lang=_map_language(lang),
            builder=pyocr.builders.TextBuilder()
        )
    return text


def read_user(image_data):
    txt = _read_user_two_letters(image_data)
    txt = ''.join([i for i in txt if i.isalpha()])
    if len(txt) != 2:
        txt = _read_user_one_letter(image_data)
        txt = ''.join([i for i in txt if i.isalpha()])
    return txt.upper()


def _read_user_one_letter(image_data):
    image_data = _remove_user_border(image_data, .1)
    return ocr.image_to_string(
        Image.fromarray(image_data),
        builder=pyocr.builders.TextBuilder(10)
    )


def _read_user_two_letters(image_data):
    image_data = _remove_user_border(image_data)
    return ocr.image_to_string(
        Image.fromarray(image_data),
        builder=pyocr.builders.TextBuilder(7)
    )


def _remove_elem_border(image, extra=0.):
    size = min(image.shape[0], image.shape[1])
    i = 0
    while _elem_has_up_border(image) and i < (size // 2) - 1:
        i += 1
        image = image[1:, :]
    i = 0
    while _elem_has_down_border(image) and i < (size // 2) - 1:
        i += 1
        image = image[:image.shape[0] - 1, :]
    i = 0
    while _elem_has_left_border(image) and i < (size // 2) - 1:
        i += 1
        image = image[:, 1:]
    i = 0
    while _elem_has_right_border(image) and i < (size // 2) - 1:
        i += 1
        image = image[:, :image.shape[1] - 1]
    return image


def _elem_has_up_border(image):
    color = sum(image[0]) / len(image[0])
    return color < border_limit_color


def _elem_has_down_border(image):
    color = sum(image[image.shape[0] - 1]) / len(image[image.shape[0] - 1])
    return color < border_limit_color


def _elem_has_left_border(image):
    color = sum(image[:, 0]) / len(image[:, 0])
    return color < border_limit_color


def _elem_has_right_border(image):
    color = sum(image[:, image.shape[1] - 1]) / len(image[:, image.shape[1] - 1])
    return color < border_limit_color


def _remove_user_border(image, extra=0.):
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
    return color > user_border_limit_color


def _map_language(lang):
    return {
        'english': 'eng',
        'spanish': 'spa',
    }.get(lang, 'eng')
