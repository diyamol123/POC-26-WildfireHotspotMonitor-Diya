"use client";

import { useEffect,useRef, useState } from "react";
import dynamic from "next/dynamic";
import html2canvas from "html2canvas-pro";

const WildfireMap = dynamic(
  () => import("./components/WildfireMap"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[#030712] text-cyan-400">
        Loading map...
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

export default function Home() {
  const [selected, setSelected] = useState<(typeof hotspots)[number]>(hotspots[1]);
const [timeOffset, setTimeOffset] = useState(24);
const [sensorFilter, setSensorFilter] =
  useState<"ALL" | "VIIRS" | "MODIS">("ALL");
const [time, setTime] = useState<Date | null>(null);
const dashboardRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
  setTime(new Date());

  const timer = setInterval(() => {
    setTime(new Date());
  }, 1000);

  return () => clearInterval(timer);
}, []);

const filteredHotspots =
  sensorFilter === "ALL"
    ? hotspots
    : hotspots.filter((spot) => spot.sensor === sensorFilter);

const exportSnapshot = async () => {
  if (!dashboardRef.current) return;

  const canvas = await html2canvas(dashboardRef.current, {
    useCORS: true,
    backgroundColor: "#05090c",
  });

  const link = document.createElement("a");
  link.download = "wildfire-aoi-snapshot.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
};

return (
    <main className="min-h-screen bg-[#05090c] text-white">
      {/* Header */}
      <header className="min-h-20 border-b border-cyan-500/20 bg-[#071116]/95 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-10">
  <div>
    <div className="text-xs tracking-[0.35em] text-cyan-400">
      REAL RAILS • POC 26
    </div>
    <h1 className="text-xl md:text-2xl font-bold tracking-wide">
      WILDFIRE HOTSPOT MONITOR
    </h1>
  </div>

  <div className="flex items-center gap-4">
    <div className="text-right">
      <div className="text-xs text-slate-500">SYSTEM TIME</div>
      <div className="font-mono text-cyan-300">
        {time
          ? time.toLocaleTimeString("en-IN", { hour12: false })
          : "--:--:--"}
      </div>
    </div>

    <button
      onClick={exportSnapshot}
      className="w-full rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-[10px] font-semibold tracking-wider text-cyan-300 transition hover:bg-cyan-400/20 sm:w-auto sm:px-4 sm:text-xs"
    >
      EXPORT AOI SNAPSHOT
    </button>
  </div>
</header>

      {/* Dashboard */}
      <section
  ref={dashboardRef}
  className="grid lg:grid-cols-[minmax(0,1fr)_380px] min-h-[calc(100vh-5rem)] items-start"
>
        {/* Map */}
<div className="relative min-h-[650px] overflow-hidden bg-[#030712]">
</div>

{/* Real geographic map */}
<WildfireMap
  hotspots={hotspots}
  onSelect={setSelected}
/>

  {/* keep ALL your map overlays here */}
  {/* Cinematic grid */}
  <div
    className="pointer-events-none absolute inset-0 z-[500] opacity-20"
    style={{
      backgroundImage:
        "linear-gradient(rgba(34,211,238,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.12) 1px, transparent 1px)",
      backgroundSize: "50px 50px",
    }}
  />

  {/* Radar circles */}
  <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-1/2">
    <div className="h-[420px] w-[420px] rounded-full border border-cyan-500/20" />

    <div className="absolute inset-[70px] rounded-full border border-cyan-500/20" />

    <div className="absolute inset-[140px] rounded-full border border-cyan-500/20" />
  </div>

  {/* Map information */}
  <div className="pointer-events-none absolute left-6 top-6 z-[1000] rounded border border-cyan-400/20 bg-black/70 px-4 py-3 backdrop-blur">
    <div className="text-[10px] tracking-[0.25em] text-cyan-400">
      LIVE SATELLITE ANALYSIS
    </div>

    <div className="mt-1 text-sm text-slate-300">
      SOUTH ASIA • ACTIVE MONITORING
    </div>
  </div>

  {/* Legend */}
  <div className="pointer-events-none absolute bottom-6 left-6 z-[1000] flex gap-5 rounded border border-white/10 bg-black/70 px-4 py-3 text-xs backdrop-blur">
    <span>
      <i className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500" />
      CRITICAL
    </span>

    <span>
      <i className="mr-2 inline-block h-2 w-2 rounded-full bg-orange-400" />
      HIGH
    </span>

    <span>
      <i className="mr-2 inline-block h-2 w-2 rounded-full bg-yellow-300" />
      MEDIUM
    </span>
  </div>
  {/* Sensor filters */}
<div className="absolute top-6 right-6 z-[1000] rounded-xl border border-cyan-500/20 bg-black/70 p-3 backdrop-blur">
  <div className="mb-2 text-[10px] tracking-widest text-cyan-400">
    SENSOR
  </div>

  <div className="flex gap-2">
    {(["ALL", "VIIRS", "MODIS"] as const).map((sensor) => (
      <button
        key={sensor}
        onClick={() => setSensorFilter(sensor)}
        className={`rounded px-3 py-2 text-xs transition ${
          sensorFilter === sensor
            ? "bg-cyan-400 text-black"
            : "border border-white/10 bg-white/5 text-slate-300 hover:bg-cyan-400/10"
        }`}
      >
        {sensor}
      </button>
    ))}
  </div>
</div>
{/* Export AOI Snapshot */}
<button
  onClick={exportSnapshot}
  className="absolute bottom-6 right-6 z-[1000] rounded-lg border border-cyan-400/30 bg-black/80 px-4 py-3 text-xs font-semibold tracking-wider text-cyan-300 backdrop-blur transition hover:bg-cyan-400/20"
>
  EXPORT AOI SNAPSHOT
</button>
{/* Time slider */}
<div className="absolute bottom-20 left-1/2 z-[1000] w-[360px] -translate-x-1/2 rounded-xl border border-cyan-500/20 bg-black/70 p-4 backdrop-blur">
  <div className="mb-2 flex items-center justify-between text-xs">
    <span className="tracking-widest text-cyan-400">
      TIME WINDOW
    </span>

    <span className="font-mono text-slate-300">
  {timeOffset === 24 ? "NOW" : `${timeOffset}H AGO`}
</span>
  <input
  type="range"
  min="0"
  max="24"
  value={timeOffset}
  onChange={(event) => setTimeOffset(Number(event.target.value))}
    className="w-full accent-cyan-400"
    aria-label="Wildfire observation time"
  />

  <div className="mt-1 flex justify-between text-[10px] text-slate-500">
    <span>24H AGO</span>
    <span>NOW</span>
  </div>
</div>
{/* Incident Cards */}
<div className="absolute top-24 left-6 z-[1000] w-72 space-y-2">
  <div className="text-[10px] tracking-[0.25em] text-cyan-400">
    ACTIVE INCIDENTS
  </div>

  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
    {filteredHotspots.map((spot) => (
      <button
        key={spot.id}
        onClick={() => setSelected(spot)}
        className="w-full rounded-lg border border-white/10 bg-black/70 p-3 text-left backdrop-blur transition hover:border-cyan-400/40"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            {spot.location}
          </span>

          <span
            className={`text-[10px] font-bold ${
              spot.intensity === "CRITICAL"
                ? "text-red-400"
                : spot.intensity === "HIGH"
                ? "text-orange-400"
                : "text-yellow-300"
            }`}
          >
            {spot.intensity}
          </span>
        </div>

        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          <span>{spot.temp}</span>
          <span>{spot.sensor}</span>
        </div>
      </button>
    ))}
  </div>
</div>
  {/* Hotspot count */}
  <div className="absolute bottom-6 right-6 z-[1000] rounded border border-cyan-500/20 bg-black/70 px-4 py-3 text-xs backdrop-blur">
    <div className="text-slate-500">
      HOTSPOTS DETECTED
    </div>

    <div className="text-2xl font-bold text-cyan-300">
      {filteredHotspots.length}
    </div>
  </div>

</div>

        {/* Intelligence panel */}
        <aside className="relative z-[2000] h-auto min-h-full overflow-y-auto border-l border-cyan-500/20 bg-[#081116] p-6">
          <div className="mb-8">
            <div className="text-xs tracking-[0.3em] text-cyan-400">
              THREAT INTELLIGENCE
            </div>
            <h2 className="mt-2 text-xl font-semibold">
              Active Hotspot
            </h2>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
            <div className="text-xs text-slate-500">SELECTED REGION</div>
            <div className="mt-1 text-2xl font-bold">
              {selected.location}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-black/30 p-3">
                <div className="text-[10px] text-slate-500">INTENSITY</div>
                <div className="mt-1 text-red-400">
                  {selected.intensity}
                </div>
              </div>

              <div className="rounded-lg bg-black/30 p-3">
                <div className="text-[10px] text-slate-500">TEMP</div>
                <div className="mt-1">{selected.temp}</div>
              </div>
            </div>
          </div>
{/* WHY THIS MATTERS */}
<div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
  <div className="text-xs font-semibold tracking-widest text-amber-300">
    WHY THIS MATTERS
  </div>

  <p className="mt-2 text-sm leading-5 text-slate-200">
    {selected.intensity === "CRITICAL"
      ? "High-intensity thermal activity may require rapid monitoring and response coordination."
      : selected.intensity === "HIGH"
      ? "Elevated thermal activity indicates a developing fire risk that should remain under close observation."
      : "Moderate thermal activity should continue to be monitored for signs of escalation."}
  </p>
</div>

{/* WHO CONTROLS THE RAIL */}
<div className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4">
  <div className="text-xs font-semibold tracking-widest text-cyan-300">
    WHO CONTROLS THE RAIL
  </div>

  <div className="mt-2 text-sm font-semibold text-white">
    Rail Operations Control Center
  </div>

  <p className="mt-2 text-xs leading-5 text-slate-300">
    Monitors the affected rail corridor and coordinates operational
    decisions when wildfire risk approaches railway infrastructure.
  </p>
</div>
          <div className="mt-6">
            <div className="mb-3 text-xs tracking-widest text-slate-500">
              SYSTEM STATUS
            </div>

            <div className="space-y-3">
              {[
                ["Satellite feed", "ONLINE"],
                ["Hotspot detection", "ACTIVE"],
                ["Risk engine", "RUNNING"],
                ["Data pipeline", "STABLE"],
              ].map(([label, status]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-white/5 pb-3"
                >
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-xs text-emerald-400">
                    ● {status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="text-xs text-cyan-400">LAST UPDATE</div>
            <div className="mt-1 font-mono text-sm">
              {time ? time.toLocaleTimeString("en-IN", { hour12: false }) : "--:--:--"}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Monitoring network is receiving live-style telemetry.
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}