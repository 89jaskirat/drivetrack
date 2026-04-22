/**
 * Zone detection service — maps a GPS coordinate to a DriveTrack zone.
 *
 * Uses bounding boxes for major Canadian rideshare markets.
 * Returns null if permission is denied, location unavailable, or coords
 * fall outside all known zones (falls back to manual picker in UI).
 */

import * as Location from 'expo-location';

type ZoneBounds = {
  name: string;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

const ZONES: ZoneBounds[] = [
  { name: 'Calgary',    minLat: 50.84, maxLat: 51.21, minLon: -114.27, maxLon: -113.86 },
  { name: 'Edmonton',   minLat: 53.39, maxLat: 53.70, minLon: -113.72, maxLon: -113.27 },
  { name: 'Red Deer',   minLat: 52.20, maxLat: 52.35, minLon: -113.85, maxLon: -113.73 },
  { name: 'Lethbridge', minLat: 49.60, maxLat: 49.77, minLon: -112.90, maxLon: -112.73 },
  { name: 'Kelowna',    minLat: 49.78, maxLat: 49.92, minLon: -119.50, maxLon: -119.37 },
  { name: 'Vancouver',  minLat: 49.19, maxLat: 49.32, minLon: -123.22, maxLon: -123.00 },
  { name: 'Toronto',    minLat: 43.58, maxLat: 43.86, minLon: -79.64,  maxLon: -79.12  },
  { name: 'Ottawa',     minLat: 45.27, maxLat: 45.49, minLon: -75.93,  maxLon: -75.52  },
];

function matchZone(lat: number, lon: number): string | null {
  for (const z of ZONES) {
    if (lat >= z.minLat && lat <= z.maxLat && lon >= z.minLon && lon <= z.maxLon) {
      return z.name;
    }
  }
  return null;
}

/**
 * Requests foreground location permission and returns the detected zone name,
 * or null if permission denied or coordinates not in a known zone.
 */
export async function detectZone(): Promise<string | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return matchZone(pos.coords.latitude, pos.coords.longitude);
  } catch {
    return null;
  }
}

/** All supported zone names for the manual picker */
export const SUPPORTED_ZONES = ZONES.map((z) => z.name).concat(['Other']);
