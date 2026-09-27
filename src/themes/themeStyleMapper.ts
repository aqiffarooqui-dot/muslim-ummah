import type { AppTheme } from './themeTypes';

type StyleObject = Record<string, unknown>;

function replaceColor(
  value: unknown,
  colors: Record<string, string>
): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return colors[value] ?? value;
}

export function mapThemeColors(
  style: StyleObject,
  theme: AppTheme
): StyleObject {
  const colors: Record<string, string> = {
    // Backgrounds
    '#07100D': theme.background,
    '#080A0F': theme.background,
    '#0D1016': theme.backgroundSecondary,
    '#111B17': theme.surface,
    '#111A16': theme.surface,
    '#101B16': theme.surface,
    '#101A16': theme.surface,
    '#0E1814': theme.surface,
    '#0D1713': theme.surface,

    // Cards
    '#13251E': theme.card,
    '#111C17': theme.card,
    '#101A16': theme.card,
    '#0E1814': theme.card,

    // Elevated surfaces
    '#1D3027': theme.surfaceElevated,
    '#1A2C24': theme.surfaceElevated,
    '#192820': theme.surfaceElevated,
    '#1B2C24': theme.surfaceElevated,
    '#263A31': theme.surfaceElevated,

    // Borders
    '#27352F': theme.border,
    '#29372F': theme.border,
    '#294239': theme.border,
    '#26352E': theme.border,
    '#202D27': theme.border,
    '#24322C': theme.border,
    '#202E27': theme.border,
    '#29362F': theme.border,

    // Main text
    '#F0F0E7': theme.text,
    '#F3F1E7': theme.text,
    '#EDEDE5': theme.text,
    '#E9EAE3': theme.text,
    '#E2E5DE': theme.text,
    '#E4E7E0': theme.text,

    // Secondary text
    '#E8E7D8': theme.textSecondary,
    '#D8DDD9': theme.textSecondary,
    '#AAB4AD': theme.textSecondary,
    '#B5BDB7': theme.textSecondary,
    '#AEB8B1': theme.textSecondary,

    // Muted text
    '#89938D': theme.textMuted,
    '#8C938D': theme.textMuted,
    '#737D77': theme.textMuted,
    '#78847D': theme.textMuted,
    '#69756E': theme.textMuted,
    '#6E7972': theme.textMuted,
    '#7D8982': theme.textMuted,
    '#6F7973': theme.textMuted,
    '#66726B': theme.textMuted,
    '#68736C': theme.textMuted,
    '#59645E': theme.textMuted,
    '#718078': theme.textMuted,
    '#7F8A83': theme.textMuted,
    '#707B74': theme.textMuted,
    '#6F7771': theme.tabInactive,

    // Accent
    '#D9C77A': theme.accent,
    '#D8B36A': theme.accent,
    '#D9C77A': theme.accent,
    '#D9C77A': theme.accent,

    // Accent dark text
    '#101512': theme.background,

    // Hero glow / decorative
    '#1D4937': theme.gradientStart,
    '#816D28': theme.glow,

    // Quran
    '#B9C1BA': theme.textSecondary,
  };

  const result: StyleObject = {};

  for (const [key, value] of Object.entries(style)) {
    if (
      key === 'backgroundColor' ||
      key === 'borderColor' ||
      key === 'color'
    ) {
      result[key] = replaceColor(
        value,
        colors
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}
