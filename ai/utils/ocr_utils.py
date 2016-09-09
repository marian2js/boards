from PIL import Image
import pyocr
import pyocr.builders

ocr = pyocr.get_available_tools()[0]


def read_text(image_data):
    return ocr.image_to_string(
        Image.fromarray(image_data),
        lang='eng',
        builder=pyocr.builders.TextBuilder()
    )
