import React from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import { DEFAULT_CENTER } from "../admin-utils.js";

function MapPointCapture({ onAddPoint }) {
  useMapEvents({
    click(event) {
      onAddPoint(event.latlng);
    },
  });

  return null;
}

export function RouteDraftMap({ points, onAddPoint }) {
  const center =
    points.length > 0
      ? [points[points.length - 1].lat, points[points.length - 1].lng]
      : DEFAULT_CENTER;

  return (
    <div className="map-card">
      <MapContainer center={center} zoom={13} className="route-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapPointCapture onAddPoint={onAddPoint} />
        {points.length > 1 ? (
          <Polyline
            positions={points.map((point) => [point.lat, point.lng])}
            pathOptions={{ color: "#0f766e", weight: 5 }}
          />
        ) : null}
        {points.map((point, index) => (
          <CircleMarker
            key={point.id}
            center={[point.lat, point.lng]}
            radius={10}
            pathOptions={{
              color: "#1d4ed8",
              fillColor: index === 0 ? "#f59e0b" : "#1d4ed8",
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              {point.name}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      <p className="map-note">
        Xarita ustiga bosib punkt qo'shing. Har bir nuqta avtomatik route polyline
        ichiga ulanadi.
      </p>
    </div>
  );
}
