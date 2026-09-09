"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import dynamic from "next/dynamic";
import html2canvas from "html2canvas-pro";

import type { Hotspot } from "./components/WildfireMap";

const WildfireMap = dynamic(
  () => import("./components/WildfireMap"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[#030712] text-[#38BDF8]">
        LOADING WILDFIRE INTELLIGENCE...
      </div>
    ),
  }
);

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

export default function Home() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selected, setSelected] =
    useState<Hotspot | null>(null);

  const [sensorFilter, setSensorFilter] =
    useState<"ALL" | "VIIRS" | "MODIS">("ALL");

  const [aoiBounds, setAoiBounds] = useState<
    [[number, number], [number, number]] | null
  >(null);

  const [timeOffset, setTimeOffset] = useState(0);

  const [systemTime, setSystemTime] =
    useState<Date | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  const [showInfo, setShowInfo] = useState(false);
  const [showIncidents, setShowIncidents] =
    useState(false);

  const dashboardRef =
    useRef<HTMLElement | null>(null);

  // =====================================================
  // SYSTEM CLOCK
  // =====================================================

  useEffect(() => {
    setSystemTime(new Date());

    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // =====================================================
  // LOAD HOTSPOTS
  // =====================================================

  useEffect(() => {
    const loadHotspots = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API}/api/hotspots`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `API returned ${response.status}`
          );
        }

        const data: Hotspot[] =
          await response.json();

        setHotspots(data);

        // IMPORTANT:
        // Do not automatically open the
        // Intelligence Panel.
        setSelected(null);
      } catch (err) {
        console.error(
          "Hotspot loading failed:",
          err
        );

        setError(
          "Unable to connect to wildfire data service."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHotspots();
  }, []);

  // =====================================================
  // SENSOR + AOI + TIME FILTER
  // =====================================================

  const filteredHotspots = useMemo(() => {
    const now = Date.now();

    return hotspots.filter((spot) => {
      // SENSOR
      const matchesSensor =
        sensorFilter === "ALL" ||
        spot.sensor === sensorFilter;

      if (!matchesSensor) {
        return false;
      }

      // AOI
      if (aoiBounds) {
        const [
          [south, west],
          [north, east],
        ] = aoiBounds;

        const insideAOI =
          spot.lat >= south &&
          spot.lat <= north &&
          spot.lng >= west &&
          spot.lng <= east;

        if (!insideAOI) {
          return false;
        }
      }

      // TIME
      if (!spot.acq_date || !spot.acq_time) {
        return true;
      }

      const timeText = String(
        spot.acq_time
      ).padStart(4, "0");

      const year =
        spot.acq_date.slice(0, 4);

      const month =
        spot.acq_date.slice(5, 7);

      const day =
        spot.acq_date.slice(8, 10);

      const hours =
        timeText.slice(0, 2);

      const minutes =
        timeText.slice(2, 4);

      const acquisitionTime = Date.parse(
        `${year}-${month}-${day}T${hours}:${minutes}:00Z`
      );

      if (Number.isNaN(acquisitionTime)) {
        return true;
      }

      const hoursAgo =
        (now - acquisitionTime) /
        (1000 * 60 * 60);

      if (timeOffset === 0) {
        return hoursAgo <= 1;
      }

      return (
        hoursAgo >= timeOffset - 1 &&
        hoursAgo <= timeOffset + 1
      );
    });
  }, [
    hotspots,
    sensorFilter,
    timeOffset,
    aoiBounds,
  ]);

  // =====================================================
  // KEEP SELECTED HOTSPOT VALID
  // =====================================================

  useEffect(() => {
    if (!selected) {
      return;
    }

    const stillVisible =
      filteredHotspots.some(
        (spot) => spot.id === selected.id
      );

    if (!stillVisible) {
      setSelected(null);
    }
  }, [filteredHotspots, selected]);

  // =====================================================
  // METRICS
  // =====================================================

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

  const mediumCount =
    filteredHotspots.filter(
      (spot) =>
        spot.intensity === "MEDIUM"
    ).length;

  // =====================================================
  // WHY THIS MATTERS
  // =====================================================

  const whyThisMatters =
    selected?.intensity === "CRITICAL"
      ? "High-intensity thermal activity requires close monitoring because conditions may develop rapidly near critical infrastructure."
      : selected?.intensity === "HIGH"
      ? "Elevated thermal activity indicates a developing risk zone that should remain under close observation."
      : "Moderate thermal activity should continue to be monitored for signs of escalation.";

  // =====================================================
  // EXPORT
  // =====================================================

  const exportSnapshot = async () => {
    if (!dashboardRef.current) {
      return;
    }

    try {
      const canvas = await html2canvas(
        dashboardRef.current,
        {
          useCORS: true,
          backgroundColor: "#030712",
        }
      );

      const link =
        document.createElement("a");

      link.download =
        "wildfire-aoi-snapshot.png";

      link.href =
        canvas.toDataURL("image/png");

      link.click();
    } catch (err) {
      console.error(
        "Snapshot export failed:",
        err
      );
    }
  };

  // =====================================================
  // DOWNLOAD DATA
  // =====================================================

  const downloadData = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          filteredHotspots,
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "wildfire-hotspots.json";

    link.click();

    URL.revokeObjectURL(url);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <main
      ref={dashboardRef}
      className="relative h-screen w-full overflow-hidden bg-[#030712] text-white"
    >
      {/* =================================================
          FULL SCREEN MAP
      ================================================= */}

      <div className="absolute inset-0">
        <WildfireMap
          hotspots={filteredHotspots}
          selectedId={selected?.id ?? null}
          onSelect={(spot) => {
            setSelected(spot);
            setShowIncidents(false);
          }}
          onAOIChange={(bounds) => {
            if (!bounds) {
              setAoiBounds(null);
              return;
            }

            if (Array.isArray(bounds)) {
              setAoiBounds(
                bounds as [
                  [number, number],
                  [number, number]
                ]
              );
            }
          }}
        />

        {/* =================================================
            CINEMATIC VIGNETTE
        ================================================= */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-[400]
            bg-[radial-gradient(circle_at_center,transparent_15%,rgba(3,7,18,.08)_55%,rgba(3,7,18,.72)_100%)]
          "
        />

        {/* =================================================
            CINEMATIC GRID
        ================================================= */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            z-[450]
            opacity-20
          "
          style={{
            backgroundImage:
              "linear-gradient(rgba(56,189,248,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.10) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        {/* =================================================
            RADAR RINGS
        ================================================= */}

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            z-[500]
            -translate-x-1/2
            -translate-y-1/2
          "
        >
          <div className="h-[420px] w-[420px] rounded-full border border-[#38BDF8]/10" />

          <div className="absolute inset-[70px] rounded-full border border-[#38BDF8]/10" />

          <div className="absolute inset-[140px] rounded-full border border-[#38BDF8]/10" />
        </div>
      </div>

      {/* =================================================
          TOP BAR
      ================================================= */}

      <header
        className="
          absolute
          left-0
          right-0
          top-0
          z-[3000]
          flex
          min-h-[76px]
          items-center
          justify-between
          gap-4
          border-b
          border-[#38BDF8]/15
          bg-[#030712]/85
          px-4
          py-3
          backdrop-blur-xl
          sm:px-6
          lg:px-8
        "
      >
        <div>
          <div
            className="
              text-[9px]
              font-semibold
              tracking-[0.35em]
              text-[#38BDF8]
              sm:text-[10px]
            "
          >
            INFOCREON INTERNSHIP • POC 26
          </div>

          <h1
            className="
              mt-1
              text-lg
              font-bold
              tracking-[0.08em]
              sm:text-2xl
            "
          >
            WILDFIRE HOTSPOT MONITOR
          </h1>

          <div
            className="
              mt-1
              hidden
              text-[8px]
              tracking-[0.28em]
              text-slate-500
              sm:block
            "
          >
            SATELLITE THERMAL INTELLIGENCE
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* SYSTEM TIME */}

          <div className="hidden text-right sm:block">
            <div className="text-[9px] tracking-widest text-slate-500">
              SYSTEM TIME
            </div>

            <div className="font-mono text-sm text-[#38BDF8]">
              {systemTime
                ? systemTime.toLocaleTimeString(
                    "en-IN",
                    {
                      hour12: false,
                    }
                  )
                : "--:--:--"}
            </div>
          </div>

          {/* INFO */}

          <button
            onClick={() =>
              setShowInfo(true)
            }
            aria-label="Application information"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-lg
              border
              border-[#38BDF8]/30
              bg-[#38BDF8]/10
              text-lg
              text-[#38BDF8]
              transition
              hover:bg-[#38BDF8]/20
            "
          >
            ⓘ
          </button>

          {/* EXPORT */}

          <button
            onClick={exportSnapshot}
            className="
              hidden
              rounded-lg
              border
              border-[#38BDF8]/30
              bg-[#38BDF8]/10
              px-4
              py-2.5
              text-[10px]
              font-semibold
              tracking-wider
              text-[#38BDF8]
              transition
              hover:bg-[#38BDF8]/20
              md:block
            "
          >
            EXPORT AOI SNAPSHOT
          </button>
        </div>
      </header>

      {/* =================================================
          LEFT INTELLIGENCE STATUS
      ================================================= */}

      <div
        className="
          absolute
          left-4
          top-[92px]
          z-[2000]
          w-[280px]
          max-w-[calc(100%-2rem)]
          rounded-xl
          border
          border-[#38BDF8]/20
          bg-[#030712]/85
          p-4
          shadow-2xl
          backdrop-blur-xl
          sm:left-6
        "
      >
        <div className="text-[9px] tracking-[0.3em] text-[#38BDF8]">
          LIVE SATELLITE ANALYSIS
        </div>

        <div className="mt-1 text-sm font-medium text-slate-200">
          SOUTH ASIA • ACTIVE MONITORING
        </div>

        <div className="mt-3 flex items-center gap-2 text-[9px] text-slate-500">
          <span
            className="
              h-2
              w-2
              animate-pulse
              rounded-full
              bg-emerald-400
            "
          />

          {loading
            ? "CONNECTING TO DATA SERVICE"
            : error
            ? "DATA SERVICE ERROR"
            : "SATELLITE FEED ONLINE"}
        </div>
      </div>

      {/* =================================================
          SENSOR FILTER
      ================================================= */}

      <div
        className="
          absolute
          right-4
          top-[92px]
          z-[2000]
          rounded-xl
          border
          border-[#1F2937]
          bg-[#030712]/90
          p-3
          backdrop-blur-xl
          sm:right-6
        "
      >
        <div className="mb-2 text-[9px] tracking-widest text-[#38BDF8]">
          SENSOR
        </div>

        <div className="flex gap-1.5">
          {(
            ["ALL", "VIIRS", "MODIS"] as const
          ).map((sensor) => (
            <button
              key={sensor}
              onClick={() =>
                setSensorFilter(sensor)
              }
              className={`
                rounded-md
                px-3
                py-2
                text-[10px]
                font-medium
                transition
                ${
                  sensorFilter === sensor
                    ? "bg-[#38BDF8] text-black"
                    : "border border-[#1F2937] bg-white/5 text-slate-300 hover:border-[#38BDF8]/40"
                }
              `}
            >
              {sensor}
            </button>
          ))}
        </div>
      </div>

      {/* =================================================
          INCIDENT BUTTON
      ================================================= */}

      <button
        onClick={() =>
          setShowIncidents(
            (current) => !current
          )
        }
        className="
          absolute
          bottom-28
          left-4
          z-[2200]
          rounded-lg
          border
          border-[#38BDF8]/30
          bg-[#030712]/90
          px-4
          py-3
          text-[10px]
          font-semibold
          tracking-widest
          text-[#38BDF8]
          shadow-xl
          backdrop-blur-xl
          transition
          hover:bg-[#38BDF8]/15
          sm:left-6
        "
      >
        {showIncidents
          ? "CLOSE INCIDENTS"
          : "ACTIVE INCIDENTS"}
      </button>

      {/* =================================================
          INCIDENT LIST
      ================================================= */}

      {showIncidents && (
        <div
          className="
            absolute
            bottom-40
            left-4
            z-[2100]
            w-[320px]
            max-w-[calc(100%-2rem)]
            rounded-xl
            border
            border-[#1F2937]
            bg-[#030712]/95
            p-3
            shadow-2xl
            backdrop-blur-xl
            sm:left-6
          "
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[9px] tracking-[0.25em] text-[#38BDF8]">
              ACTIVE INCIDENTS
            </span>

            <span className="font-mono text-xs text-slate-500">
              {filteredHotspots.length}
            </span>
          </div>

          <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {loading && (
              <div className="rounded-lg border border-[#1F2937] p-3 text-xs text-slate-400">
                Loading satellite observations...
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            {!loading &&
              !error &&
              filteredHotspots
                .slice(0, 20)
                .map((spot) => (
                  <button
                    key={spot.id}
                    onClick={() => {
                      setSelected(spot);
                      setShowIncidents(false);
                    }}
                    className={`
                      w-full
                      rounded-lg
                      border
                      p-3
                      text-left
                      transition
                      ${
                        selected?.id === spot.id
                          ? "border-[#38BDF8]/70 bg-[#38BDF8]/10"
                          : "border-[#1F2937] bg-[#0B1117]/80 hover:border-[#38BDF8]/40"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {spot.location}
                      </span>

                      <span
                        className={`
                          text-[9px]
                          font-bold
                          ${
                            spot.intensity ===
                            "CRITICAL"
                              ? "text-red-400"
                              : spot.intensity ===
                                "HIGH"
                              ? "text-orange-400"
                              : "text-yellow-300"
                          }
                        `}
                      >
                        {spot.intensity}
                      </span>
                    </div>

                    <div className="mt-1 flex justify-between text-[9px] text-slate-500">
                      <span>
                        {spot.temp}
                      </span>

                      <span>
                        {spot.sensor}
                      </span>
                    </div>
                  </button>
                ))}

            {!loading &&
              !error &&
              filteredHotspots.length ===
                0 && (
                <div className="rounded-lg border border-[#1F2937] p-3 text-xs text-slate-500">
                  No hotspots found for this filter.
                </div>
              )}
          </div>
        </div>
      )}

      {/* =================================================
          TIME WINDOW
      ================================================= */}

      <div
        className="
          absolute
          bottom-5
          left-1/2
          z-[2000]
          w-[360px]
          max-w-[calc(100%-2rem)]
          -translate-x-1/2
          rounded-xl
          border
          border-[#1F2937]
          bg-[#030712]/90
          p-4
          backdrop-blur-xl
          sm:w-[420px]
        "
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] tracking-widest text-[#38BDF8]">
            TIME WINDOW
          </span>

          <span className="font-mono text-xs text-slate-300">
            {timeOffset === 0
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
          className="w-full accent-[#38BDF8]"
          aria-label="Wildfire observation time"
        />

        <div className="mt-1 flex justify-between text-[9px] text-slate-600">
          <span>NOW</span>
          <span>24H AGO</span>
        </div>
      </div>

      {/* =================================================
          HOTSPOT COUNTER
      ================================================= */}

      <div
        className="
          absolute
          bottom-5
          right-4
          z-[2000]
          hidden
          rounded-xl
          border
          border-[#1F2937]
          bg-[#030712]/90
          px-4
          py-3
          backdrop-blur-xl
          sm:block
        "
      >
        <div className="text-[9px] tracking-widest text-slate-500">
          HOTSPOTS DETECTED
        </div>

        <div className="mt-1 text-2xl font-bold text-[#38BDF8]">
          {filteredHotspots.length}
        </div>
      </div>

      {/* =================================================
          LEGEND
      ================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-5
          left-4
          z-[1800]
          hidden
          gap-4
          rounded-lg
          border
          border-[#1F2937]
          bg-[#030712]/90
          px-4
          py-3
          text-[9px]
          backdrop-blur-xl
          md:flex
          sm:left-6
        "
      >
        <span>
          <i className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500" />
          CRITICAL {criticalCount}
        </span>

        <span>
          <i className="mr-2 inline-block h-2 w-2 rounded-full bg-orange-500" />
          HIGH {highCount}
        </span>

        <span>
          <i className="mr-2 inline-block h-2 w-2 rounded-full bg-yellow-300" />
          MEDIUM {mediumCount}
        </span>
      </div>

      {/* =================================================
          INTELLIGENCE PANEL
      ================================================= */}

      {selected && (
        <aside
          className="
            absolute
            right-0
            top-0
            z-[5000]
            h-full
            w-full
            max-w-[440px]
            overflow-y-auto
            border-l
            border-[#38BDF8]/20
            bg-[#070D14]/97
            shadow-[-20px_0_60px_rgba(0,0,0,.45)]
            backdrop-blur-2xl
          "
        >
          {/* PANEL HEADER */}

          <div
            className="
              sticky
              top-0
              z-10
              border-b
              border-[#1F2937]
              bg-[#070D14]/95
              p-5
              backdrop-blur-xl
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[9px] tracking-[0.3em] text-[#38BDF8]">
                  THREAT INTELLIGENCE
                </div>

                <h2 className="mt-2 text-xl font-bold">
                  Active Hotspot
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelected(null)
                }
                aria-label="Close intelligence panel"
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-[#1F2937]
                  text-lg
                  text-slate-400
                  transition
                  hover:border-[#38BDF8]/40
                  hover:text-white
                "
              >
                ×
              </button>
            </div>
          </div>

          <div className="space-y-4 p-5">
            {/* SELECTED REGION */}

            <section className="rounded-xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-5">
              <div className="text-[9px] tracking-widest text-slate-500">
                SELECTED REGION
              </div>

              <div className="mt-2 text-2xl font-bold">
                {selected.location}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-black/30 p-3">
                  <div className="text-[9px] text-slate-500">
                    INTENSITY
                  </div>

                  <div
                    className={`
                      mt-1
                      font-semibold
                      ${
                        selected.intensity ===
                        "CRITICAL"
                          ? "text-red-400"
                          : selected.intensity ===
                            "HIGH"
                          ? "text-orange-400"
                          : "text-yellow-300"
                      }
                    `}
                  >
                    {selected.intensity}
                  </div>
                </div>

                <div className="rounded-lg bg-black/30 p-3">
                  <div className="text-[9px] text-slate-500">
                    TEMPERATURE
                  </div>

                  <div className="mt-1 font-semibold">
                    {selected.temp}
                  </div>
                </div>
              </div>
            </section>

            {/* SENSOR */}

            <section className="rounded-xl border border-[#1F2937] bg-[#030712] p-4">
              <div className="text-[9px] tracking-widest text-slate-500">
                SENSOR SOURCE
              </div>

              <div className="mt-2 text-lg font-bold text-[#38BDF8]">
                {selected.sensor}
              </div>

              {selected.frp && (
                <div className="mt-3 flex justify-between border-t border-white/5 pt-3 text-xs">
                  <span className="text-slate-500">
                    FIRE RADIATIVE POWER
                  </span>

                  <span>
                    {selected.frp}
                  </span>
                </div>
              )}

              {selected.confidence && (
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-slate-500">
                    CONFIDENCE
                  </span>

                  <span>
                    {selected.confidence}
                  </span>
                </div>
              )}
            </section>

            {/* WHY THIS MATTERS */}

            <section className="rounded-xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-4">
              <div className="text-[9px] font-semibold tracking-widest text-[#38BDF8]">
                WHY THIS MATTERS
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {whyThisMatters}
              </p>
            </section>

            {/* THREAT DISTRIBUTION */}

            <section className="rounded-xl border border-[#1F2937] bg-[#030712] p-4">
              <div className="mb-4 text-[9px] tracking-widest text-slate-500">
                THREAT DISTRIBUTION
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[9px] text-slate-500">
                    CRITICAL
                  </div>

                  <div className="mt-1 text-xl font-bold text-red-400">
                    {criticalCount}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-slate-500">
                    HIGH
                  </div>

                  <div className="mt-1 text-xl font-bold text-orange-400">
                    {highCount}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-slate-500">
                    MEDIUM
                  </div>

                  <div className="mt-1 text-xl font-bold text-yellow-300">
                    {mediumCount}
                  </div>
                </div>
              </div>
            </section>

            {/* ACQUISITION */}

            <section className="rounded-xl border border-[#1F2937] bg-[#030712] p-4">
              <div className="text-[9px] tracking-widest text-slate-500">
                OBSERVATION
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    DATE
                  </span>

                  <span>
                    {selected.acq_date ?? "—"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    TIME
                  </span>

                  <span>
                    {selected.acq_time ?? "—"}
                  </span>
                </div>
              </div>
            </section>

            {/* WHO CONTROLS */}

            <section className="rounded-xl border border-[#1F2937] bg-[#030712] p-4">
              <div className="text-[9px] font-semibold tracking-widest text-[#38BDF8]">
                WHO CONTROLS THE RAIL
              </div>

              <div className="mt-2 text-sm font-semibold">
                Rail Operations Control Center
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Monitors affected rail corridors
                and coordinates operational
                decisions when wildfire risk
                approaches railway infrastructure.
              </p>
            </section>

            {/* DOWNLOAD */}

            <button
              onClick={downloadData}
              className="
                w-full
                rounded-lg
                border
                border-[#38BDF8]/30
                bg-[#38BDF8]/10
                px-4
                py-3
                text-[10px]
                font-semibold
                tracking-widest
                text-[#38BDF8]
                transition
                hover:bg-[#38BDF8]/20
              "
            >
              DOWNLOAD FILTERED DATA
            </button>

            {/* DEVELOPER */}

            <section className="rounded-xl border border-[#1F2937] bg-[#030712] p-4">
              <div className="text-[9px] tracking-widest text-slate-500">
                DEVELOPER
              </div>

              <div className="mt-3 text-sm font-semibold">
                Diyamol Jose
              </div>

              <div className="mt-1 text-xs text-slate-500">
                PoC ID: 26
              </div>

              <div className="mt-1 text-xs text-slate-500">
                GitHub: @diyamol123
              </div>

              <div className="mt-3 text-[9px] tracking-widest text-[#38BDF8]">
                INFOCREON INTERNSHIP
              </div>
            </section>
          </div>
        </aside>
      )}

      {/* =================================================
          INFO MODAL
      ================================================= */}

      {showInfo && (
        <div
          className="
            fixed
            inset-0
            z-[7000]
            flex
            items-center
            justify-center
            bg-black/70
            p-4
            backdrop-blur-sm
          "
          onClick={() =>
            setShowInfo(false)
          }
        >
          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              border
              border-[#38BDF8]/25
              bg-[#070D14]
              p-6
              shadow-2xl
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[9px] tracking-[0.3em] text-[#38BDF8]">
                  APPLICATION INFORMATION
                </div>

                <h2 className="mt-2 text-xl font-bold">
                  Wildfire Hotspot Monitor
                </h2>
              </div>

              <button
                onClick={() =>
                  setShowInfo(false)
                }
                className="text-xl text-slate-400 hover:text-white"
                aria-label="Close application information"
              >
                ×
              </button>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-400">
              A satellite-driven wildfire
              intelligence interface for monitoring
              active thermal hotspots, sensor
              observations and threat intensity.
            </p>

            <div className="mt-6 rounded-xl border border-[#1F2937] bg-[#030712] p-4">
              <div className="text-[9px] tracking-widest text-slate-500">
                DEVELOPER SIGNATURE
              </div>

              <div className="mt-3 text-sm font-semibold">
                Architect: Diyamol Jose
              </div>

              <div className="mt-2 text-xs text-slate-400">
                Batch: Batch 2 Interns
              </div>

              <div className="mt-1 text-xs text-slate-400">
                Stack: Next.js, FastAPI, Tailwind CSS, React Leaflet
              </div>

              <div className="mt-1 text-xs text-slate-400">
                PoC ID: 26
              </div>

              <div className="mt-1 text-xs text-slate-400">
                GitHub: @diyamol123
              </div>

              <div className="mt-3 text-[9px] tracking-widest text-[#38BDF8]">
                INFOCREON INTERNSHIP
              </div>
            </div>

            <button
              onClick={() =>
                setShowInfo(false)
              }
              className="
                mt-5
                w-full
                rounded-lg
                border
                border-[#38BDF8]/30
                bg-[#38BDF8]/10
                px-4
                py-3
                text-xs
                font-semibold
                tracking-widest
                text-[#38BDF8]
              "
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </main>
  );
}