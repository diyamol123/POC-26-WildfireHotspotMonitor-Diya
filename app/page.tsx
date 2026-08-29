"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import html2canvas from "html2canvas-pro";

const WildfireMap = dynamic(
  () => import("./components/WildfireMap"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[#050505] text-orange-400">
        Loading wildfire intelligence...
      </div>
    ),
  }
);

const hotspots: {
  id: number;
  lat: number;
  lng: number;
  intensity: "CRITICAL" | "HIGH" | "MEDIUM";
  location: string;
  temp: string;
  sensor: "VIIRS" | "MODIS";
}[] = [
  {
    id: 1,
    lat: 10.8505,
    lng: 76.2711,
    intensity: "HIGH",
    location: "Kerala",
    temp: "42°C",
    sensor: "VIIRS",
  },
  {
    id: 2,
    lat: 11.1271,
    lng: 78.6569,
    intensity: "CRITICAL",
    location: "Tamil Nadu",
    temp: "46°C",
    sensor: "MODIS",
  },
  {
    id: 3,
    lat: 15.3173,
    lng: 75.7139,
    intensity: "HIGH",
    location: "Karnataka",
    temp: "43°C",
    sensor: "VIIRS",
  },
  {
    id: 4,
    lat: 15.9129,
    lng: 79.74,
    intensity: "MEDIUM",
    location: "Andhra Pradesh",
    temp: "39°C",
    sensor: "MODIS",
  },
  {
    id: 5,
    lat: 20.9517,
    lng: 85.0985,
    intensity: "CRITICAL",
    location: "Odisha",
    temp: "47°C",
    sensor: "VIIRS",
  },
  {
    id: 6,
    lat: 17.1232,
    lng: 79.2088,
    intensity: "MEDIUM",
    location: "Telangana",
    temp: "40°C",
    sensor: "MODIS",
  },
];

type Hotspot = (typeof hotspots)[number];

