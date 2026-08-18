from typing import Dict, Any
from common.image_decoder import decode_base64_image
from common.logger import logger
from drowsiness.face_detector import face_detector
from drowsiness.eye_analyzer import eye_analyzer
from drowsiness.yawn_analyzer import yawn_analyzer
from drowsiness.temporal_tracker import temporal_tracker
from drowsiness.scoring import drowsiness_scorer
from drowsiness.state_machine import alert_system

class DrowsinessService:
    """
    Coordinates real-time Computer Vision Detection, Temporal Tracking, and State Machine Alerts.
    """
    def analyze_frame(self, session_id: str, frame_data: str) -> Dict[str, Any]:
        """
        Processes frame data, evaluates score, and steps the alert state machine.
        Does NOT store images on disk.
        """
        logger.info(f"Processing drowsiness frame for session: '{session_id}'")

        # 1. Image decoding (memory-only array, raises ValueError on invalid payload)
        image = decode_base64_image(frame_data)

        # 2. Face detection & primary face selection
        detection_res = face_detector.detect_primary_face(image)

        # 3. Eye landmark & EAR analysis
        eye_res = eye_analyzer.analyze(detection_res)

        # 4. Mouth landmark & MAR yawn analysis
        yawn_res = yawn_analyzer.analyze(detection_res)

        # 5. Instantaneous score for temporal tracking
        inst_score = (eye_res["eye_fatigue_score"] * 0.65) + (yawn_res["yawn_fatigue_score"] * 0.35)

        # 6. Temporal state tracking across frames
        temporal_res = temporal_tracker.update_state(
            session_id=session_id,
            is_closed=eye_res["is_closed"],
            is_yawning=yawn_res["is_yawning"],
            instantaneous_score=inst_score
        )

        # 7. Computer Vision Score & Confidence computation
        result = drowsiness_scorer.compute(
            detection_result=detection_res,
            eye_result=eye_res,
            yawn_result=yawn_res,
            temporal_result=temporal_res
        )

        # 8. State Machine Alert Transition & Cooldown Evaluation (separated logic)
        alert_state = alert_system.evaluate_state(
            session_id=session_id,
            drowsiness_score=result["drowsinessScore"],
            is_drowsy_instant=result["isDrowsy"],
            consecutive_closed_frames=temporal_res["consecutive_closed_frames"],
            consecutive_yawn_frames=temporal_res["consecutive_yawn_frames"]
        )

        result["alertState"] = alert_state

        logger.info(
            f"Session '{session_id}' | Score: {result['drowsinessScore']} | "
            f"isDrowsy: {result['isDrowsy']} | State: {alert_state} | Confidence: {result['confidence']}"
        )

        return result

drowsiness_service = DrowsinessService()
