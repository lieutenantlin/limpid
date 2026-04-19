"""
CUGN Velocity Lookup Tool

Given a lat/lon coordinate, find the nearest profile in CUGN_along.nc
and return eastern (u) and northern (v) velocity values.
"""

import argparse
import numpy as np
import xarray as xr
from scipy.spatial import cKDTree
from functools import lru_cache

# Data file path (relative to backend/ directory)
DATA_FILE = "data/CUGN_along.nc"

# Cached data and KDTree
_data = None
_tree = None


def _load_data():
    global _data, _tree
    if _data is None:
        _data = xr.open_dataset(DATA_FILE)
        lat = _data['lat_uv'].values
        lon = _data['lon_uv'].values
        valid = np.isfinite(lat) & np.isfinite(lon)
        lat = lat[valid]
        lon = lon[valid]
        points = np.column_stack([lat, lon])
        _tree = cKDTree(points)
        _data['_valid_indices'] = np.where(valid)[0]
    return _data, _tree


def find_nearest_velocity(lat: float, lon: float, depth: float = None) -> dict:
    data, tree = _load_data()
    valid_indices = data['_valid_indices'].values
    
    query_point = np.array([lat, lon])
    distance, nearest_tree_idx = tree.query(query_point, k=1)
    profile_idx = int(valid_indices[nearest_tree_idx])
    
    if depth is None:
        u = float(data['u_depth_mean'].values[profile_idx])
        v = float(data['v_depth_mean'].values[profile_idx])
        result_depth = None
    else:
        depths = data['depth'].values
        depth_idx = np.abs(depths - depth).argmin()
        result_depth = int(depths[depth_idx])
        
        u = float(data['u'].values[depth_idx, profile_idx])
        v = float(data['v'].values[depth_idx, profile_idx])
    
    return {
        'u': u,
        'v': v,
        'lat': float(data['lat_uv'].values[profile_idx]),
        'lon': float(data['lon_uv'].values[profile_idx]),
        'depth': result_depth,
        'profile_index': profile_idx,
        'distance_km': float(distance * 111)
    }


def get_depth_averaged_velocity(lat: float, lon: float) -> dict:
    """Get depth-averaged velocity (convenience function)."""
    return find_nearest_velocity(lat, lon, depth=None)


def get_velocity_at_depth(lat: float, lon: float, depth: float) -> dict:
    """Get velocity at a specific depth (convenience function)."""
    return find_nearest_velocity(lat, lon, depth=depth)


def main():
    """CLI interface."""
    parser = argparse.ArgumentParser(
        description="Find nearest velocity data in CUGN dataset"
    )
    parser.add_argument('--lat', type=float, required=True, help='Latitude')
    parser.add_argument('--lon', type=float, required=True, help='Longitude')
    parser.add_argument('--depth', type=float, help='Depth in meters (optional)')
    
    args = parser.parse_args()
    
    result = find_nearest_velocity(args.lat, args.lon, args.depth)
    
    print(f"Nearest profile at lat={result['lat']:.4f}, lon={result['lon']:.4f}")
    print(f"Profile index: {result['profile_index']}")
    print(f"Distance from query: ~{result['distance_km']:.1f} km")
    
    if result['depth'] is not None:
        print(f"Depth: {result['depth']}m")
    
    print(f"\nEastern velocity (u): {result['u']:.4f} m/s")
    print(f"Northern velocity (v): {result['v']:.4f} m/s")
    
    # Also show as compass direction
    speed = np.sqrt(result['u']**2 + result['v']**2)
    direction = np.degrees(np.arctan2(result['v'], result['u']))
    print(f"\nSpeed: {speed:.4f} m/s")
    print(f"Direction: {direction:.1f} degrees (from east)")


if __name__ == "__main__":
    main()