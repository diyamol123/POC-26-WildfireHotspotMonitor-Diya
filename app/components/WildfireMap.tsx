"use client";

import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  Rectangle,
  useMapEvents,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { useState } from "react";

import type { LatLngBoundsExpression } from "leaflet";

export type Hotspot = {
  id: number;
  lat: number;
  lng: number;

  intensity:
    | "CRITICAL"
    | "HIGH"
    | "MEDIUM";

  location: string;
  temp: string;

  sensor:
    | "VIIRS"
    | "MODIS";

  frp?: string | null;
  confidence?: string | null;

  acq_date?: string | null;
  acq_time?: string | null;
};

type WildfireMapProps = {
  hotspots: Hotspot[];
  selectedId: number | null;
  onSelect: (spot: Hotspot) => void;

  onAOIChange?: (
    bounds: LatLngBoundsExpression | null
  ) => void;
};

const intensityColors = {
  CRITICAL: "#EF4444",
  HIGH: "#F97316",
  MEDIUM: "#FACC15",
};


/* =====================================================
   AOI SELECTOR
   ===================================================== */

function AOISelector({
  onAOIChange,
}: {
  onAOIChange?: (
    bounds: LatLngBoundsExpression | null
  ) => void;
}) {
  const [start, setStart] = useState<[number, number] | null>(null);
  const [bounds, setBounds] =
    useState<LatLngBoundsExpression | null>(null);

  useMapEvents({
    click(event) {
      const point: [number, number] = [
        event.latlng.lat,
        event.latlng.lng,
      ];

      // First click = starting corner
      if (!start) {
        setStart(point);
        return;
      }

      // Second click = opposite corner
      const newBounds: LatLngBoundsExpression = [
        [
          Math.min(start[0], point[0]),
          Math.min(start[1], point[1]),
        ],
        [
          Math.max(start[0], point[0]),
          Math.max(start[1], point[1]),
        ],
      ];

      setBounds(newBounds);
      onAOIChange?.(newBounds);

      // Reset for another AOI selection
      setStart(null);
    },
  });

  return bounds ? (
    <Rectangle
      bounds={bounds}
      pathOptions={{
        color: "#38BDF8",
        weight: 2,
        fillOpacity: 0.08,
      }}
    />
  ) : null;
}

/* =====================================================
   MAP
   ===================================================== */

export default function WildfireMap({
  hotspots,
  selectedId,
  onSelect,
  onAOIChange,
}: WildfireMapProps) {

  return (

    <MapContainer
      center={[15.5, 78.5]}
      zoom={5}
      scrollWheelZoom={true}
      className="
        absolute
        inset-0
        z-0
        h-full
        w-full
      "
    >

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />


      {/* =================================================
          AOI SELECTION
         ================================================= */}

      <AOISelector
        onAOIChange={
          onAOIChange
        }
      />


      {/* =================================================
          HOTSPOTS
         ================================================= */}

      {hotspots.map(
        (spot) => {

          const color =
            intensityColors[
              spot.intensity
            ];

          const isSelected =
            selectedId ===
            spot.id;

          return (

            <CircleMarker
              key={spot.id}

              center={[
                spot.lat,
                spot.lng,
              ]}

              radius={
                isSelected
                  ? 11
                  : 7
              }

              pathOptions={{
                color,
                fillColor:
                  color,
                fillOpacity:
                  0.9,
                weight:
                  isSelected
                    ? 3
                    : 1.5,
              }}

              eventHandlers={{
                click: () =>
                  onSelect(
                    spot
                  ),
              }}
            >

              <Tooltip>

                <div className="min-w-[150px]">

                  <div className="font-semibold">
                    {spot.location}
                  </div>

                  <div>
                    Threat:{" "}
                    {spot.intensity}
                  </div>

                  <div>
                    Temperature:{" "}
                    {spot.temp}
                  </div>

                  <div>
                    Sensor:{" "}
                    {spot.sensor}
                  </div>

                </div>

              </Tooltip>

            </CircleMarker>

          );

        }
      )}

    </MapContainer>
  );
}
