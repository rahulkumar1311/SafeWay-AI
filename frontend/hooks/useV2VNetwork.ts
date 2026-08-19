import { useState, useEffect, useRef, useCallback } from 'react';
import mapHazardEventBus from '@/services/mapHazardEventBus';

export interface NearbyVehicle {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: 'NORMAL' | 'WARNING' | 'EMERGENCY' | 'HELP_NEEDED';
  distanceMeters: number;
  direction: string;
  lastSeen: number;
}

export interface V2VSafetyAlert {
  id: string;
  type: string;
  sourceVehicleId: string;
  latitude: number;
  longitude: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: string;
  distanceMeters: number;
  direction: string;
}

export interface IncomingHelpRequest {
  requestId: string;
  requestVehicleId: string;
  requestSessionId: string;
  latitude: number;
  longitude: number;
  message: string;
  timestamp: string;
  distanceMeters: number;
  direction: string;
}

export interface UseV2VNetworkOptions {
  vehicleId?: string;
  latitude: number | null;
  longitude: number | null;
  speedKmH?: number | null;
  heading?: number | null;
  driverStatus?: 'NORMAL' | 'WARNING' | 'EMERGENCY' | 'HELP_NEEDED';
}

export function useV2VNetwork(options: UseV2VNetworkOptions) {
  const {
    vehicleId = `SAFEWAY_VEHICLE_${Math.floor(1000 + Math.random() * 9000)}`,
    latitude,
    longitude,
    speedKmH = 0,
    heading = 0,
    driverStatus = 'NORMAL'
  } = options;

  const [v2vStatus, setV2vStatusState] = useState<'CONNECTING' | 'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [nearbyVehicles, setNearbyVehicles] = useState<NearbyVehicle[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<V2VSafetyAlert[]>([]);
  const [activeHelpRequest, setActiveHelpRequest] = useState<IncomingHelpRequest | null>(null);
  const [helpResponseStatus, setHelpResponseStatus] = useState<string | null>(null);

  // Refs for stable WebSocket lifecycle
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Store latest options in a Ref to avoid re-triggering connection effect on location updates
  const optionsRef = useRef({ vehicleId, latitude, longitude, speedKmH, heading, driverStatus });
  useEffect(() => {
    optionsRef.current = { vehicleId, latitude, longitude, speedKmH, heading, driverStatus };
  }, [vehicleId, latitude, longitude, speedKmH, heading, driverStatus]);

  // Idempotent status updater to prevent React re-render loops
  const setV2vStatus = useCallback((nextStatus: 'CONNECTING' | 'ONLINE' | 'OFFLINE') => {
    if (!isMountedRef.current) return;
    setV2vStatusState((prev) => (prev === nextStatus ? prev : nextStatus));
  }, []);

  // Compute WebSocket URL cleanly
  const getWsUrl = useCallback(() => {
    if (typeof window === 'undefined') return 'ws://127.0.0.1:5000/v2v';
    const host = window.location.hostname || '127.0.0.1';
    const port = process.env.NEXT_PUBLIC_WS_PORT || '5000';
    return `ws://${host}:${port}/v2v`;
  }, []);

  // Handle incoming WebSocket messages
  const handleIncomingMessage = useCallback((event: MessageEvent) => {
    if (!isMountedRef.current) return;

    try {
      const payload = JSON.parse(event.data);
      if (!payload || !payload.type) return;

      switch (payload.type) {
        case 'REGISTER_SUCCESS':
        case 'NEARBY_VEHICLES_UPDATE':
          if (Array.isArray(payload.nearbyVehicles)) {
            setNearbyVehicles(payload.nearbyVehicles);
          }
          break;

        case 'SAFETY_EVENT_ALERT':
          if (payload.event) {
            const alert: V2VSafetyAlert = payload.event;
            console.log(`[V2V Network] Safety alert received: ${alert.type} (${alert.distanceMeters}m ${alert.direction})`);
            setSafetyAlerts((prev) => [alert, ...prev.slice(0, 19)]);

            mapHazardEventBus.publish({
              id: alert.id,
              type: alert.type === 'ACCIDENT_DETECTED' ? 'accident_incident' : 'road_hazard',
              label: `⚠️ V2V: ${alert.message} (${alert.distanceMeters}m ${alert.direction})`,
              latitude: alert.latitude,
              longitude: alert.longitude,
              confidence: 0.95,
              riskLevel: alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'CRITICAL' : 'WARNING',
              timestamp: alert.timestamp
            });
          }
          break;

        case 'INCOMING_HELP_REQUEST':
          console.log(`[V2V Network] Help request from ${payload.requestVehicleId}`);
          setActiveHelpRequest({
            requestId: payload.requestId,
            requestVehicleId: payload.requestVehicleId,
            requestSessionId: payload.requestSessionId,
            latitude: payload.latitude,
            longitude: payload.longitude,
            message: payload.message,
            timestamp: payload.timestamp,
            distanceMeters: payload.distanceMeters,
            direction: payload.direction
          });
          break;

        case 'HELP_OFFER_ACCEPTED':
          setHelpResponseStatus(payload.message || 'Vehicle nearby has accepted your help request.');
          setTimeout(() => {
            if (isMountedRef.current) setHelpResponseStatus(null);
          }, 10000);
          break;

        case 'HELP_REQUEST_CANCELLED':
          setActiveHelpRequest((prev) => (prev?.requestId === payload.requestId ? null : prev));
          break;
      }
    } catch (err) {
      console.warn('[V2V Network] Message parse error:', err);
    }
  }, []);

  // Primary connection function with bounded exponential backoff retry logic
  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    // Do not reconnect if already open or connecting
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const wsUrl = getWsUrl();
    console.log(`[V2V Network] Connecting to ${wsUrl} (Attempt #${reconnectCountRef.current + 1})...`);
    setV2vStatus('CONNECTING');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        console.log('[V2V Network] Connected successfully.');
        reconnectCountRef.current = 0;
        setV2vStatus('ONLINE');

        // Initial Registration
        const cur = optionsRef.current;
        if (cur.latitude !== null && cur.longitude !== null) {
          ws.send(
            JSON.stringify({
              type: 'REGISTER_VEHICLE',
              vehicleId: cur.vehicleId,
              latitude: cur.latitude,
              longitude: cur.longitude,
              speed: cur.speedKmH || 0,
              heading: cur.heading || 0,
              status: cur.driverStatus
            })
          );
        }
      };

      ws.onmessage = (evt) => handleIncomingMessage(evt);

      ws.onerror = (err) => {
        console.warn(`[V2V Network] WebSocket error connecting to ${wsUrl}`);
        // Let onclose handle state transition & controlled retry
      };

      ws.onclose = (evt) => {
        wsRef.current = null;
        if (!isMountedRef.current) return;

        console.log(`[V2V Network] Connection closed (code ${evt.code}).`);
        setV2vStatus('OFFLINE');
        setNearbyVehicles([]);

        // Controlled reconnect with exponential backoff (max 5 retries: 2s, 4s, 8s, 16s, 32s)
        if (reconnectCountRef.current < 5) {
          const backoffDelay = Math.min(32000, Math.pow(2, reconnectCountRef.current + 1) * 1000);
          reconnectCountRef.current += 1;
          console.log(`[V2V Network] Scheduling reconnect in ${backoffDelay}ms...`);
          reconnectTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) connect();
          }, backoffDelay);
        } else {
          console.warn('[V2V Network] Max reconnect retries reached. Driver can click Reconnect manually.');
        }
      };
    } catch (err: any) {
      console.error('[V2V Network] Failed to initialize WebSocket:', err.message);
      setV2vStatus('OFFLINE');
    }
  }, [getWsUrl, handleIncomingMessage, setV2vStatus]);

  // Establish WebSocket connection once on mount and clean up on unmount
  useEffect(() => {
    isMountedRef.current = true;
    connect();

    // Heartbeat location updates every 3 seconds using optionsRef
    heartbeatTimerRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const cur = optionsRef.current;
        if (cur.latitude !== null && cur.longitude !== null) {
          wsRef.current.send(
            JSON.stringify({
              type: 'LOCATION_UPDATE',
              vehicleId: cur.vehicleId,
              latitude: cur.latitude,
              longitude: cur.longitude,
              speed: cur.speedKmH || 0,
              heading: cur.heading || 0,
              status: cur.driverStatus
            })
          );
        }
      }
    }, 3000);

    return () => {
      isMountedRef.current = false;
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Helper method: Broadcast safety event
  const broadcastSafetyEvent = useCallback(
    (type: string, message: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH') => {
      const cur = optionsRef.current;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || cur.latitude === null || cur.longitude === null) {
        console.warn('[V2V Network] Cannot broadcast event: WebSocket offline or GPS location unavailable.');
        return false;
      }

      wsRef.current.send(
        JSON.stringify({
          type: 'BROADCAST_SAFETY_EVENT',
          event: {
            id: `v2v_evt_${Date.now()}`,
            type,
            latitude: cur.latitude,
            longitude: cur.longitude,
            severity,
            message,
            timestamp: new Date().toISOString()
          }
        })
      );
      return true;
    },
    []
  );

  // Helper method: Request help
  const requestHelp = useCallback(
    (message = 'Emergency! Driver requires assistance.') => {
      const cur = optionsRef.current;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || cur.latitude === null || cur.longitude === null) {
        return false;
      }

      wsRef.current.send(
        JSON.stringify({
          type: 'HELP_REQUEST',
          requestId: `help_${Date.now()}`,
          vehicleId: cur.vehicleId,
          latitude: cur.latitude,
          longitude: cur.longitude,
          message
        })
      );
      return true;
    },
    []
  );

  // Helper method: Accept incoming help request
  const acceptHelp = useCallback((requestId: string, requestVehicleId: string, requestSessionId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'HELP_ACCEPTED',
        requestId,
        requestVehicleId,
        requestSessionId
      })
    );
    setActiveHelpRequest(null);
  }, []);

  // Helper method: Cancel help request
  const cancelHelp = useCallback((requestId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'HELP_CANCELLED',
        requestId
      })
    );
    setActiveHelpRequest(null);
  }, []);

  // Manual reconnect handler
  const manualReconnect = useCallback(() => {
    reconnectCountRef.current = 0;
    connect();
  }, [connect]);

  return {
    vehicleId,
    v2vStatus,
    nearbyVehicles,
    safetyAlerts,
    activeHelpRequest,
    helpResponseStatus,
    broadcastSafetyEvent,
    requestHelp,
    acceptHelp,
    cancelHelp,
    reconnect: manualReconnect
  };
}

export default useV2VNetwork;
