from PIL import Image, ImageFilter



def flip(image):
    # path_list = []
    img = image.transpose(Image.FLIP_LEFT_RIGHT)
    img = image.transpose(Image.FLIP_TOP_BOTTOM)
    return img


def rotate(image):
    img = image.transpose(Image.ROTATE_90)
    img = image.transpose(Image.ROTATE_180)
    img = image.transpose(Image.ROTATE_270)
    return img


def filter_image(image):
    img = image.filter(ImageFilter.BLUR)
    img = image.filter(ImageFilter.CONTOUR)
    img = image.filter(ImageFilter.SHARPEN)
    return img


def gray_scale(image):
    img = image.convert('L')
    return img


def resize(image):
    return image.thumbnail((128, 128))