import csv
import io
import os

import requests


FIRMS_BASE_URL = (
    "https://firms.modaps.eosdis.nasa.gov/api"
)


def fetch_source(
    api_key: str,
    source: str,
    area: str,
    days: int,
) -> list[dict]:

    url = (
        f"{FIRMS_BASE_URL}/area/csv/"
        f"{api_key}/"
        f"{source}/"
        f"{area}/"
        f"{days}"
    )

    response = requests.get(
        url,
        timeout=30,
    )

    response.raise_for_status()

    return list(
        csv.DictReader(
            io.StringIO(response.text)
        )
    )


def normalize_rows(
    rows: list[dict],
    sensor: str,
) -> list[dict]:

    normalized = []

    for row in rows:
        brightness = (
            row.get("bright_ti4")
            or row.get("brightness")
            or ""
        )

        normalized.append(
            {
                "latitude": row.get("latitude", ""),
                "longitude": row.get("longitude", ""),
                "bright_ti4": brightness,
                "instrument": sensor,
                "frp": row.get("frp", ""),
                "confidence": row.get("confidence", ""),
                "acq_date": row.get("acq_date", ""),
                "acq_time": row.get("acq_time", ""),
            }
        )

    return normalized


def fetch_firms() -> str:

    api_key = os.getenv(
        "NASA_FIRMS_API_KEY"
    )

    if not api_key:
        raise RuntimeError(
            "NASA_FIRMS_API_KEY is missing from .env"
        )

    # South Asia:
    # west, south, east, north
    area = "68,6,90,36"
    days = 3
    
    # NASA FIRMS — VIIRS
    viirs_rows = fetch_source(
        api_key,
        "VIIRS_NOAA20_NRT",
        area,
        days,
    )

    # NASA FIRMS — MODIS
    modis_rows = fetch_source(
        api_key,
        "MODIS_NRT",
        area,
        days,
    )

    # Normalize both datasets
    viirs_rows = normalize_rows(
        viirs_rows,
        "VIIRS",
    )

    modis_rows = normalize_rows(
        modis_rows,
        "MODIS",
    )

    # Combine NASA datasets
    rows = viirs_rows + modis_rows

    if not rows:
        return ""

    output = io.StringIO()

    fieldnames = [
        "latitude",
        "longitude",
        "bright_ti4",
        "instrument",
        "frp",
        "confidence",
        "acq_date",
        "acq_time",
    ]

    writer = csv.DictWriter(
        output,
        fieldnames=fieldnames,
    )

    writer.writeheader()
    writer.writerows(rows)

    return output.getvalue()