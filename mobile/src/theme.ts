export const appTheme = {
  colors: {
    // Brand
    playstationBlue: '#0070cc',
    playstationCyan: '#1eaedb',
    // Surfaces (dark-first)
    consoleBlack: '#000000',
    shadowBlack: '#121314',
    deepCharcoal: '#1f1f1f',
    // Light surfaces (cards on dark bg)
    paperWhite: '#ffffff',
    iceMist: '#f5f7fa',
    dividerTint: '#f3f3f3',
    // Text
    inverseWhite: '#ffffff',
    displayInk: '#000000',
    secondaryText: '#cccccc',
    bodyGray: '#6b6b6b',
    muteGray: '#cccccc',
    placeholderInk: 'rgba(255,255,255,0.4)',
    // Semantic
    darkLinkBlue: '#53b1ff',
    commerceOrange: '#d53b00',
    commerceOrangeActive: '#aa2f00',
    warningRed: '#c81b3a',
    // Overlays
    shadowWash80: 'rgba(0,0,0,0.8)',
    shadowWash16: 'rgba(0,0,0,0.16)',
    shadowWash08: 'rgba(0,0,0,0.08)',
    cardGlow: 'rgba(255,255,255,0.06)',
  },

  radii: {
    input: 3,
    media: 12,
    card: 16,
    cardLarge: 24,
    button: 999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    section: 48,
  },

  typography: {
    // Display sizes (weight 300 — PS signature)
    displayXL: { fontSize: 44, fontWeight: '300' as const, lineHeight: 52, letterSpacing: -0.1 },
    displayL: { fontSize: 34, fontWeight: '300' as const, lineHeight: 40, letterSpacing: 0.1 },
    displayM: { fontSize: 28, fontWeight: '300' as const, lineHeight: 34, letterSpacing: 0.1 },
    displayS: { fontSize: 22, fontWeight: '300' as const, lineHeight: 28, letterSpacing: 0.1 },
    // UI layer (weight 500–700)
    headingS: { fontSize: 18, fontWeight: '600' as const, lineHeight: 22 },
    button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.4 },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, letterSpacing: 0.1 },
    caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
    micro: { fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
  },

  // Elevation tiers adapted for dark surfaces
  elevation: {
    none: {},
    low: {
      shadowColor: '#000000',
      shadowOpacity: 0.4,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    mid: {
      shadowColor: '#000000',
      shadowOpacity: 0.6,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    high: {
      shadowColor: '#000000',
      shadowOpacity: 0.8,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
  },

  // Convenience aliases for dark-first layout
  surface: {
    screen: '#121314',      // full-screen background
    card: '#1f1f1f',        // raised card on screen
    hero: '#000000',        // hero/header panel
    input: '#2a2a2a',       // input field background
    border: '#333333',      // subtle dividers
    borderActive: '#0070cc', // focused/active border
  },
};
