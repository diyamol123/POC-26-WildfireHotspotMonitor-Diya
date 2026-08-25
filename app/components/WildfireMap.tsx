"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
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
  onSelect: (spot: Hotspot) => void;
};

const intensityColors: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#fb923c",
  MEDIUM: "#fde047",
};

function MapCleanup() {
  const map = useMap();
  const mapRef = useRef(map);

  useEffect(() => {
    mapRef.current = map;

    return () => {
      const container = map.getContainer();

      if (container) {
        const leafletId = (container as HTMLElement & {
          _leaflet_id?: number;
        })._leaflet_id;

        if (leafletId) {
          delete (container as HTMLElement & {
            _leaflet_id?: number;
          })._leaflet_id;
        }
      }
    };
  }, [map]);

  return null;
}

export default function WildfireMap({
  hotspots,
  onSelect,
}: WildfireMapProps) {
  return (
    <MapContainer
      center={[15.5, 78.5]}
      zoom={5}
      scrollWheelZoom={true}
      className="absolute inset-0 z-0 h-full w-full"
    >
      <MapCleanup />

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {hotspots.map((spot) => (
        <CircleMarker
          key={spot.id}
          center={[spot.lat, spot.lng]}
          radius={8}
          pathOptions={{
            color: intensityColors[spot.intensity],
            fillColor: intensityColors[spot.intensity],
            fillOpacity: 0.9,
            weight: 2,
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
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}