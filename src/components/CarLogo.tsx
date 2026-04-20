/**
 * CarLogo — DriveTrack car mark, implemented with React Native Views.
 * No native dependencies — safe for New Architecture (no react-native-svg needed).
 *
 * Approximates the original SVG design:
 *   - White 3-box sedan silhouette (chassis + cabin)
 *   - Three ascending bar-chart windows (rear blue, mid blue, front cyan)
 *   - Dark wheels that blend into the container background
 *
 * Props:
 *   width     — rendered width in dp (height is auto, 1/3 of width)
 *   bgColor   — wheel fill colour; match the container background so wheels
 *               appear as cutouts (default: '#000000')
 */

import { View } from 'react-native';

interface CarLogoProps {
  width?: number;
  bgColor?: string;
}

export function CarLogo({ width = 200, bgColor = '#000000' }: CarLogoProps) {
  // Scale factor: design coords are in a 300×100 space
  const s = width / 300;
  const height = width * (100 / 300);

  return (
    <View style={{ width, height }}>
      {/* ── Car body ─────────────────────────────────────── */}
      {/* Chassis (lower body, full width) */}
      <View
        style={{
          position: 'absolute',
          left: 18 * s,
          top: 50 * s,
          width: 264 * s,
          height: 26 * s,
          backgroundColor: 'white',
          borderBottomLeftRadius: 10 * s,
          borderBottomRightRadius: 10 * s,
          borderTopLeftRadius: 3 * s,
          borderTopRightRadius: 3 * s,
        }}
      />
      {/* Cabin / greenhouse */}
      <View
        style={{
          position: 'absolute',
          left: 78 * s,
          top: 22 * s,
          width: 148 * s,
          height: 32 * s,
          backgroundColor: 'white',
          borderTopLeftRadius: 16 * s,
          borderTopRightRadius: 12 * s,
        }}
      />
      {/* Hood slope (front) */}
      <View
        style={{
          position: 'absolute',
          left: 210 * s,
          top: 34 * s,
          width: 50 * s,
          height: 16 * s,
          backgroundColor: 'white',
          borderTopRightRadius: 20 * s,
        }}
      />
      {/* Trunk slope (rear) */}
      <View
        style={{
          position: 'absolute',
          left: 40 * s,
          top: 40 * s,
          width: 44 * s,
          height: 10 * s,
          backgroundColor: 'white',
          borderTopLeftRadius: 14 * s,
        }}
      />

      {/* ── Bar-chart windows ─────────────────────────────── */}
      {/* W1 — rear, short (blue) */}
      <View
        style={{
          position: 'absolute',
          left: 102 * s,
          top: 30 * s,
          width: 32 * s,
          height: 8 * s,
          backgroundColor: '#0070cc',
          borderRadius: 2 * s,
        }}
      />
      {/* W2 — mid, medium (blue) */}
      <View
        style={{
          position: 'absolute',
          left: 143 * s,
          top: 25 * s,
          width: 34 * s,
          height: 13 * s,
          backgroundColor: '#0070cc',
          borderRadius: 2 * s,
        }}
      />
      {/* W3 — front, tall (cyan = growth highlight) */}
      <View
        style={{
          position: 'absolute',
          left: 185 * s,
          top: 22 * s,
          width: 30 * s,
          height: 18 * s,
          backgroundColor: '#1eaedb',
          borderRadius: 2 * s,
        }}
      />

      {/* ── Wheels ───────────────────────────────────────── */}
      {/* Rear wheel outer */}
      <View
        style={{
          position: 'absolute',
          left: (72 - 20) * s,
          top: (88 - 20) * s,
          width: 40 * s,
          height: 40 * s,
          borderRadius: 20 * s,
          backgroundColor: bgColor,
          borderWidth: 3 * s,
          borderColor: '#555555',
        }}
      />
      {/* Rear wheel hub */}
      <View
        style={{
          position: 'absolute',
          left: (72 - 5.5) * s,
          top: (88 - 5.5) * s,
          width: 11 * s,
          height: 11 * s,
          borderRadius: 5.5 * s,
          backgroundColor: 'white',
        }}
      />
      {/* Front wheel outer */}
      <View
        style={{
          position: 'absolute',
          left: (228 - 20) * s,
          top: (88 - 20) * s,
          width: 40 * s,
          height: 40 * s,
          borderRadius: 20 * s,
          backgroundColor: bgColor,
          borderWidth: 3 * s,
          borderColor: '#555555',
        }}
      />
      {/* Front wheel hub */}
      <View
        style={{
          position: 'absolute',
          left: (228 - 5.5) * s,
          top: (88 - 5.5) * s,
          width: 11 * s,
          height: 11 * s,
          borderRadius: 5.5 * s,
          backgroundColor: 'white',
        }}
      />
    </View>
  );
}
