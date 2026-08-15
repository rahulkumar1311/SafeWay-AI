import os
import cv2
import numpy as np
from typing import Dict, Any, Tuple, List
from common.logger import logger

class FaceDetector:
    """
    OpenCV & Facial Feature Landmark Region Detector.
    Supports multi-face selection (selects primary driver face), low-light enhancement, and partial visibility detection.
    """
    def __init__(self):
        cascade_dir = cv2.data.haarcascades
        face_path = os.path.join(cascade_dir, 'haarcascade_frontalface_default.xml')
        eye_path = os.path.join(cascade_dir, 'haarcascade_eye.xml')

        self.face_cascade = cv2.CascadeClassifier(face_path)
        self.eye_cascade = cv2.CascadeClassifier(eye_path)

    def detect_primary_face(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Detects primary driver face from frame, handling multi-face, low contrast, and partial crop.
        """
        if image is None or image.size == 0:
            return {
                "face_detected": False,
                "confidence": 0.0,
                "reason": "Empty or invalid image frame"
            }

        # 1. Enhance low lighting & contrast via histogram equalization
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        enhanced_gray = cv2.equalizeHist(gray)
        img_h, img_w = gray.shape

        # 2. Detect face candidates
        faces = self.face_cascade.detectMultiScale(
            enhanced_gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(40, 40)
        )

        if len(faces) == 0:
            # Fallback: inspect full image for eyes/mouth if face is zoomed close-up
            eyes = self.eye_cascade.detectMultiScale(
                enhanced_gray[0:int(img_h * 0.6), :],
                scaleFactor=1.1,
                minNeighbors=3
            )
            confidence = 0.40 if len(eyes) > 0 else 0.20
            return {
                "face_detected": False,
                "confidence": confidence,
                "face_rect": (0, 0, img_w, img_h),
                "gray_roi": enhanced_gray,
                "upper_face_roi": enhanced_gray[0:int(img_h * 0.55), :],
                "lower_face_roi": enhanced_gray[int(img_h * 0.45):, :],
                "eyes": [(ex, ey, ew, eh) for (ex, ey, ew, eh) in eyes],
                "num_faces": 0
            }

        # 3. Multi-face handling: select primary face (largest area closest to frame center)
        frame_center_x, frame_center_y = img_w / 2.0, img_h / 2.0

        def primary_face_score(f):
            (x, y, w, h) = f
            area = w * h
            cx, cy = x + w / 2.0, y + h / 2.0
            dist = np.sqrt((cx - frame_center_x) ** 2 + (cy - frame_center_y) ** 2)
            return area - (dist * 10)

        best_face = max(faces, key=primary_face_score)
        (fx, fy, fw, fh) = best_face

        face_roi_gray = enhanced_gray[fy:fy+fh, fx:fx+fw]
        upper_roi = face_roi_gray[0:int(fh * 0.55), :]
        lower_roi = face_roi_gray[int(fh * 0.45):, :]

        # Detect eyes within selected face ROI
        eyes = self.eye_cascade.detectMultiScale(
            upper_roi,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(15, 15)
        )

        # Confidence calculation based on face scale & eye visibility
        face_area_ratio = (fw * fh) / float(img_w * img_h)
        base_confidence = min(0.95, 0.70 + (face_area_ratio * 0.5))
        if len(eyes) >= 2:
            base_confidence = min(0.98, base_confidence + 0.10)

        return {
            "face_detected": True,
            "confidence": round(base_confidence, 2),
            "face_rect": (fx, fy, fw, fh),
            "gray_roi": face_roi_gray,
            "upper_face_roi": upper_roi,
            "lower_face_roi": lower_roi,
            "eyes": [(ex, ey, ew, eh) for (ex, ey, ew, eh) in eyes],
            "num_faces": len(faces)
        }

face_detector = FaceDetector()
