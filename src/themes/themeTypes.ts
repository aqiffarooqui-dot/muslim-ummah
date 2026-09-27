export type ThemeId =
  | 'midnight'
  | 'amoled'
  | 'emerald'
  | 'desert'
  | 'royal'
  | 'nightSky'
  | 'ivory'
  | 'minimal';

export type AppTheme = {
  id: ThemeId;
  name: string;
  background: string;
  surface: string;
  border: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
};

export const APP_THEMES: AppTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    background: '#080A0F',
    surface: '#151922',
    border: '#252A36',
    primaryText: '#FFFFFF',
    secondaryText: '#9B9FAC',
    accent: '#D8B36A',
  },
  {
    id: 'amoled',
    name: 'AMOLED',
    background: '#000000',
    surface: '#0B0B0B',
    border: '#1E1E1E',
    primaryText: '#FFFFFF',
    secondaryText: '#A0A0A0',
    accent: '#E0B968',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    background: '#07100D',
    surface: '#111C17',
    border: '#26352E',
    primaryText: '#F0F0E7',
    secondaryText: '#8B978F',
    accent: '#D9C77A',
  },
  {
    id: 'desert',
    name: 'Desert',
    background: '#17120D',
    surface: '#241B12',
    border: '#3B2C1C',
    primaryText: '#FFF5E5',
    secondaryText: '#BCA98F',
    accent: '#D9B56F',
  },
  {
    id: 'royal',
    name: 'Royal',
    background: '#100C18',
    surface: '#1B1427',
    border: '#332746',
    primaryText: '#F6F1FF',
    secondaryText: '#A79BB8',
    accent: '#D8B36A',
  },
  {
    id: 'nightSky',
    name: 'Night Sky',
    background: '#07101C',
    surface: '#101C2D',
    border: '#22334B',
    primaryText: '#F1F6FF',
    secondaryText: '#91A0B4',
    accent: '#D8C27B',
  },
  {
    id: 'ivory',
    name: 'Ivory',
    background: '#F4F0E7',
    surface: '#FFFDF7',
    border: '#DDD6C7',
    primaryText: '#191714',
    secondaryText: '#6D675D',
    accent: '#9A742E',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    background: '#111111',
    surface: '#191919',
    border: '#2A2A2A',
    primaryText: '#F5F5F5',
    secondaryText: '#999999',
    accent: '#C7A35D',
  },
];
