import numpy as np
from typing import Dict, Any, List
from common.config import settings
from common.logger import logger

class EyeAnalyzer:
    """
    Computes Eye Aspect Ratio (EAR) metric and eye closure signal.
    """

    def analyze(self, detection_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates EAR metric and eye closure state based on configurable EAR_THRESHOLD.
        """
        upper_roi = detection_result.get("upper_face_roi")
        eyes = detection_result.get("eyes", [])

        ear_values = []
        if len(eyes) > 0:
            for (ex, ey, ew, eh) in eyes:
                if ew > 0:
                    aspect_ratio = float(eh) / float(ew)
                    ear_values.append(aspect_ratio)

        if ear_values:
            ear = float(np.mean(ear_values))
        elif upper_roi is not None and upper_roi.size > 0:
            # Fallback estimation using upper facial region contrast / std deviation
            std_dev = float(np.std(upper_roi))
            ear = min(0.35, max(0.10, std_dev / 140.0))
        else:
            ear = settings.EAR_THRESHOLD + 0.05

        # EAR comparison against threshold (EAR < settings.EAR_THRESHOLD e.g. 0.21)
        is_closed = ear < settings.EAR_THRESHOLD

        # Map EAR to eye fatigue score (0.0 to 100.0)
        if ear < (settings.EAR_THRESHOLD - 0.06):
            eye_score = 100.0
        elif ear < settings.EAR_THRESHOLD:
            diff = settings.EAR_THRESHOLD - ear
            eye_score = 50.0 + (diff / 0.06) * 50.0
        elif ear < (settings.EAR_THRESHOLD + 0.05):
            diff = (settings.EAR_THRESHOLD + 0.05) - ear
            eye_score = (diff / 0.05) * 50.0
        else:
            eye_score = 0.0

        return {
            "ear": round(ear, 3),
            "is_closed": is_closed,
            "eye_fatigue_score": round(eye_score, 1)
        }

eye_analyzer = EyeAnalyzer()
