import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * HTTP Integration Service for Drowsiness Detection AI Service
 */
export const analyzeDrowsinessFrame = async (inputData = {}) => {
  const { sessionId = 'default_session', frameData } = inputData;

  if (!frameData || typeof frameData !== 'string' || !frameData.trim()) {
    throw new ApiError(400, 'frameData is required for drowsiness analysis');
  }

  const serviceUrl = config.aiDrowsinessServiceUrl;
  const timeoutMs = config.aiServiceTimeoutMs;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        frameData
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `[AI Drowsiness Error] Remote service responded with status ${response.status}`
      );
      throw new ApiError(
        503,
        'AI Drowsiness Inference Service returned an error'
      );
    }

    const aiResult = await response.json();

    const rawScore =
      aiResult.drowsinessScore ??
      aiResult.drowsiness_score ??
      aiResult.score ??
      0;
    const scoreNum = Math.min(100, Math.max(0, Number(rawScore) || 0));

    const isDrowsy =
      aiResult.isDrowsy ??
      aiResult.is_drowsy ??
      scoreNum >= 70;

    const confidence =
      aiResult.confidence ??
      aiResult.confidenceScore ??
      1.0;

    return {
      sessionId,
      drowsinessScore: scoreNum,
      isDrowsy: Boolean(isDrowsy),
      confidence: Number(confidence) || 1.0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      console.error(`[AI Drowsiness Timeout] Request to AI service exceeded ${timeoutMs}ms`);
      throw new ApiError(
        504,
        'AI Drowsiness Inference Service request timed out'
      );
    }

    console.error(`[AI Drowsiness Connection Failed] ${error.message}`);
    throw new ApiError(
      503,
      'AI Drowsiness Inference Service is currently unavailable'
    );
  }
};

/**
 * HTTP Integration Service for Traffic Sign Recognition AI Service
 */
export const analyzeTrafficSignImage = async (inputData = {}) => {
  const { imageData, image } = inputData;
  const payloadData = imageData || image;

  if (!payloadData || typeof payloadData !== 'string' || !payloadData.trim()) {
    throw new ApiError(400, 'imageData is required for traffic sign recognition');
  }

  const serviceUrl = config.aiTrafficSignServiceUrl;
  const timeoutMs = config.aiServiceTimeoutMs;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        imageData: payloadData
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `[AI Traffic Sign Error] Remote service responded with status ${response.status}`
      );
      throw new ApiError(
        503,
        'AI Traffic Sign Inference Service returned an error'
      );
    }

    const aiResult = await response.json();

    // Map AI Inference Service response fields flexibly
    const signType =
      aiResult.signType ??
      aiResult.sign_type ??
      aiResult.label ??
      aiResult.type ??
      'UNKNOWN_SIGN';

    const meaning =
      aiResult.meaning ??
      aiResult.description ??
      aiResult.action ??
      'Traffic sign detected';

    const confidence =
      aiResult.confidence ??
      aiResult.confidenceScore ??
      1.0;

    return {
      signType: String(signType).trim(),
      meaning: String(meaning).trim(),
      confidence: Number(confidence) || 1.0,
      detectedAt: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      console.error(`[AI Traffic Sign Timeout] Request to AI service exceeded ${timeoutMs}ms`);
      throw new ApiError(
        504,
        'AI Traffic Sign Inference Service request timed out'
      );
    }

    console.error(`[AI Traffic Sign Connection Failed] ${error.message}`);
    throw new ApiError(
      503,
      'AI Traffic Sign Inference Service is currently unavailable'
    );
  }
};
