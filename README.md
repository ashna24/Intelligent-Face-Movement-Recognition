Computer Vision and Real-Time Face Detection

Project Overview:
This project explores advanced computer vision techniques using p5.js. It features real-time image processing, motion detection, and face tracking, with a focus on how different color spaces like RGB, HSV, and CMY affect detection accuracy.

Tech Stack:
The project was built using p5.js for canvas rendering and real-time video manipulation.
ObjectDetect.js was used for the implementation of object detection. \
Custom algorithms were written in JavaScript for color space conversion and motion tracking.

Key Features:
The system includes Face Tracking, which uses pre-trained frontal face classifiers to identify and track faces in a live video stream. It also features Multi-Channel Thresholding for real-time experimentation with Red, Green, and Blue channels to optimize contrast. Advanced Color Spaces were utilized through conversions to HSV (Hue, Saturation, Value) and CMY for cleaner detection in varying light conditions. Additionally, it incorporates Motion Detection using efficient frame-to-frame comparison logic to detect movement while filtering out background noise.

Technical Findings
Analysis showed that the Value component in HSV provides more consistent detection than RGB alone because it separates brightness from color. Regarding channel behavior, the Green channel was found to provide the most balanced and reliable results for general thresholding.

Context
This was developed as a Graphics Programming project to demonstrate the practical application of computer vision frameworks and pixel-level image manipulation.
