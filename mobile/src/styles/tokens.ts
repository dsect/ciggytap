/**
 * Design tokens and theme constants
 * Centralized colors, typography, spacing, and shadows for consistent UI
 */

export const Colors = {
  // Primary brand colors (teal/green - calming, wellness-focused)
  primary: {
    50: '#F0FFFE',
    100: '#D4F5F2',
    200: '#A8EBE5',
    300: '#7CE0D7',
    400: '#50D6CA',
    500: '#1E9B8A', // Primary brand color
    600: '#168B7B',
    700: '#0F7A6C',
    800: '#08695D',
    900: '#01584E',
  },

  // Secondary colors (slate/navy - trust, focus)
  secondary: {
    50: '#F7F9FC',
    100: '#EDF1F7',
    200: '#DDE7F0',
    300: '#CDD6E8',
    400: '#BCCCE1',
    500: '#4A5B7A', // Secondary brand color
    600: '#3D4B66',
    700: '#303B52',
    800: '#232B3E',
    900: '#171B2A',
  },

  // Accent colors (warm earth - action, completion)
  accent: {
    50: '#FFFAF7',
    100: '#FFF1E6',
    200: '#FFE8CF',
    300: '#FFDDB8',
    400: '#FFD4A1',
    500: '#C87A4A', // Warm accent (tap out)
    600: '#B06440',
    700: '#984E36',
    800: '#80382C',
    900: '#682222',
  },

  // Semantic colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Accessible text variants for semantic colors on light backgrounds (WCAG AA ≥ 4.5:1)
  errorText: '#B91C1C',   // 6.3:1 on surface
  warningText: '#92400E', // 6.9:1 on surface
  successText: '#15803D', // 4.9:1 on surface

  // Neutral palette
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Background colors
  background: '#F2F3EE', // Warm off-white
  surface: '#FDFCF7', // Light cream
  surfaceSecondary: '#F8F7F3', // Slightly darker surface

  // Borders and dividers
  border: '#E2DFD3',
  divider: '#ECE8DB',
};

export const Typography = {
  // Font families
  font: {
    regular: 'System', // Uses platform default (SF Pro on iOS, Roboto on Android)
  },

  // Heading styles
  heading: {
    xxl: {
      fontSize: 34,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    xl: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 34,
      letterSpacing: -0.3,
    },
    lg: {
      fontSize: 22,
      fontWeight: '700' as const,
      lineHeight: 28,
      letterSpacing: -0.2,
    },
    md: {
      fontSize: 18,
      fontWeight: '700' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    sm: {
      fontSize: 16,
      fontWeight: '700' as const,
      lineHeight: 20,
      letterSpacing: 0,
    },
  },

  // Body styles
  body: {
    lg: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    md: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
      letterSpacing: 0,
    },
    sm: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      letterSpacing: 0,
    },
    xs: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
      letterSpacing: 0,
    },
  },

  // Caption styles
  caption: {
    md: {
      fontSize: 13,
      fontWeight: '500' as const,
      lineHeight: 18,
      letterSpacing: 0.2,
    },
    sm: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
      letterSpacing: 0.3,
    },
  },

  // Label styles (for form labels, badges, etc.)
  label: {
    md: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 18,
      letterSpacing: 0,
    },
    sm: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
      letterSpacing: 0.3,
    },
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  // Subtle shadows for iOS-style aesthetics
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const Transitions = {
  fast: 150,
  base: 200,
  slow: 300,
};
