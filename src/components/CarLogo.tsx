/**
 * CarLogo — the DriverCompanion/DriveTrack car mark.
 * Ported directly from the approved design file (DriverCompanion Logo.html).
 *
 * SVG viewBox: 0 0 300 100  (3:1 aspect ratio)
 * Design:
 *   - White 3-box sedan silhouette
 *   - Three ascending bar-chart windows (rear blue, mid blue, front cyan)
 *     representing earnings growth — the insight metric concept
 *   - Blue headlight / taillight accents
 *   - Dark wheels that blend into the container background
 *
 * Props:
 *   width       — rendered width in dp (height is auto, 1/3 of width)
 *   bgColor     — wheel fill colour; should match the container background
 *                 so wheels appear as cutouts (default: '#000000')
 */

import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

interface CarLogoProps {
  width?: number;
  bgColor?: string;
}

export function CarLogo({ width = 200, bgColor = '#000000' }: CarLogoProps) {
  const height = width * (100 / 300);
  // Wheel inner rim: slightly lighter than bgColor
  const rimColor = bgColor === '#000000' ? '#1c1c1c' : bgColor;

  return (
    <Svg width={width} height={height} viewBox="0 0 300 100">
      {/* Shadow beneath car */}
      <Ellipse cx="150" cy="95" rx="118" ry="4" fill="#000" opacity="0.5" />

      {/* ── Car body ── */}
      <Path
        d={[
          'M 18,76',
          'C 10,76 8,70 8,64',
          'C 8,58 12,52 22,50',
          'C 36,50 60,50 76,50',
          'C 78,40 82,26 94,22',
          'C 108,18 188,18 204,22',
          'C 214,26 220,38 226,50',
          'C 240,50 258,50 268,50',
          'C 278,50 286,54 288,62',
          'C 290,70 288,76 282,76',
          'L 18,76 Z',
        ].join(' ')}
        fill="white"
      />

      {/* ── Bar-chart windows ── */}
      {/* W1 — rear, short (blue) */}
      <Rect x="102" y="40" width="32" height="8" rx="2" fill="#0070cc" />
      {/* W2 — mid, medium (blue) */}
      <Rect x="143" y="35" width="34" height="13" rx="2" fill="#0070cc" />
      {/* W3 — front, tall (cyan = growth highlight) */}
      <Rect x="186" y="30" width="32" height="18" rx="2" fill="#1eaedb" />

      {/* ── Light accents ── */}
      {/* Headlight (front right) */}
      <Rect x="282" y="58" width="6" height="10" rx="2" fill="#1eaedb" opacity="0.95" />
      {/* Taillight (rear left) */}
      <Rect x="12" y="58" width="6" height="10" rx="2" fill="#0070cc" opacity="0.9" />

      {/* ── Wheels ── */}
      {/* Rear */}
      <Circle cx="72" cy="88" r="20" fill={bgColor} />
      <Circle cx="72" cy="88" r="13" fill={rimColor} />
      <Circle cx="72" cy="88" r="5.5" fill="white" />
      {/* Front */}
      <Circle cx="228" cy="88" r="20" fill={bgColor} />
      <Circle cx="228" cy="88" r="13" fill={rimColor} />
      <Circle cx="228" cy="88" r="5.5" fill="white" />
    </Svg>
  );
}
