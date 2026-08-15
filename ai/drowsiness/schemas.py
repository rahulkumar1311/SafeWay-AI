from pydantic import BaseModel, Field
from typing import Optional

class DrowsinessRequest(BaseModel):
    sessionId: Optional[str] = Field(
        default="default_session",
        description="Camera session identifier"
    )
    frameData: str = Field(
        ...,
        description="Base64 encoded image frame"
    )

class DrowsinessResponse(BaseModel):
    drowsinessScore: int = Field(
        ...,
        ge=0,
        le=100,
        description="Drowsiness score between 0 and 100"
    )
    isDrowsy: bool = Field(
        ...,
        description="True if driver is detected as drowsy"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model confidence level (0.0 to 1.0)"
    )
    alertState: Optional[str] = Field(
        default="NORMAL",
        description="Current driver state machine stage: NORMAL, WARNING, DROWSY, or ALERT"
    )
