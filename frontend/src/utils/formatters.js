/**
 * Formatting helpers for SafeWay-AI Frontend
 */

export const formatConfidence = (confidence = 0) => {
  return `${(Number(confidence) * 100).toFixed(1)}%`;
};

export const formatDate = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString();
};
