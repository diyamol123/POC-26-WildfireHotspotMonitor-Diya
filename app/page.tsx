"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const WildfireMap = dynamic(
  () => import("./components/WildfireMap"),
  { ssr: false }
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
  const [time, setTime] = useState<Date | null>(null);
  useEffect(() => {
  setTime(new Date());

  const timer = setInterval(() => {
    setTime(new Date());
  }, 1000);

  return () => clearInterval(timer);
}, []);

  return (
    <main className="min-h-screen bg-[#05090c] text-white overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-cyan-500/20 bg-[#071116]/95 flex items-center justify-between px-6 md:px-10">
        <div>
          <div className="text-xs tracking-[0.35em] text-cyan-400">
            REAL RAILS • POC 26
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-wide">
            WILDFIRE HOTSPOT MONITOR
          </h1>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500">SYSTEM TIME</div>
          <div className="font-mono text-cyan-300">
            {time ? time.toLocaleTimeString("en-IN", { hour12: false }) : "--:--:--"}
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <section className="grid lg:grid-cols-[1fr_330px] min-h-[calc(100vh-5rem)]">
        {/* Map */}
<div 
className="relative min-h-[650px] overflow-hidden bg-[#030712]">
</div>
  {/* Real geographic map */}
  <WildfireMap
    hotspots={hotspots}
    onSelect={setSelected}
  />

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
  {/* Hotspot count */}
  <div className="absolute bottom-6 right-6 z-[1000] rounded border border-cyan-500/20 bg-black/70 px-4 py-3 text-xs backdrop-blur">
    <div className="text-slate-500">
      HOTSPOTS DETECTED
    </div>

    <div className="text-2xl font-bold text-cyan-300">
      {hotspots.length}
    </div>
  </div>

</div>

        {/* Intelligence panel */}
        <aside className="border-l border-cyan-500/20 bg-[#081116] p-6">
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