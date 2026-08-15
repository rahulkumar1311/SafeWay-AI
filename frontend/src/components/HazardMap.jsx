import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDate } from '../utils/formatters';
import { AlertTriangle, CheckCircle2, Clock, MapPin } from 'lucide-react';

// Custom SVG Leaflet Markers based on hazard severity
const createCustomIcon = (severity = 'medium', status = 'active') => {
  let color = '#3b82f6'; // Blue
  if (status === 'resolved') {
    color = '#10b981'; // Green
  } else if (severity === 'high') {
    color = '#f43f5e'; // Red
  } else if (severity === 'medium') {
    color = '#f59e0b'; // Amber
  }

  const svgHtml = `
    <div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 12px ${color}80;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

export const HazardMap = ({
  hazards = [],
  center = [28.6139, 77.2090], // Default center (New Delhi / India coordinates)
  zoom = 12,
  searchRadiusKm = null,
  onResolveHazard
}) => {
  return (
    <div className="relative w-full h-[450px] rounded-3xl overflow-hidden glass-card border border-slate-800 shadow-2xl z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ background: '#0f172a' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Search Radius Circle Overlay when nearby search is active */}
        {searchRadiusKm && (
          <Circle
            center={center}
            radius={searchRadiusKm * 1000} // Radius in meters
            pathOptions={{
              color: '#06b6d4',
              fillColor: '#06b6d4',
              fillOpacity: 0.15,
              weight: 2
            }}
          />
        )}

        {/* User Search Center Point Marker */}
        <Marker position={center} icon={createCustomIcon('low', 'resolved')}>
          <Popup>
            <div className="p-1 text-slate-900 text-xs font-sans space-y-1">
              <strong className="flex items-center gap-1 text-cyan-600">
                <MapPin className="w-3.5 h-3.5" /> Center Search Point
              </strong>
              <p className="font-mono text-[10px]">
                Lat: {center[0].toFixed(4)}, Lng: {center[1].toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Render Hazard Markers */}
        {hazards.map((hazard) => {
          // Extract latitude and longitude correctly from hazard schema or GeoJSON location
          // IMPORTANT: GeoJSON location.coordinates format is [longitude, latitude]
          let lat = hazard.latitude;
          let lng = hazard.longitude;

          if ((lat == null || lng == null) && hazard.location?.coordinates?.length === 2) {
            // GeoJSON coordinates array: [longitude, latitude]
            lng = hazard.location.coordinates[0];
            lat = hazard.location.coordinates[1];
          }

          if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
            return null;
          }

          // Leaflet Marker position expects [latitude, longitude]
          const markerPosition = [Number(lat), Number(lng)];

          return (
            <Marker
              key={hazard._id || `${lat}-${lng}`}
              position={markerPosition}
              icon={createCustomIcon(hazard.severity, hazard.status)}
            >
              <Popup>
                <div className="p-1.5 text-slate-900 font-sans space-y-2 min-w-[200px]">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      {hazard.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${
                        hazard.status === 'resolved'
                          ? 'bg-emerald-600'
                          : hazard.severity === 'high'
                          ? 'bg-rose-600'
                          : 'bg-amber-600'
                      }`}
                    >
                      {hazard.status === 'resolved' ? 'Resolved' : hazard.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-snug">{hazard.description}</p>

                  <div className="text-[10px] font-mono text-slate-500 space-y-0.5">
                    <div>GeoJSON: [{lng.toFixed(4)}, {lat.toFixed(4)}]</div>
                    <div>Reported: {formatDate(hazard.createdAt || hazard.recordedAt)}</div>
                  </div>

                  {hazard.status === 'active' && onResolveHazard && (
                    <button
                      onClick={() => onResolveHazard(hazard._id)}
                      className="w-full mt-1 py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Mark Resolved
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
