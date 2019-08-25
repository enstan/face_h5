import sys,os

from pathlib import Path
import cv2
import dlib
import numpy as np
from contextlib import contextmanager

from keras.utils.data_utils import get_file
from keras.applications import ResNet50, InceptionResNetV2
from keras.layers import Dense
from keras.models import Model
#同级目录加一点

pretrained_model = "https://github.com/yu4u/age-gender-estimation/releases/download/v0.5/age_only_resnet50_weights.061-3.300-4.410.hdf5"
modhash = "306e44200d3f632a5dccac153c2966f2"

def get_model(model_name="ResNet50"):
    base_model = None

    if model_name == "ResNet50":
        base_model = ResNet50(include_top=False, weights='imagenet', input_shape=(224, 224, 3), pooling="avg")
    elif model_name == "InceptionResNetV2":
        base_model = InceptionResNetV2(include_top=False, weights='imagenet', input_shape=(299, 299, 3), pooling="avg")

    prediction = Dense(units=101, kernel_initializer="he_normal", use_bias=False, activation="softmax",
                       name="pred_age")(base_model.output)

    model = Model(inputs=base_model.input, outputs=prediction)

    return model

def draw_label(image, point, label, font=cv2.FONT_HERSHEY_SIMPLEX,
               font_scale=1, thickness=2):
    size = cv2.getTextSize(label, font, font_scale, thickness)[0]
    x, y = point
    cv2.rectangle(image, (x, y - size[1]), (x + size[0], y), (255, 0, 0), cv2.FILLED)
    cv2.putText(image, label, point, font, font_scale, (255, 255, 255), thickness)


@contextmanager
def video_capture(*args, **kwargs):
    cap = cv2.VideoCapture(*args, **kwargs)
    try:
        yield cap
    finally:
        cap.release()

def yield_images():
    # capture video
    with video_capture(0) as cap:
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

        while True:
            # get video frame
            ret, img = cap.read()
            if not ret:
                raise RuntimeError("Failed to capture image")
            yield img


def yield_images_from_dir(image_dir):
    image_dir = Path(image_dir)

    for image_path in image_dir.glob("*.*"):
        img = cv2.imread(str(image_path), 1)

        if img is not None:
            h, w, _ = img.shape
            #r = 640 / max(w, h)
            #yield cv2.resize(img, (int(w), int(h)))
            yield img

def age(path):
    model_name = "ResNet50"
    weight_file ='../trained_models/age_only.hdf5'
    margin = 0.5
    image_dir =path
    img_i=1

    if not weight_file:
        weight_file = get_file("age_only_resnet50_weights.061-3.300-4.410.hdf5", pretrained_model,
                               cache_subdir="pretrained_models",
                               file_hash=modhash, cache_dir=Path(__file__).resolve().parent)

    # for face detection
    detector = dlib.get_frontal_face_detector()

    # load model and weights
    model = get_model(model_name=model_name)
    model.load_weights(weight_file)
    img_size = model.input.shape.as_list()[1]

    image_generator = yield_images_from_dir(image_dir) if image_dir else yield_images()

    Jsons = []
    for img in image_generator:
        input_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_h, img_w, _ = np.shape(input_img)

        # detect faces using dlib detector
        detected = detector(input_img, 1)
        faces = np.empty((len(detected), img_size, img_size, 3))
        bound_box=[]
        if len(detected) > 0:
            for i, d in enumerate(detected):
                x1, y1, x2, y2, w, h = d.left(), d.top(), d.right() + 1, d.bottom() + 1, d.width(), d.height()
                xw1 = max(int(x1 - margin * w), 0)
                yw1 = max(int(y1 - margin * h), 0)
                xw2 = min(int(x2 + margin * w), img_w - 1)
                yw2 = min(int(y2 + margin * h), img_h - 1)
                cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 0), 2)
                faces[i, :, :, :] = cv2.resize(img[yw1:yw2 + 1, xw1:xw2 + 1, :], (img_size, img_size))

                # 以下是bound列表转换成字典的方法
                bound_key = ['x', 'y', 'w', 'h']
                c_x, c_y, c_w, c_h = x1, y1, w, h
                bound_xy = [str(c_x), str(c_y), str(c_w), str(c_h)]
                bound_box.append(dict(zip(bound_key, bound_xy)))

            # predict ages and genders of the detected faces
            results = model.predict(faces)
            ages = np.arange(0, 101).reshape(101, 1)
            predicted_ages = results.dot(ages).flatten()

            # draw results
            for i, d in enumerate(detected):
                label = str(int(predicted_ages[i]))
                draw_label(img, (d.left(), d.top()), label)

                Jsons.append({'person': i,'gender':'', "emotion": label,
                          'bound_box': bound_box[i]})  # 循环添加jsonp字典到jsons列表

       # cv2.imshow("result", img)
        img_i += 1
        cv2.imwrite('../images/upload/result/age_pre' + str(img_i) + '.png', img)  # 将opencv2写出图像到指定路径

    return Jsons

        #key = cv2.waitKey(-1) if image_dir else cv2.waitKey(30)
#
        #if key == 27:  # ESC
        #   break
#

