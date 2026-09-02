from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from adapters.firms import fetch_firms

import csv
import io
import math
import os


load_dotenv()


app = FastAPI(
    title="Wildfire Hotspot Monitor",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# REGION LOOKUP
# ---------------------------------------------------------
# This keeps the NASA coordinates intact while providing
# readable regional labels for the intelligence cards.
#
# These are intentionally broad geographic regions rather
# than pretending that every satellite point is a confirmed
# administrative boundary.
# ---------------------------------------------------------

def get_region(lat: float, lng: float) -> str:

    # Sri Lanka
    if 5.8 <= lat <= 9.9 and 79.5 <= lng <= 82.0:
        return "Sri Lanka"

    # Tamil Nadu
    if 8.0 <= lat <= 13.6 and 76.8 <= lng <= 80.4:
        return "Tamil Nadu"

    # Kerala
    if 8.2 <= lat <= 12.8 and 74.8 <= lng <= 77.4:
        return "Kerala"

    # Karnataka
    if 11.5 <= lat <= 18.5 and 74.0 <= lng <= 78.7:
        return "Karnataka"

    # Andhra Pradesh
    if 12.5 <= lat <= 19.5 and 77.0 <= lng <= 84.8:
        return "Andhra Pradesh"

    # Telangana
    if 15.5 <= lat <= 19.5 and 77.0 <= lng <= 81.5:
        return "Telangana"

    # Odisha
    if 17.5 <= lat <= 22.8 and 81.0 <= lng <= 87.8:
        return "Odisha"

    # West Bengal
    if 21.5 <= lat <= 27.2 and 85.5 <= lng <= 89.9:
        return "West Bengal"

    # Bihar
    if 24.0 <= lat <= 27.6 and 83.0 <= lng <= 88.5:
        return "Bihar"

    # Uttar Pradesh
    if 24.0 <= lat <= 30.5 and 77.0 <= lng <= 84.7:
        return "Uttar Pradesh"

    # Northeast India / Arunachal region
    if 26.0 <= lat <= 30.0 and 91.0 <= lng <= 97.5:
        return "Northeast India"

    # Himachal Pradesh
    if 30.0 <= lat <= 33.5 and 75.0 <= lng <= 79.5:
        return "Himachal Pradesh"

    # Pakistan
    if 23.5 <= lat <= 37.5 and 60.0 <= lng <= 77.5:
        return "Pakistan"

    # Myanmar
    if 9.5 <= lat <= 28.5 and 92.0 <= lng <= 101.5:
        return "Myanmar"

    return "Regional hotspot"


# ---------------------------------------------------------
# INTENSITY
# ---------------------------------------------------------

def classify_intensity(brightness_kelvin: float) -> str:

    if brightness_kelvin >= 350:
        return "CRITICAL"

    if brightness_kelvin >= 335:
        return "HIGH"

    return "MEDIUM"


# ---------------------------------------------------------
# CELSIUS
# ---------------------------------------------------------

def kelvin_to_celsius(kelvin: float) -> float:
    return kelvin - 273.15


# ---------------------------------------------------------
# ROOT
# ---------------------------------------------------------

@app.get("/")
def root():

    return {
        "project": "Wildfire Hotspot Monitor",
        "status": "online",
        "source": "NASA FIRMS",
    }


# ---------------------------------------------------------
# HEALTH
# ---------------------------------------------------------

@app.get("/api/health")
def health():

    return {
        "status": "healthy",
        "service": "wildfire-hotspot-monitor",
    }


# ---------------------------------------------------------
# HOTSPOTS
# ---------------------------------------------------------

@app.get("/api/hotspots")
def get_hotspots():

    csv_text = fetch_firms()

    rows = csv.DictReader(
        io.StringIO(csv_text)
    )

    hotspots = []

    for index, row in enumerate(rows, start=1):

        try:

            lat = float(row["latitude"])
            lng = float(row["longitude"])

            brightness_kelvin = float(
                row["bright_ti4"]
            )

            brightness_celsius = kelvin_to_celsius(
                brightness_kelvin
            )

            intensity = classify_intensity(
                brightness_kelvin
            )

            sensor = (
                row.get("instrument")
                or "VIIRS"
            ).upper()

            location = get_region(
                lat,
                lng
            )

            frp = row.get("frp")

            confidence = row.get(
                "confidence"
            )

            acquisition_date = row.get(
                "acq_date"
            )

            acquisition_time = row.get(
                "acq_time"
            )

            hotspots.append({

                "id": index,

                "lat": lat,

                "lng": lng,

                "intensity": intensity,

                "location": location,

                "temp": (
                    f"{brightness_celsius:.1f}°C"
                ),

                "sensor": sensor,

                "frp": frp,

                "confidence": confidence,

                "acq_date": acquisition_date,

                "acq_time": acquisition_time,

            })

        except (
            ValueError,
            TypeError,
            KeyError,
        ):

            continue

    return hotspots