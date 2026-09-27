export type AppThemeId =
  | 'midnight'
  | 'amoled'
  | 'emerald'
  | 'royal'
  | 'sandstone'
  | 'sapphire';

export type AppTheme = {
  id: AppThemeId;
  name: string;
  description: string;

  // Visual language applied across the app.
  style: 'ios-glass' | 'minimal' | 'islamic' | 'royal-glass' | 'material' | 'sapphire';
  radius: {
    sm: number;
    md: number;
    lg: number;
    pill: number;
  };
  glass: boolean;
  shadowOpacity: number;

  background: string;
  backgroundSecondary: string;

  surface: string;
  surfaceElevated: string;
  card: string;
  cardPressed: string;

  border: string;
  borderStrong: string;

  text: string;
  textSecondary: string;
  textMuted: string;

  accent: string;
  accentStrong: string;
  accentSoft: string;

  success: string;
  danger: string;
  warning: string;

  tabBackground: string;
  tabActive: string;
  tabInactive: string;

  inputBackground: string;
  inputBorder: string;

  overlay: string;

  quranArabic: string;
  quranTranslation: string;

  gradientStart: string;
  gradientEnd: string;

  glow: string;
};

export type ThemePreset = AppTheme;
