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
  () =>
    import(
      "./components/WildfireMap"
    ),
  {
    ssr: false,

    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[#030712] text-cyan-400">
        LOADING WILDFIRE INTELLIGENCE...
      </div>
    ),
  }
);

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

export default function Home() {
  const [hotspots, setHotspots] =
    useState<Hotspot[]>([]);

  const [selected, setSelected] =
    useState<Hotspot | null>(null);

  const [sensorFilter, setSensorFilter] =
    useState<
      "ALL" | "VIIRS" | "MODIS"
    >("ALL");
    const [aoiBounds, setAoiBounds] = useState<
  [[number, number], [number, number]] | null
>(null);

  const [timeOffset, setTimeOffset] =
    useState(0);

  const [systemTime, setSystemTime] =
    useState<Date | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

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

    return () => {
      clearInterval(timer);
    };
  }, []);

  // =====================================================
  // LOAD NASA FIRMS DATA
  // =====================================================

  useEffect(() => {
    const loadHotspots = async () => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await fetch(
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

        const data =
          await response.json();

        setHotspots(data);

        if (data.length > 0) {
          setSelected(data[0]);
        }
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
  // SENSOR + TIME FILTER
  // =====================================================

  const filteredHotspots =
    useMemo(() => {
      const now = Date.now();

      return hotspots.filter(
        (spot) => {
          // ---------------------------------------------
          // SENSOR FILTER
          // ---------------------------------------------

          const matchesSensor =
            sensorFilter === "ALL" ||
            spot.sensor ===
              sensorFilter;

          if (!matchesSensor) {
            return false;
          }
// ---------------------------------------------
// AOI FILTER
// ---------------------------------------------

if (aoiBounds) {
  const [[south, west], [north, east]] = aoiBounds;

  const insideAOI =
    spot.lat >= south &&
    spot.lat <= north &&
    spot.lng >= west &&
    spot.lng <= east;

  if (!insideAOI) {
    return false;
  }
}
          // ---------------------------------------------
          // TIME FILTER
          // ---------------------------------------------

          if (
            !spot.acq_date ||
            !spot.acq_time
          ) {
            return true;
          }

          const timeText =
            String(
              spot.acq_time
            ).padStart(4, "0");

          const year =
            spot.acq_date.slice(
              0,
              4
            );

          const month =
            spot.acq_date.slice(
              5,
              7
            );

          const day =
            spot.acq_date.slice(
              8,
              10
            );

          const hours =
            timeText.slice(0, 2);

          const minutes =
            timeText.slice(2, 4);

          const acquisitionTime =
            Date.parse(
              `${year}-${month}-${day}T${hours}:${minutes}:00Z`
            );

          if (
            Number.isNaN(
              acquisitionTime
            )
          ) {
            return true;
          }

          const hoursAgo =
            (now -
              acquisitionTime) /
            (1000 * 60 * 60);

          // ---------------------------------------------
          // NOW
          // ---------------------------------------------

          if (timeOffset === 0) {
            return hoursAgo <= 1;
          }

          // ---------------------------------------------
          // SLIDER WINDOW
          // Example:
          // 6H AGO = approximately 5-7 hours ago
          // ---------------------------------------------

          return (
            hoursAgo >=
              timeOffset - 1 &&
            hoursAgo <=
              timeOffset + 1
          );
        }
      );
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
    if (
      filteredHotspots.length === 0
    ) {
      setSelected(null);
      return;
    }

    const stillVisible =
      selected &&
      filteredHotspots.some(
        (spot) =>
          spot.id ===
          selected.id
      );

    if (!stillVisible) {
      setSelected(
        filteredHotspots[0]
      );
    }
  }, [
    filteredHotspots,
    selected,
  ]);

  // =====================================================
  // THREAT METRICS
  // =====================================================

  const criticalCount =
    filteredHotspots.filter(
      (spot) =>
        spot.intensity ===
        "CRITICAL"
    ).length;

  const highCount =
    filteredHotspots.filter(
      (spot) =>
        spot.intensity ===
        "HIGH"
    ).length;

  const mediumCount =
    filteredHotspots.filter(
      (spot) =>
        spot.intensity ===
        "MEDIUM"
    ).length;

  // =====================================================
  // EXPORT SNAPSHOT
  // =====================================================

  const exportSnapshot =
    async () => {
      if (!dashboardRef.current) {
        return;
      }

      try {
        const canvas =
          await html2canvas(
            dashboardRef.current,
            {
              useCORS: true,
              backgroundColor:
                "#030712",
            }
          );

        const link =
          document.createElement(
            "a"
          );

        link.download =
          "wildfire-aoi-snapshot.png";

        link.href =
          canvas.toDataURL(
            "image/png"
          );

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

  const downloadData =
    () => {
      const blob =
        new Blob(
          [
            JSON.stringify(
              filteredHotspots,
              null,
              2
            ),
          ],
          {
            type:
              "application/json",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        "wildfire-hotspots.json";

      link.click();

      URL.revokeObjectURL(
        url
      );
    };

  // =====================================================
  // WHY THIS MATTERS
  // =====================================================

  const whyThisMatters =
    selected?.intensity ===
    "CRITICAL"
      ? "High-intensity thermal activity requires close monitoring because conditions may develop rapidly near critical infrastructure."
      : selected?.intensity ===
        "HIGH"
      ? "Elevated thermal activity indicates a developing risk zone that should remain under close observation."
      : "Moderate thermal activity should continue to be monitored for signs of escalation.";

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-[#030712] text-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <header
        className="
          relative
          z-[3000]
          flex
          min-h-20
          flex-col
          gap-3
          border-b
          border-[#1F2937]
          bg-[#030712]/95
          px-4
          py-3
          backdrop-blur
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:px-6
          md:px-10
        "
      >

        <div>
          <div
            className="
              text-xs
              tracking-[0.35em]
              text-[#38BDF8]
            "
          >
            REAL RAILS • POC 26
          </div>

          <h1
            className="
              mt-1
              text-xl
              font-bold
              tracking-[0.08em]
              md:text-2xl
            "
          >
            WILDFIRE HOTSPOT MONITOR
          </h1>

          <div
            className="
              mt-1
              text-[9px]
              tracking-[0.3em]
              text-slate-500
            "
          >
            REAL RAILS WILDFIRE INTELLIGENCE
          </div>
        </div>

        <div className="flex items-center gap-4">

          <div className="text-right">

            <div className="text-xs text-slate-500">
              SYSTEM TIME
            </div>

            <div className="font-mono text-[#38BDF8]">
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

          <button
            onClick={
              exportSnapshot
            }
            className="
              rounded-lg
              border
              border-[#38BDF8]/30
              bg-[#38BDF8]/10
              px-4
              py-2
              text-xs
              font-semibold
              tracking-wider
              text-[#38BDF8]
              transition
              hover:bg-[#38BDF8]/20
            "
          >
            EXPORT AOI SNAPSHOT
          </button>

        </div>
      </header>

      {/* =================================================
          DASHBOARD
      ================================================= */}

      <section
        ref={dashboardRef}
        className="
          grid
          min-h-[calc(100vh-5rem)]
          grid-cols-1
          lg:grid-cols-[70%_30%]
        "
      >

        {/* =================================================
            MAP
        ================================================= */}

        <div
          className="
            relative
            min-h-[650px]
            overflow-hidden
            bg-[#030712]
          "
        >

          {/* LEAFLET MAP */}

          <WildfireMap
  hotspots={filteredHotspots}
  selectedId={selected?.id ?? null}
  onSelect={setSelected}
  onAOIChange={(bounds) => {
    if (!bounds) {
      setAoiBounds(null);
      return;
    }

    if (Array.isArray(bounds)) {
      setAoiBounds(
        bounds as [[number, number], [number, number]]
      );
    }
  }}
/>

{/* MAP ATMOSPHERE */}

<div
  className="
    pointer-events-none
    absolute
    inset-0
    z-[400]
    bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,7,18,.08)_50%,rgba(3,7,18,.65)_100%)]
  "
>
/</div>

          {/* GRID */}

          <div
            className="
              pointer-events-none
              absolute
              inset-0
              z-[500]
              opacity-20
            "
            style={{
              backgroundImage:
                "linear-gradient(rgba(56,189,248,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.10) 1px, transparent 1px)",
              backgroundSize:
                "50px 50px",
            }}
          />

          {/* RADAR */}

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

            <div
              className="
                h-[420px]
                w-[420px]
                rounded-full
                border
                border-[#38BDF8]/10
              "
            />

            <div
              className="
                absolute
                inset-[70px]
                rounded-full
                border
                border-[#38BDF8]/10
              "
            />

            <div
              className="
                absolute
                inset-[140px]
                rounded-full
                border
                border-[#38BDF8]/10
              "
            />

          </div>

          {/* MAP LABEL */}

          <div
            className="
              pointer-events-none
              absolute
              left-6
              top-6
              z-[1000]
              rounded
              border
              border-[#38BDF8]/20
              bg-[#030712]/85
              px-4
              py-3
              backdrop-blur
            "
          >

            <div
              className="
                text-[10px]
                tracking-[0.25em]
                text-[#38BDF8]
              "
            >
              LIVE SATELLITE ANALYSIS
            </div>

            <div
              className="
                mt-1
                text-sm
                text-slate-300
              "
            >
              SOUTH ASIA • ACTIVE MONITORING
            </div>

          </div>

          {/* =================================================
              SENSOR FILTER
          ================================================= */}

          <div
            className="
              absolute
              right-6
              top-6
              z-[2000]
              rounded-xl
              border
              border-[#1F2937]
              bg-[#030712]/90
              p-3
              backdrop-blur
            "
          >

            <div
              className="
                mb-2
                text-[10px]
                tracking-widest
                text-[#38BDF8]
              "
            >
              SENSOR
            </div>

            <div className="flex gap-2">

              {(
                [
                  "ALL",
                  "VIIRS",
                  "MODIS",
                ] as const
              ).map(
                (sensor) => (

                  <button
                    key={sensor}
                    onClick={() =>
                      setSensorFilter(
                        sensor
                      )
                    }
                    className={`
                      rounded
                      px-3
                      py-2
                      text-xs
                      transition
                      ${
                        sensorFilter ===
                        sensor
                          ? "bg-[#38BDF8] text-black"
                          : "border border-[#1F2937] bg-white/5 text-slate-300 hover:bg-[#38BDF8]/10"
                      }
                    `}
                  >
                    {sensor}
                  </button>

                )
              )}

            </div>

          </div>

          {/* =================================================
              ACTIVE INCIDENTS
          ================================================= */}

          <div
            className="
              absolute
              left-6
              top-24
              z-[1500]
              w-72
              max-w-[calc(100%-3rem)]
            "
          >

            <div
              className="
                mb-2
                text-[10px]
                tracking-[0.25em]
                text-[#38BDF8]
              "
            >
              ACTIVE INCIDENTS
            </div>

            <div
              className="
                max-h-[calc(100vh-18rem)]
                space-y-2
                overflow-y-auto
                pr-1
              "
            >

              {/* LOADING */}

              {loading && (
                <div
                  className="
                    rounded-lg
                    border
                    border-[#1F2937]
                    bg-[#0B1117]/90
                    p-4
                    text-xs
                    text-slate-400
                  "
                >
                  Loading NASA FIRMS observations...
                </div>
              )}

              {/* ERROR */}

              {error && (
                <div
                  className="
                    rounded-lg
                    border
                    border-red-500/30
                    bg-red-500/10
                    p-4
                    text-xs
                    text-red-300
                  "
                >
                  {error}
                </div>
              )}

              {/* HOTSPOTS */}

              {!loading &&
                !error &&
                filteredHotspots.map(
                  (spot) => (

                    <button
                      key={spot.id}
                      onClick={() =>
                        setSelected(
                          spot
                        )
                      }
                      className={`
                        w-full
                        rounded-lg
                        border
                        p-3
                        text-left
                        backdrop-blur
                        transition
                        ${
                          selected?.id ===
                          spot.id
                            ? "border-[#38BDF8]/70 bg-[#38BDF8]/10 shadow-[0_0_20px_rgba(56,189,248,.10)]"
                            : "border-[#1F2937] bg-[#0B1117]/90 hover:border-[#38BDF8]/40"
                        }
                      `}
                    >

                      <div
                        className="
                          flex
                          items-center
                          justify-between
                        "
                      >

                        <span
                          className="
                            text-sm
                            font-semibold
                            text-white
                          "
                        >
                          {spot.location}
                        </span>

                        <span
                          className={`
                            text-[10px]
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

                      <div
                        className="
                          mt-1
                          flex
                          justify-between
                          text-[10px]
                          text-slate-500
                        "
                      >

                        <span>
                          {spot.temp}
                        </span>

                        <span>
                          {spot.sensor}
                        </span>

                      </div>

                    </button>

                  )
                )}

              {/* EMPTY */}

              {!loading &&
                !error &&
                filteredHotspots.length ===
                  0 && (
                  <div
                    className="
                      rounded-lg
                      border
                      border-[#1F2937]
                      bg-[#0B1117]/90
                      p-4
                      text-xs
                      text-slate-500
                    "
                  >
                    No hotspots found for
                    this sensor/time
                    window.
                  </div>
                )}

            </div>

          </div>

          {/* =================================================
              TIME WINDOW
          ================================================= */}

          <div
            className="
              absolute
              bottom-6
              left-1/2
              z-[2000]
              w-[380px]
              max-w-[calc(100%-2rem)]
              -translate-x-1/2
              rounded-xl
              border
              border-[#1F2937]
              bg-[#030712]/90
              p-4
              backdrop-blur
            "
          >

            <div
              className="
                mb-2
                flex
                items-center
                justify-between
                text-xs
              "
            >

              <span
                className="
                  tracking-widest
                  text-[#38BDF8]
                "
              >
                TIME WINDOW
              </span>

              <span
                className="
                  font-mono
                  text-slate-300
                "
              >
                {timeOffset ===
                0
                  ? "NOW"
                  : `${timeOffset}H AGO`}
              </span>

            </div>

            <input
              type="range"
              min="0"
              max="24"
              value={
                timeOffset
              }
              onChange={(event) =>
                setTimeOffset(
                  Number(
                    event.target.value
                  )
                )
              }
              className="
                w-full
                accent-[#38BDF8]
              "
              aria-label="Wildfire observation time"
            />

            <div
              className="
                mt-1
                flex
                justify-between
                text-[10px]
                text-slate-600
              "
            >

              <span>
                NOW
              </span>

              <span>
                24H AGO
              </span>

            </div>

          </div>

          {/* =================================================
              LEGEND
          ================================================= */}

          <div
            className="
              pointer-events-none
              absolute
              bottom-6
              left-6
              z-[2000]
              flex
              gap-5
              rounded
              border
              border-[#1F2937]
              bg-[#030712]/90
              px-4
              py-3
              text-xs
              backdrop-blur
            "
          >

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

          {/* =================================================
              HOTSPOT COUNT
          ================================================= */}

          <div
            className="
              absolute
              bottom-6
              right-6
              z-[2000]
              rounded
              border
              border-[#1F2937]
              bg-[#030712]/90
              px-4
              py-3
              text-xs
              backdrop-blur
            "
          >

            <div className="text-slate-500">
              HOTSPOTS DETECTED
            </div>

            <div
              className="
                text-2xl
                font-bold
                text-[#38BDF8]
              "
            >
              {filteredHotspots.length}
            </div>

          </div>

        </div>

        {/* =================================================
            INTELLIGENCE SIDEBAR
        ================================================= */}

        <aside
          className="
            relative
            z-[3000]
            min-h-[650px]
            overflow-y-auto
            border-l
            border-[#1F2937]
            bg-[#0B1117]
            p-6
          "
        >

          <div className="mb-8">

            <div
              className="
                text-xs
                tracking-[0.3em]
                text-[#38BDF8]
              "
            >
              THREAT INTELLIGENCE
            </div>

            <h2
              className="
                mt-2
                text-xl
                font-semibold
              "
            >
              Active Hotspot
            </h2>

          </div>

          {/* SELECTED HOTSPOT */}

          {selected ? (

            <div
              className="
                rounded-xl
                border
                border-[#38BDF8]/20
                bg-[#38BDF8]/5
                p-5
              "
            >

              <div
                className="
                  text-xs
                  text-slate-500
                "
              >
                SELECTED REGION
              </div>

              <div
                className="
                  mt-1
                  text-2xl
                  font-bold
                "
              >
                {selected.location}
              </div>

              <div
                className="
                  mt-6
                  grid
                  grid-cols-2
                  gap-3
                "
              >

                <div
                  className="
                    rounded-lg
                    bg-black/30
                    p-3
                  "
                >

                  <div
                    className="
                      text-[10px]
                      text-slate-500
                    "
                  >
                    INTENSITY
                  </div>

                  <div
                    className={`
                      mt-1
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

                <div
                  className="
                    rounded-lg
                    bg-black/30
                    p-3
                  "
                >

                  <div
                    className="
                      text-[10px]
                      text-slate-500
                    "
                  >
                    TEMP
                  </div>

                  <div
                    className="
                      mt-1
                      text-white
                    "
                  >
                    {selected.temp}
                  </div>

                </div>

              </div>

            </div>

          ) : (

            <div
              className="
                rounded-xl
                border
                border-[#1F2937]
                bg-[#030712]
                p-5
                text-sm
                text-slate-500
              "
            >
              No hotspot selected.
            </div>

          )}

          {/* METRICS */}

          <div
            className="
              mt-4
              grid
              grid-cols-2
              gap-3
            "
          >

            <div
              className="
                rounded-xl
                border
                border-[#1F2937]
                bg-[#030712]
                p-4
              "
            >

              <div
                className="
                  text-[10px]
                  tracking-widest
                  text-[#38BDF8]
                "
              >
                ACTIVE HOTSPOTS
              </div>

              <div
                className="
                  mt-2
                  text-2xl
                  font-bold
                "
              >
                {filteredHotspots.length}
              </div>

            </div>

            <div
              className="
                rounded-xl
                border
                border-[#1F2937]
                bg-[#030712]
                p-4
              "
            >

              <div
                className="
                  text-[10px]
                  tracking-widest
                  text-[#38BDF8]
                "
              >
                SENSOR SOURCE
              </div>

              <div
                className="
                  mt-2
                  text-lg
                  font-bold
                "
              >
                {selected?.sensor ??
                  "—"}
              </div>

            </div>

          </div>

          {/* THREAT DISTRIBUTION */}

          <div
            className="
              mt-4
              rounded-xl
              border
              border-[#1F2937]
              bg-[#030712]
              p-4
            "
          >

            <div
              className="
                mb-3
                text-[10px]
                tracking-widest
                text-slate-500
              "
            >
              THREAT DISTRIBUTION
            </div>

            <div
              className="
                grid
                grid-cols-3
                gap-3
              "
            >

              <div>
                <div className="text-[10px] text-slate-500">
                  CRITICAL
                </div>

                <div
                  className="
                    mt-1
                    text-lg
                    font-bold
                    text-red-400
                  "
                >
                  {criticalCount}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500">
                  HIGH
                </div>

                <div
                  className="
                    mt-1
                    text-lg
                    font-bold
                    text-orange-400
                  "
                >
                  {highCount}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500">
                  MEDIUM
                </div>

                <div
                  className="
                    mt-1
                    text-lg
                    font-bold
                    text-yellow-300
                  "
                >
                  {mediumCount}
                </div>
              </div>

            </div>

          </div>

          {/* WHY THIS MATTERS */}

          <div
            className="
              mt-4
              rounded-xl
              border
              border-[#38BDF8]/20
              bg-[#38BDF8]/5
              p-4
            "
          >

            <div
              className="
                text-xs
                font-semibold
                tracking-widest
                text-[#38BDF8]
              "
            >
              WHY THIS MATTERS
            </div>

            <p
              className="
                mt-2
                text-sm
                leading-5
                text-slate-300
              "
            >
              {selected
                ? whyThisMatters
                : "Select a hotspot to generate an operational wildfire intelligence insight."}
            </p>

          </div>

          {/* WHO CONTROLS THE RAIL */}

          <div
            className="
              mt-4
              rounded-xl
              border
              border-[#1F2937]
              bg-[#030712]
              p-4
            "
          >

            <div
              className="
                text-xs
                font-semibold
                tracking-widest
                text-[#38BDF8]
              "
            >
              WHO CONTROLS THE RAIL
            </div>

            <div
              className="
                mt-2
                text-sm
                font-semibold
              "
            >
              Rail Operations Control Center
            </div>

            <p
              className="
                mt-2
                text-xs
                leading-5
                text-slate-400
              "
            >
              Monitors affected rail
              corridors and coordinates
              operational decisions when
              wildfire risk approaches
              railway infrastructure.
            </p>

          </div>

          {/* DOWNLOAD */}

          <button
            onClick={
              downloadData
            }
            className="
              mt-4
              w-full
              rounded-lg
              border
              border-[#38BDF8]/30
              bg-[#38BDF8]/10
              px-4
              py-3
              text-xs
              font-semibold
              tracking-wider
              text-[#38BDF8]
              transition
              hover:bg-[#38BDF8]/20
            "
          >
            DOWNLOAD SAMPLE DATA
          </button>

          {/* SYSTEM STATUS */}

          <div className="mt-6">

            <div
              className="
                mb-3
                text-xs
                tracking-widest
                text-slate-500
              "
            >
              SYSTEM STATUS
            </div>

            <div className="space-y-3">

              {[
                [
                  "NASA FIRMS feed",
                  loading
                    ? "LOADING"
                    : error
                    ? "ERROR"
                    : "ONLINE",
                ],

                [
                  "Hotspot detection",
                  filteredHotspots.length >
                  0
                    ? "ACTIVE"
                    : "WAITING",
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
                    className="
                      flex
                      items-center
                      justify-between
                      border-b
                      border-white/5
                      pb-3
                    "
                  >

                    <span
                      className="
                        text-sm
                        text-slate-500
                      "
                    >
                      {label}
                    </span>

                    <span
                      className="
                        text-xs
                        text-emerald-400
                      "
                    >
                      ● {status}
                    </span>

                  </div>

                )
              )}

            </div>

          </div>

          {/* LAST UPDATE */}

          <div
            className="
              mt-8
              rounded-xl
              border
              border-[#1F2937]
              bg-[#030712]
              p-4
            "
          >

            <div
              className="
                text-xs
                text-[#38BDF8]
              "
            >
              LAST UPDATE
            </div>

            <div
              className="
                mt-1
                font-mono
                text-sm
              "
            >
              {systemTime
                ? systemTime.toLocaleTimeString(
                    "en-IN",
                    {
                      hour12: false,
                    }
                  )
                : "--:--:--"}
            </div>

            <div
              className="
                mt-2
                text-xs
                text-slate-500
              "
            >
              Monitoring network is
              receiving satellite-derived
              hotspot observations.
            </div>

          </div>

        </aside>

      </section>

    </main>
  );
}