"use client";

import { useEffect, useState } from "react";

const hotspots = [
  { id: 1, x: 25, y: 38, intensity: "HIGH", location: "Kerala", temp: "42°C" },
  { id: 2, x: 48, y: 28, intensity: "CRITICAL", location: "Tamil Nadu", temp: "46°C" },
  { id: 3, x: 68, y: 50, intensity: "HIGH", location: "Karnataka", temp: "43°C" },
  { id: 4, x: 38, y: 68, intensity: "MEDIUM", location: "Andhra Pradesh", temp: "39°C" },
  { id: 5, x: 78, y: 30, intensity: "CRITICAL", location: "Odisha", temp: "47°C" },
  { id: 6, x: 58, y: 72, intensity: "MEDIUM", location: "Telangana", temp: "40°C" },
];

export default function Home() {
  const [selected, setSelected] = useState(hotspots[1]);
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
        <div className="relative min-h-[650px] overflow-hidden bg-[#07151a]">
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34,211,238,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.12) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />

          {/* Radar circles */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-[420px] h-[420px] rounded-full border border-cyan-500/20" />
            <div className="absolute inset-[70px] rounded-full border border-cyan-500/20" />
            <div className="absolute inset-[140px] rounded-full border border-cyan-500/20" />
          </div>

          {/* Fake geographic silhouette */}
          <div className="absolute left-[15%] top-[12%] w-[70%] h-[72%] opacity-30">
            <div className="absolute left-[20%] top-[10%] h-[80%] w-[45%] rotate-[18deg] rounded-[45%] border-2 border-cyan-300/30" />
            <div className="absolute left-[35%] top-[5%] h-[90%] w-[28%] rotate-[25deg] rounded-[50%] border border-cyan-400/20" />
          </div>

          {/* Hotspots */}
          {hotspots.map((spot) => (
            <button
              key={spot.id}
              onClick={() => setSelected(spot)}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            >
              <span
                className={`absolute -inset-5 rounded-full animate-ping ${
                  spot.intensity === "CRITICAL"
                    ? "bg-red-500/30"
                    : spot.intensity === "HIGH"
                    ? "bg-orange-400/25"
                    : "bg-yellow-300/20"
                }`}
              />

              <span
                className={`relative block h-4 w-4 rounded-full border-2 border-white shadow-[0_0_20px_currentColor] ${
                  spot.intensity === "CRITICAL"
                    ? "bg-red-500 text-red-500"
                    : spot.intensity === "HIGH"
                    ? "bg-orange-400 text-orange-400"
                    : "bg-yellow-300 text-yellow-300"
                }`}
              />

              <span className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-[10px] opacity-0 group-hover:opacity-100">
                {spot.location}
              </span>
            </button>
          ))}

          {/* Map labels */}
          <div className="absolute left-6 top-6 rounded border border-cyan-400/20 bg-black/50 px-4 py-3 backdrop-blur">
            <div className="text-[10px] tracking-[0.25em] text-cyan-400">
              LIVE SATELLITE ANALYSIS
            </div>
            <div className="mt-1 text-sm text-slate-300">
              SOUTH ASIA • ACTIVE MONITORING
            </div>
          </div>

          <div className="absolute bottom-6 left-6 flex gap-5 rounded border border-white/10 bg-black/60 px-4 py-3 text-xs backdrop-blur">
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

          <div className="absolute right-6 bottom-6 rounded border border-cyan-500/20 bg-black/60 px-4 py-3 text-xs backdrop-blur">
            <div className="text-slate-500">HOTSPOTS DETECTED</div>
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