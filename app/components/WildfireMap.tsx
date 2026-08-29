"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

type Hotspot = {
  id: number;
  lat: number;
  lng: number;
  intensity: "CRITICAL" | "HIGH" | "MEDIUM";
  location: string;
  temp: string;
  sensor: "VIIRS" | "MODIS";
};

type WildfireMapProps = {
  hotspots: Hotspot[];
  selectedId?: number;
  onSelect: (spot: Hotspot) => void;
};

const intensityColors: Record<
  Hotspot["intensity"],
  string
> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#facc15",
};

export default function WildfireMap({
  hotspots,
  selectedId,
  onSelect,
}: WildfireMapProps) {
  return (
    <MapContainer
      center={[15.5, 78.5]}
      zoom={5}
      scrollWheelZoom={true}
      className="absolute inset-0 z-0 h-full w-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {hotspots.map((spot) => {
        const isSelected = spot.id === selectedId;

        const intensityColor =
          intensityColors[spot.intensity];

        return (
          <CircleMarker
            key={spot.id}
            center={[spot.lat, spot.lng]}
            radius={isSelected ? 12 : 8}
            pathOptions={{
              color: isSelected
                ? "#ffffff"
                : intensityColor,
              fillColor: intensityColor,
              fillOpacity: isSelected ? 1 : 0.88,
              weight: isSelected ? 4 : 2,
            }}
            eventHandlers={{
              click: () => onSelect(spot),
            }}
          >
            <Tooltip>
              <strong>{spot.location}</strong>
              <br />
              {spot.intensity}
              <br />
              {spot.temp}
              <br />
              Sensor: {spot.sensor}
              {isSelected && (
                <>
                  <br />
                  <strong>SELECTED HOTSPOT</strong>
                </>
              )}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}