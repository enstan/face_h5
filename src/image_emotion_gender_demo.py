import sys
sys.path.append('../')

import cv2
from keras.models import load_model
import numpy as np
from utils.datasets import get_labels
from utils.inference import detect_faces
from utils.inference import draw_text
from utils.inference import draw_bounding_box
from utils.inference import apply_offsets
from utils.inference import load_detection_model
from utils.inference import load_image
from utils.preprocessor import preprocess_input

def exe_c(path):
    image_path = path                                  #!!!获取图片路径的赋值到image_path

    # parameters for loading data and images                    加载数据和图片的参数
        #sys.argv[1]
    img_i=1
    detection_model_path = '../trained_models/detection_models/haarcascade_frontalface_default.xml'
    emotion_model_path = '../trained_models/emotion_models/fer2013_mini_XCEPTION.102-0.66.hdf5'
    gender_model_path = '../trained_models/gender_models/simple_CNN.81-0.96.hdf5'
    emotion_labels = get_labels('fer2013')
    gender_labels = get_labels('imdb')
    font = cv2.FONT_HERSHEY_SIMPLEX

    # hyper-parameters for bounding boxes shape                     边框大小——的超参数
    #gender_offsets = (18, 25)
    gender_offsets = (10, 10)
    #emotion_offsets = (18, 25)
    emotion_offsets = (0, 0)

    # loading models                                                加载模型__face_detection,emotion_classifier,gender_classifier
    face_detection = load_detection_model(detection_model_path)
    emotion_classifier = load_model(emotion_model_path, compile=False)
    gender_classifier = load_model(gender_model_path, compile=False)

    # getting input model shapes for inference                      获取输入模型的引用
    emotion_target_size = emotion_classifier.input_shape[1:3]
    gender_target_size = gender_classifier.input_shape[1:3]

    # loading images                                                 加载图片
    rgb_image = load_image(image_path, grayscale=False)
    gray_image = load_image(image_path, grayscale=True)
    gray_image = np.squeeze(gray_image)
    gray_image = gray_image.astype('uint8')

    faces = detect_faces(face_detection, gray_image)                 #检测脸（face_detection，灰度图像？）

    Jsons = []
    for inx, face_coordinates in enumerate(faces):                   #enumerate 循环获取出inx值
        x1, x2, y1, y2 = apply_offsets(face_coordinates, gender_offsets)
        rgb_face = rgb_image[y1:y2, x1:x2]

        x1, x2, y1, y2 = apply_offsets(face_coordinates, emotion_offsets)
        gray_face = gray_image[y1:y2, x1:x2]

        try:
            rgb_face = cv2.resize(rgb_face, (gender_target_size))
            gray_face = cv2.resize(gray_face, (emotion_target_size))
        except:
            continue

        rgb_face = preprocess_input(rgb_face, False)
        rgb_face = np.expand_dims(rgb_face, 0)
        gender_prediction = gender_classifier.predict(rgb_face)
        gender_label_arg = np.argmax(gender_prediction)
        gender_text = gender_labels[gender_label_arg]

        #jsonp['gender_text'] = gender_text                           #添加jsonp的gender标签

        gray_face = preprocess_input(gray_face, True)
        gray_face = np.expand_dims(gray_face, 0)
        gray_face = np.expand_dims(gray_face, -1)
        emotion_label_arg = np.argmax(emotion_classifier.predict(gray_face))
        emotion_text = emotion_labels[emotion_label_arg]

       # jsonp['emotion_text'] = emotion_text                        #添加jsonp的emotion标签

        if gender_text == gender_labels[0]:
            color = (0, 0, 255)
        else:
            color = (255, 0, 0)

        draw_bounding_box(face_coordinates, rgb_image, color)
        draw_text(face_coordinates, rgb_image, gender_text, color, 0, -20, 1, 2)
        draw_text(face_coordinates, rgb_image, emotion_text, color, 0, -50, 1, 2)

        #以下是bound列表转换成字典的方法
        bound_key=['x','y','w','h']
        c_x,c_y,c_w,c_h=face_coordinates
        bound_xy=[str(c_x),str(c_y),str(c_w),str(c_h)]
        bound_box = dict(zip(bound_key, bound_xy))
        print(gender_text)

        Jsons.append({'person':inx,"gender":gender_text,"emotion":emotion_text,'bound_box':bound_box})     #循环添加jsonp字典到jsons列表
    bgr_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
    img_i+=1
    cv2.imwrite('../images/upload/result/predict_img'+str(img_i)+'.png', bgr_image)             #将opencv2写出图像到指定路径

        #{'gender':gender_text,'emotion':emotion_text}
    return Jsons
#exe_c('../images/gather.png')