export default function Home() {
  const [selected, setSelected] =
    useState<Hotspot>(hotspots[1]);

  const [timeOffset, setTimeOffset] =
    useState(24);

  const [sensorFilter, setSensorFilter] =
    useState<"ALL" | "VIIRS" | "MODIS">("ALL");

  const [time, setTime] =
    useState<Date | null>(null);

  const dashboardRef =
    useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const filteredHotspots =
    sensorFilter === "ALL"
      ? hotspots
      : hotspots.filter(
          (spot) =>
            spot.sensor === sensorFilter
        );

  /*
   * Keep the selected hotspot synchronized
   * with the active sensor filter.
   */
  useEffect(() => {
    if (filteredHotspots.length === 0) {
      return;
    }

    const selectedStillVisible =
      filteredHotspots.some(
        (spot) => spot.id === selected.id
      );

    if (!selectedStillVisible) {
      setSelected(filteredHotspots[0]);
    }
  }, [sensorFilter, selected.id]);

  const exportSnapshot = async () => {
    if (!dashboardRef.current) return;

    try {
      const canvas = await html2canvas(
        dashboardRef.current,
        {
          useCORS: true,
          backgroundColor: "#050505",
        }
      );

      const link =
        document.createElement("a");

      link.download =
        "wildfire-aoi-snapshot.png";

      link.href =
        canvas.toDataURL("image/png");

      link.click();
    } catch (error) {
      console.error(
        "Failed to export snapshot:",
        error
      );
    }
  };

  const downloadSampleData = () => {
    const data = JSON.stringify(
      filteredHotspots,
      null,
      2
    );

    const blob = new Blob([data], {
      type: "application/json",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "wildfire-hotspots-sample.json";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const criticalCount =
    filteredHotspots.filter(
      (spot) =>
        spot.intensity === "CRITICAL"
    ).length;

  const highCount =
    filteredHotspots.filter(
      (spot) =>
        spot.intensity === "HIGH"
    ).length;

  return (
    <main
      className="ember-shell min-h-screen text-white"
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="relative z-[3000] flex min-h-20 flex-col gap-3 border-b border-orange-500/20 bg-[#050505]/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-10">

        <div>
          <div className="text-xs tracking-[0.35em] text-orange-400">
            REAL RAILS • POC 26
          </div>

          <h1 className="mt-1 text-xl font-bold tracking-[0.08em] text-white md:text-2xl">
            WILDFIRE HOTSPOT MONITOR
          </h1>

          <div className="mt-1 text-[9px] tracking-[0.3em] text-zinc-600">
            EMBER GRID INTELLIGENCE
          </div>
        </div>

        <div className="flex items-center gap-4">

          <div className="text-right">
            <div className="text-xs text-zinc-600">
              SYSTEM TIME
            </div>

            <div className="font-mono text-orange-300">
              {time
                ? time.toLocaleTimeString(
                    "en-IN",
                    {
                      hour12: false,
                    }
                  )
                : "--:--:--"}
            </div>
          </div>

          <button
            onClick={exportSnapshot}
            className="w-full rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-[10px] font-semibold tracking-wider text-orange-300 transition hover:bg-orange-500/20 sm:w-auto sm:px-4 sm:text-xs"
          >
            EXPORT AOI SNAPSHOT
          </button>

        </div>
      </header>

      {/* =====================================================
          70 / 30 DASHBOARD
      ====================================================== */}

      <section
        ref={dashboardRef}
        className="grid min-h-[calc(100vh-5rem)] grid-cols-1 items-stretch lg:grid-cols-[70%_30%]"
      >

        {/* ===================================================
            70% VISUALIZATION
        ==================================================== */}

        <div className="relative min-h-[650px] overflow-hidden bg-[#050505]">

          <WildfireMap
            hotspots={filteredHotspots}
            selectedId={selected.id}
            onSelect={setSelected}
          />

          {/* Dark cinematic atmosphere */}

          <div className="ember-map-atmosphere pointer-events-none absolute inset-0 z-[400]" />

          {/* Ember grid */}

          <div className="ember-grid pointer-events-none absolute inset-0 z-[500] opacity-30" />

          {/* Top/bottom cinematic gradients */}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-[600] h-40 bg-gradient-to-b from-black/70 to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[600] h-48 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Radar */}

          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-1/2">

            <div className="h-[420px] w-[420px] rounded-full border border-orange-500/15" />

            <div className="absolute inset-[70px] rounded-full border border-orange-500/15" />

            <div className="absolute inset-[140px] rounded-full border border-orange-500/15" />

          </div>

          {/* Map label */}

          <div className="pointer-events-none absolute left-6 top-6 z-[1000] rounded border border-orange-500/25 bg-black/75 px-4 py-3 backdrop-blur">

            <div className="text-[10px] tracking-[0.25em] text-orange-400">
              LIVE SATELLITE ANALYSIS
            </div>

            <div className="mt-1 text-sm text-zinc-300">
              SOUTH ASIA • ACTIVE MONITORING
            </div>

          </div>

          {/* Sensor filters */}

          <div className="absolute right-6 top-6 z-[2000] rounded-xl border border-orange-500/25 bg-black/80 p-3 backdrop-blur">

            <div className="mb-2 text-[10px] tracking-widest text-orange-400">
              SENSOR
            </div>

            <div className="flex gap-2">

              {(
                ["ALL", "VIIRS", "MODIS"] as const
              ).map((sensor) => (

                <button
                  key={sensor}
                  onClick={() =>
                    setSensorFilter(sensor)
                  }
                  className={`rounded px-3 py-2 text-xs transition ${
                    sensorFilter === sensor
                      ? "bg-orange-500 text-black"
                      : "border border-white/10 bg-white/5 text-zinc-300 hover:border-orange-500/40 hover:bg-orange-500/10"
                  }`}
                >
                  {sensor}
                </button>

              ))}

            </div>
          </div>

          {/* Active incidents */}

          <div className="absolute left-6 top-24 z-[1500] w-72 space-y-2">

            <div className="text-[10px] tracking-[0.25em] text-orange-400">
              ACTIVE INCIDENTS
            </div>

            <div className="max-h-[calc(100vh-15rem)] space-y-2 overflow-y-auto pr-1">

              {filteredHotspots.map(
                (spot) => (

                  <button
                    key={spot.id}
                    onClick={() =>
                      setSelected(spot)
                    }
                    className={`fire-glow w-full rounded-lg border p-3 text-left backdrop-blur transition ${
                      selected.id === spot.id
                        ? "border-orange-400/70 bg-orange-500/10"
                        : "border-white/10 bg-black/75 hover:border-orange-500/40"
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <span className="text-sm font-semibold text-white">
                        {spot.location}
                      </span>

                      <span
                        className={`text-[10px] font-bold ${
                          spot.intensity ===
                          "CRITICAL"
                            ? "text-red-400"
                            : spot.intensity ===
                              "HIGH"
                            ? "text-orange-400"
                            : "text-yellow-300"
                        }`}
                      >
                        {spot.intensity}
                      </span>

                    </div>

                    <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
                      <span>
                        {spot.temp}
                      </span>

                      <span>
                        {spot.sensor}
                      </span>
                    </div>

                    {selected.id ===
                      spot.id && (
                      <div className="mt-2 text-[9px] tracking-widest text-orange-300">
                        SELECTED HOTSPOT
                      </div>
                    )}

                  </button>

                )
              )}

            </div>
          </div>

          {/* Time window */}

          <div className="absolute bottom-6 left-1/2 z-[2000] w-[360px] max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl border border-orange-500/25 bg-black/80 p-4 backdrop-blur">

            <div className="mb-2 flex items-center justify-between text-xs">

              <span className="tracking-widest text-orange-400">
                TIME WINDOW
              </span>

              <span className="font-mono text-zinc-300">
                {timeOffset === 24
                  ? "NOW"
                  : `${timeOffset}H AGO`}
              </span>

            </div>

            <input
              type="range"
              min="0"
              max="24"
              value={timeOffset}
              onChange={(event) =>
                setTimeOffset(
                  Number(event.target.value)
                )
              }
              className="w-full accent-orange-500"
              aria-label="Wildfire observation time"
            />

            <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
              <span>24H AGO</span>
              <span>NOW</span>
            </div>

          </div>

          {/* Legend */}

          <div className="pointer-events-none absolute bottom-6 left-6 z-[2000] flex gap-5 rounded border border-white/10 bg-black/80 px-4 py-3 text-xs backdrop-blur">

            <span>
              <i className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500" />
              CRITICAL
            </span>

            <span>
              <i className="mr-2 inline-block h-2 w-2 rounded-full bg-orange-500" />
              HIGH
            </span>

            <span>
              <i className="mr-2 inline-block h-2 w-2 rounded-full bg-yellow-300" />
              MEDIUM
            </span>

          </div>

          {/* Export */}

          <button
            onClick={exportSnapshot}
            className="absolute bottom-24 left-6 z-[2500] rounded-lg border border-orange-500/30 bg-black/90 px-4 py-3 text-xs font-semibold tracking-wider text-orange-300 shadow-lg backdrop-blur transition hover:bg-orange-500/20"
          >
            EXPORT AOI SNAPSHOT
          </button>

          {/* Hotspot count */}

          <div className="absolute bottom-6 right-6 z-[2000] rounded border border-orange-500/25 bg-black/80 px-4 py-3 text-xs backdrop-blur">

            <div className="text-zinc-600">
              HOTSPOTS DETECTED
            </div>

            <div className="text-2xl font-bold text-orange-300">
              {filteredHotspots.length}
            </div>

          </div>

        </div>

        {/* ===================================================
            30% INTELLIGENCE
        ==================================================== */}

        <aside className="relative z-[3000] min-h-[650px] overflow-y-auto border-l border-orange-500/20 bg-[#080808] p-6">

          <div className="mb-8">

            <div className="text-xs tracking-[0.3em] text-orange-400">
              THREAT INTELLIGENCE
            </div>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Active Hotspot
            </h2>

          </div>

          {/* Selected hotspot */}

          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">

            <div className="text-xs text-zinc-600">
              SELECTED REGION
            </div>

            <div className="mt-1 text-2xl font-bold text-white">
              {selected.location}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">

              <div className="rounded-lg bg-black/40 p-3">

                <div className="text-[10px] text-zinc-600">
                  INTENSITY
                </div>

                <div
                  className={`mt-1 ${
                    selected.intensity ===
                    "CRITICAL"
                      ? "text-red-400"
                      : selected.intensity ===
                        "HIGH"
                      ? "text-orange-400"
                      : "text-yellow-300"
                  }`}
                >
                  {selected.intensity}
                </div>

              </div>

              <div className="rounded-lg bg-black/40 p-3">

                <div className="text-[10px] text-zinc-600">
                  TEMP
                </div>

                <div className="mt-1 text-white">
                  {selected.temp}
                </div>

              </div>

            </div>

          </div>

          {/* Intelligence metrics */}

          <div className="mt-4 grid grid-cols-2 gap-3">

            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">

              <div className="text-[10px] tracking-widest text-orange-400">
                ACTIVE HOTSPOTS
              </div>

              <div className="mt-2 text-2xl font-bold text-orange-300">
                {filteredHotspots.length}
              </div>

              <div className="mt-1 text-[10px] text-zinc-600">
                CURRENTLY DETECTED
              </div>

            </div>

            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">

              <div className="text-[10px] tracking-widest text-orange-400">
                SENSOR SOURCE
              </div>

              <div className="mt-2 text-lg font-bold text-white">
                {selected.sensor}
              </div>

              <div className="mt-1 text-[10px] text-zinc-600">
                SELECTED HOTSPOT
              </div>

            </div>

          </div>

          {/* Threat distribution */}

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">

            <div className="mb-3 text-[10px] tracking-widest text-zinc-600">
              THREAT DISTRIBUTION
            </div>

            <div className="grid grid-cols-2 gap-3">

              <div>

                <div className="text-[10px] text-zinc-600">
                  CRITICAL
                </div>

                <div className="mt-1 text-lg font-bold text-red-400">
                  {criticalCount}
                </div>

              </div>

              <div>

                <div className="text-[10px] text-zinc-600">
                  HIGH
                </div>

                <div className="mt-1 text-lg font-bold text-orange-400">
                  {highCount}
                </div>

              </div>

            </div>

          </div>

          {/* WHY THIS MATTERS */}

          <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">

            <div className="text-xs font-semibold tracking-widest text-orange-300">
              WHY THIS MATTERS
            </div>

            <p className="mt-2 text-sm leading-5 text-zinc-200">

              {selected.intensity ===
              "CRITICAL"
                ? "High-intensity thermal activity may require rapid monitoring and response coordination."
                : selected.intensity ===
                  "HIGH"
                ? "Elevated thermal activity indicates a developing fire risk that should remain under close observation."
                : "Moderate thermal activity should continue to be monitored for signs of escalation."}

            </p>

          </div>

          {/* WHO CONTROLS THE RAIL */}

          <div className="mt-4 rounded-xl border border-orange-500/25 bg-orange-500/5 p-4">

            <div className="text-xs font-semibold tracking-widest text-orange-300">
              WHO CONTROLS THE RAIL
            </div>

            <div className="mt-2 text-sm font-semibold text-white">
              Rail Operations Control Center
            </div>

            <p className="mt-2 text-xs leading-5 text-zinc-400">
              Monitors the affected rail
              corridor and coordinates
              operational decisions when
              wildfire risk approaches
              railway infrastructure.
            </p>

          </div>

          {/* DOWNLOAD */}

          <div className="mt-4">

            <button
              onClick={downloadSampleData}
              className="w-full rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-xs font-semibold tracking-wider text-orange-300 transition hover:bg-orange-500/20"
            >
              DOWNLOAD SAMPLE DATA
            </button>

          </div>

          {/* SYSTEM STATUS */}

          <div className="mt-6">

            <div className="mb-3 text-xs tracking-widest text-zinc-600">
              SYSTEM STATUS
            </div>

            <div className="space-y-3">

              {[
                [
                  "Satellite feed",
                  "ONLINE",
                ],
                [
                  "Hotspot detection",
                  "ACTIVE",
                ],
                [
                  "Risk engine",
                  "RUNNING",
                ],
                [
                  "Data pipeline",
                  "STABLE",
                ],
              ].map(
                ([label, status]) => (

                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-white/5 pb-3"
                  >

                    <span className="text-sm text-zinc-500">
                      {label}
                    </span>

                    <span className="text-xs text-emerald-400">
                      ● {status}
                    </span>

                  </div>

                )
              )}

            </div>

          </div>

          {/* Last update */}

          <div className="mt-8 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">

            <div className="text-xs text-orange-400">
              LAST UPDATE
            </div>

            <div className="mt-1 font-mono text-sm text-white">
              {time
                ? time.toLocaleTimeString(
                    "en-IN",
                    {
                      hour12: false,
                    }
                  )
                : "--:--:--"}
            </div>

            <div className="mt-2 text-xs text-zinc-600">
              Monitoring network is receiving
              live-style telemetry.
            </div>

          </div>

        </aside>

      </section>
    </main>
  );
}