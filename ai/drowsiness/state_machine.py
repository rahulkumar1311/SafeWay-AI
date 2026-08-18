import time
from enum import Enum
from typing import Dict, Any
from common.config import settings
from common.logger import logger

class AlertState(str, Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    DROWSY = "DROWSY"
    ALERT = "ALERT"

class SessionStateMachine:
    """
    State machine for a single driver session to confirm state transitions and prevent alert spamming.
    States: NORMAL -> WARNING -> DROWSY -> ALERT
    """
    def __init__(self, session_id: str):
        self.session_id: str = session_id
        self.current_state: AlertState = AlertState.NORMAL
        self.consecutive_high_frames: int = 0
        self.consecutive_low_frames: int = 0
        self.last_alert_time: float = 0.0

    def process_frame(
        self,
        drowsiness_score: int,
        is_drowsy_instant: bool,
        consecutive_closed_frames: int,
        consecutive_yawn_frames: int
    ) -> AlertState:
        """
        Evaluates frame metrics against state transition rules & cooldown to determine new state.
        """
        now = time.time()
        time_since_last_alert = now - self.last_alert_time

        # 1. State Evaluation Logic based on score and consecutive frame indicators
        if self.current_state == AlertState.NORMAL:
            if drowsiness_score >= settings.STATE_ALERT_THRESHOLD or consecutive_closed_frames >= settings.CONSECUTIVE_ALERT_FRAMES:
                self.consecutive_high_frames += 1
                if self.consecutive_high_frames >= settings.CONSECUTIVE_WARNING_FRAMES:
                    self.current_state = AlertState.DROWSY
                    self.consecutive_high_frames = 0
            elif drowsiness_score >= settings.STATE_DROWSY_THRESHOLD or consecutive_closed_frames >= 2:
                self.consecutive_high_frames += 1
                if self.consecutive_high_frames >= settings.CONSECUTIVE_WARNING_FRAMES:
                    self.current_state = AlertState.WARNING
                    self.consecutive_high_frames = 0
            elif drowsiness_score >= settings.STATE_WARNING_THRESHOLD or consecutive_yawn_frames >= 2:
                self.current_state = AlertState.WARNING
            else:
                self.consecutive_high_frames = 0

        elif self.current_state == AlertState.WARNING:
            if drowsiness_score >= settings.STATE_ALERT_THRESHOLD or consecutive_closed_frames >= settings.CONSECUTIVE_ALERT_FRAMES:
                self.consecutive_high_frames += 1
                if self.consecutive_high_frames >= settings.CONSECUTIVE_DROWSY_FRAMES:
                    self.current_state = AlertState.ALERT
                    self.last_alert_time = now
                    self.consecutive_high_frames = 0
            elif drowsiness_score >= settings.STATE_DROWSY_THRESHOLD or consecutive_closed_frames >= settings.CONSECUTIVE_CLOSED_FRAMES_ALERT:
                self.consecutive_high_frames += 1
                if self.consecutive_high_frames >= settings.CONSECUTIVE_DROWSY_FRAMES:
                    self.current_state = AlertState.DROWSY
                    self.consecutive_high_frames = 0
            elif drowsiness_score < settings.STATE_WARNING_THRESHOLD and consecutive_closed_frames == 0:
                self.consecutive_low_frames += 1
                if self.consecutive_low_frames >= 2:
                    self.current_state = AlertState.NORMAL
                    self.consecutive_low_frames = 0
            else:
                self.consecutive_high_frames = 0
                self.consecutive_low_frames = 0

        elif self.current_state == AlertState.DROWSY:
            if drowsiness_score >= settings.STATE_ALERT_THRESHOLD or consecutive_closed_frames >= settings.CONSECUTIVE_ALERT_FRAMES:
                self.consecutive_high_frames += 1
                if self.consecutive_high_frames >= settings.CONSECUTIVE_ALERT_FRAMES:
                    self.current_state = AlertState.ALERT
                    self.last_alert_time = now
                    self.consecutive_high_frames = 0
            elif drowsiness_score < settings.STATE_DROWSY_THRESHOLD and consecutive_closed_frames < 2:
                self.consecutive_low_frames += 1
                if self.consecutive_low_frames >= 2:
                    self.current_state = AlertState.WARNING
                    self.consecutive_low_frames = 0

        elif self.current_state == AlertState.ALERT:
            # Check Cooldown to prevent alert spamming
            if time_since_last_alert < settings.ALERT_COOLDOWN_SECONDS:
                # Maintain ALERT state during cooldown window
                return AlertState.ALERT

            # Post-cooldown recovery evaluation
            if drowsiness_score < settings.STATE_DROWSY_THRESHOLD and consecutive_closed_frames == 0:
                self.consecutive_low_frames += 1
                if self.consecutive_low_frames >= 3:
                    self.current_state = AlertState.WARNING
                    self.consecutive_low_frames = 0
            else:
                self.consecutive_low_frames = 0

        return self.current_state


class DrowsinessAlertSystem:
    """
    Manager for per-session Drowsiness State Machines.
    """
    def __init__(self):
        self.session_machines: Dict[str, SessionStateMachine] = {}

    def get_or_create_machine(self, session_id: str) -> SessionStateMachine:
        if session_id not in self.session_machines:
            self.session_machines[session_id] = SessionStateMachine(session_id)
        return self.session_machines[session_id]

    def evaluate_state(
        self,
        session_id: str,
        drowsiness_score: int,
        is_drowsy_instant: bool,
        consecutive_closed_frames: int,
        consecutive_yawn_frames: int
    ) -> str:
        """
        Evaluates state transition for a session and returns state string ("NORMAL", "WARNING", "DROWSY", "ALERT").
        """
        machine = self.get_or_create_machine(session_id)
        state_enum = machine.process_frame(
            drowsiness_score=drowsiness_score,
            is_drowsy_instant=is_drowsy_instant,
            consecutive_closed_frames=consecutive_closed_frames,
            consecutive_yawn_frames=consecutive_yawn_frames
        )
        return state_enum.value

alert_system = DrowsinessAlertSystem()
