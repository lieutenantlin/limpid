#!/usr/bin/env python3
"""
NOAA Marine Microplastics Lookup Tool

Given a lat/lon coordinate, find the nearest data point in the NOAA Marine Microplastics dataset
and return the concentration class and measurement.
"""

import argparse
import csv
import math
import os
import sys

# Data file path (relative to backend/ directory)
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "Marine_Microplastics.csv")

# Valid coordinate ranges from the dataset
LAT_MIN, LAT_MAX = -59.61, 66.22
LON_MIN, LON_MAX = -180.0, 180.0


def load_data():
    """Load the CSV data and return a list of rows with latitude, longitude, concentration class, and measurement."""
    data = []
    try:
        with open(DATA_FILE, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    lat = float(row['Latitude (degree)'])
                    lon = float(row['Longitude (degree)'])
                    conc_class = row['Concentration Class']
                    measurement = float(row['Microplastics Measurement'])
                    data.append({
                        'lat': lat,
                        'lon': lon,
                        'concentration_class': conc_class,
                        'measurement': measurement
                    })
                except (ValueError, KeyError) as e:
                    # Skip rows with invalid data
                    continue
    except FileNotFoundError:
        print(f"Error: Data file not found at {DATA_FILE}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error reading data file: {e}", file=sys.stderr)
        sys.exit(1)
    return data


def find_nearest(lat, lon, data):
    """Find the nearest data point using Euclidean distance."""
    if not data:
        return None

    best_point = None
    min_distance = float('inf')

    for point in data:
        # Euclidean distance in lat/lon space (degrees)
        dlat = point['lat'] - lat
        dlon = point['lon'] - lon
        distance = math.sqrt(dlat * dlat + dlon * dlon)

        if distance < min_distance:
            min_distance = distance
            best_point = point

    return best_point


def main():
    """CLI interface."""
    parser = argparse.ArgumentParser(
        description="Find nearest marine microplastics data in NOAA dataset"
    )
    parser.add_argument('--lat', type=float, required=True, help='Latitude')
    parser.add_argument('--lon', type=float, required=True, help='Longitude')
    
    args = parser.parse_args()

    # Validate coordinate ranges
    if not (LAT_MIN <= args.lat <= LAT_MAX):
        print(f"Error: Latitude {args.lat} is out of valid range [{LAT_MIN}, {LAT_MAX}]", file=sys.stderr)
        sys.exit(1)
    if not (LON_MIN <= args.lon <= LON_MAX):
        print(f"Error: Longitude {args.lon} is out of valid range [{LON_MIN}, {LON_MAX}]", file=sys.stderr)
        sys.exit(1)

    # Load data
    data = load_data()
    if not data:
        print("Error: No data loaded from CSV file", file=sys.stderr)
        sys.exit(1)

    # Find nearest point
    nearest = find_nearest(args.lat, args.lon, data)
    if nearest is None:
        print("Error: Could not find nearest point", file=sys.stderr)
        sys.exit(1)

    # Output in the expected format
    print(f"Concentration Class: {nearest['concentration_class']}")
    print(f"Measurement: {nearest['measurement']} pieces/m3")


if __name__ == "__main__":
    main()