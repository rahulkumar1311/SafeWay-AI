/**
 * Notification Provider Service Abstraction
 * 
 * Note: Real-time SMS, WhatsApp, and Voice Call delivery are NOT implemented in the hackathon MVP.
 * This service acts as an extensible abstraction interface to allow seamless plug-and-play
 * integration of official notification providers (e.g. Twilio, AWS SNS, Firebase FCM) in production.
 */
export const dispatchEmergencyNotification = async ({
  userId,
  contacts = [],
  location,
  eventType = 'SOS',
  timestamp
}) => {
  const targetCount = Array.isArray(contacts) ? contacts.length : 0;

  if (targetCount === 0) {
    return {
      sent: false,
      status: 'NO_CONTACTS_REGISTERED',
      message: 'No emergency contacts registered for this user to dispatch notifications',
      targetContactsCount: 0,
      timestamp: timestamp || new Date().toISOString()
    };
  }

  // Explicitly return status indicating delivery provider is not implemented in MVP
  return {
    sent: false,
    status: 'NOT_IMPLEMENTED_MVP',
    message: 'Real-time SMS/Call/WhatsApp notification delivery is not implemented in hackathon MVP',
    targetContactsCount: targetCount,
    timestamp: timestamp || new Date().toISOString()
  };
};
