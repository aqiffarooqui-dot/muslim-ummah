import type { AppTheme } from './themeTypes';

export const THEME_PRESETS: AppTheme[] = [
  {
    id: 'midnight',
    style: 'ios-glass',
    radius: {"sm":10,"md":16,"lg":22,"pill":999},
    glass: true,
    shadowOpacity: 0.22,
    name: 'iOS Glass Gold',
    description:
      'iOS-inspired glass surfaces with cinematic gold accents.',

    background: '#080A0F',
    backgroundSecondary: '#0D1016',

    surface: '#11141B',
    surfaceElevated: '#181C25',
    card: '#151922',
    cardPressed: '#1C202A',

    border: '#292E39',
    borderStrong: '#3A404D',

    text: '#F5F5F2',
    textSecondary: '#C6C8CC',
    textMuted: '#777D89',

    accent: '#D8B36A',
    accentStrong: '#E8C982',
    accentSoft: '#211F18',

    success: '#7BC69A',
    danger: '#D97B7B',
    warning: '#D8B36A',

    tabBackground: '#0D1016',
    tabActive: '#D8B36A',
    tabInactive: '#777D89',

    inputBackground: '#11141B',
    inputBorder: '#292E39',

    overlay: '#000000B8',

    quranArabic: '#F2E5C8',
    quranTranslation: '#B8BBC2',

    gradientStart: '#171A22',
    gradientEnd: '#0A0C11',

    glow: '#D8B36A',
  },

  {
    id: 'amoled',
    style: 'minimal',
    radius: {"sm":6,"md":12,"lg":16,"pill":999},
    glass: false,
    shadowOpacity: 0.12,
    name: 'Pure Black Minimal',
    description:
      'Minimal OLED-first surfaces with crisp contrast.',

    background: '#000000',
    backgroundSecondary: '#030303',

    surface: '#070707',
    surfaceElevated: '#101010',
    card: '#0C0C0C',
    cardPressed: '#171717',

    border: '#202020',
    borderStrong: '#343434',

    text: '#FFFFFF',
    textSecondary: '#D0D0D0',
    textMuted: '#777777',

    accent: '#E0BD72',
    accentStrong: '#F0D28F',
    accentSoft: '#211D14',

    success: '#75C995',
    danger: '#D87575',
    warning: '#E0BD72',

    tabBackground: '#050505',
    tabActive: '#E0BD72',
    tabInactive: '#666666',

    inputBackground: '#080808',
    inputBorder: '#202020',

    overlay: '#000000D0',

    quranArabic: '#F5E7C8',
    quranTranslation: '#B7B7B7',

    gradientStart: '#111111',
    gradientEnd: '#000000',

    glow: '#E0BD72',
  },

  {
    id: 'emerald',
    style: 'islamic',
    radius: {"sm":8,"md":14,"lg":20,"pill":999},
    glass: false,
    shadowOpacity: 0.2,
    name: 'Islamic Emerald',
    description:
      'Traditional Islamic emerald palette with soft modern surfaces.',

    background: '#06100C',
    backgroundSecondary: '#091711',

    surface: '#0B1913',
    surfaceElevated: '#10231A',
    card: '#102019',
    cardPressed: '#183025',

    border: '#234536',
    borderStrong: '#35634D',

    text: '#F2FFF7',
    textSecondary: '#C0D6CA',
    textMuted: '#81978B',

    accent: '#C7D99A',
    accentStrong: '#E0EEB5',
    accentSoft: '#1C281A',

    success: '#83D5A3',
    danger: '#D87F7F',
    warning: '#D5C37A',

    tabBackground: '#08150F',
    tabActive: '#C7D99A',
    tabInactive: '#718579',

    inputBackground: '#0C1B14',
    inputBorder: '#234536',

    overlay: '#020806CC',

    quranArabic: '#E6F2D1',
    quranTranslation: '#B3C6BA',

    gradientStart: '#153125',
    gradientEnd: '#07110C',

    glow: '#C7D99A',
  },

  {
    id: 'royal',
    style: 'royal-glass',
    radius: {"sm":10,"md":17,"lg":24,"pill":999},
    glass: true,
    shadowOpacity: 0.25,
    name: 'Royal Glass',
    description:
      'Royal purple glass with a premium cinematic finish.',

    background: '#0B0813',
    backgroundSecondary: '#100C1A',

    surface: '#151020',
    surfaceElevated: '#1D162B',
    card: '#1B1528',
    cardPressed: '#271E37',

    border: '#382C4D',
    borderStrong: '#514166',

    text: '#FAF7FF',
    textSecondary: '#D0C8DB',
    textMuted: '#91869F',

    accent: '#D6B5F5',
    accentStrong: '#E6CEFF',
    accentSoft: '#241B30',

    success: '#83CBA0',
    danger: '#DA818F',
    warning: '#D9B873',

    tabBackground: '#100C18',
    tabActive: '#D6B5F5',
    tabInactive: '#84788F',

    inputBackground: '#151020',
    inputBorder: '#382C4D',

    overlay: '#07030CCC',

    quranArabic: '#EBDFFF',
    quranTranslation: '#B9AFC4',

    gradientStart: '#251A35',
    gradientEnd: '#0C0912',

    glow: '#D6B5F5',
  },

  {
    id: 'sandstone',
    style: 'material',
    radius: {"sm":6,"md":12,"lg":18,"pill":999},
    glass: false,
    shadowOpacity: 0.18,
    name: 'Heritage Material',
    description:
      'Warm heritage palette with Material-style surfaces.',

    background: '#12100C',
    backgroundSecondary: '#18140F',

    surface: '#1B1711',
    surfaceElevated: '#241E15',
    card: '#241E15',
    cardPressed: '#30281C',

    border: '#443827',
    borderStrong: '#5C4B34',

    text: '#FFF9EC',
    textSecondary: '#D8CDB8',
    textMuted: '#A69A83',

    accent: '#E3C17B',
    accentStrong: '#F1D79A',
    accentSoft: '#302617',

    success: '#8FC49A',
    danger: '#D58578',
    warning: '#E3C17B',

    tabBackground: '#16120D',
    tabActive: '#E3C17B',
    tabInactive: '#897D68',

    inputBackground: '#1B1711',
    inputBorder: '#443827',

    overlay: '#090704CC',

    quranArabic: '#F5E6C6',
    quranTranslation: '#C0B39C',

    gradientStart: '#30261A',
    gradientEnd: '#14100B',

    glow: '#E3C17B',
  },

  {
    id: 'sapphire',
    style: 'sapphire',
    radius: {"sm":8,"md":15,"lg":21,"pill":999},
    glass: true,
    shadowOpacity: 0.2,
    name: 'Sapphire Material',
    description:
      'Sapphire blue with structured Material-style contrast.',

    background: '#060B14',
    backgroundSecondary: '#0A101C',

    surface: '#0E1624',
    surfaceElevated: '#142033',
    card: '#121C2C',
    cardPressed: '#1A2940',

    border: '#263B58',
    borderStrong: '#385477',

    text: '#F3F7FF',
    textSecondary: '#C5D0DF',
    textMuted: '#7F8FA5',

    accent: '#D7C08A',
    accentStrong: '#EBD69F',
    accentSoft: '#252116',

    success: '#78C9A0',
    danger: '#D77E86',
    warning: '#D7C08A',

    tabBackground: '#09111D',
    tabActive: '#D7C08A',
    tabInactive: '#728298',

    inputBackground: '#0E1624',
    inputBorder: '#263B58',

    overlay: '#02060DCC',

    quranArabic: '#E8EDF6',
    quranTranslation: '#B4C0D0',

    gradientStart: '#192B45',
    gradientEnd: '#07101C',

    glow: '#D7C08A',
  },
];

export function getThemeById(
  id: string
): AppTheme {
  return (
    THEME_PRESETS.find(
      (theme) => theme.id === id
    ) ?? THEME_PRESETS[0]
  );
}
