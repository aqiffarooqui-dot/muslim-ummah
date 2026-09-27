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


import { StyleSheet } from 'react-native';

export function createThemedStyles(theme: AppTheme, styles: Record<string, any>) {
  const map: Record<string, string> = {
    '#080A0F': theme.background, '#07100D': theme.background, '#000000': theme.background,
    '#151922': theme.card, '#10131A': theme.surface, '#11141B': theme.surface, '#101A16': theme.card,
    '#111B17': theme.surface, '#13251E': theme.card, '#12151C': theme.surface, '#121A16': theme.surface,
    '#211F18': theme.accentSoft, '#1D1B16': theme.accentSoft, '#16231C': theme.accentSoft,
    '#191A1F': theme.surfaceElevated, '#1B1D22': theme.surfaceElevated,
    '#252A35': theme.border, '#292E39': theme.border, '#29372F': theme.border, '#294239': theme.border,
    '#294034': theme.border, '#24322C': theme.border, '#202D27': theme.border, '#28362E': theme.border,
    '#302E27': theme.border, '#30343D': theme.border, '#403923': theme.borderStrong, '#44391F': theme.borderStrong,
    '#3A3528': theme.borderStrong, '#806B3D': theme.accent,
    '#D8B36A': theme.accent, '#D9C77A': theme.accent, '#E0BD72': theme.accent, '#E3C17B': theme.accent, '#D7C08A': theme.accent,
    '#FFFFFF': theme.text, '#fff': theme.text, '#F0F0E7': theme.text, '#F3F1E8': theme.text, '#F0EBDD': theme.text,
    '#EDEDE5': theme.text, '#EDEEF0': theme.text, '#E4E6E1': theme.textSecondary, '#D1D5D0': theme.textSecondary,
    '#C9CEC9': theme.textSecondary, '#C6CCC7': theme.textSecondary, '#DCE2DD': theme.textSecondary, '#C9CDD4': theme.textSecondary,
    '#7F8792': theme.textMuted, '#858B99': theme.textMuted, '#777D89': theme.textMuted, '#7F8A83': theme.textMuted,
    '#737E77': theme.textMuted, '#68716D': theme.textMuted, '#9BA39D': theme.textSecondary,
    '#9EE5B6': theme.success, '#82C99F': theme.success, '#E9A5AB': theme.danger, '#A3A8B2': theme.textSecondary,
  };
  const walk = (v: any, key = ''): any => {
    if (typeof v === 'string' && map[v]) return map[v];
    if (typeof v === 'number' && key.toLowerCase().includes('borderradius')) {
      return v <= 10 ? theme.radius.sm : v <= 17 ? theme.radius.md : theme.radius.lg;
    }
    if (Array.isArray(v)) return v.map((x) => walk(x, key));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
    return v;
  };
  const out: Record<string, any> = {};
  Object.entries(styles).forEach(([name, value]) => {
    out[name] = walk(value);
    if (theme.glass && /card|hero|surface|feature|benefit|plan|status|membership|info|subscription|next|live/i.test(name)) {
      out[name] = { ...out[name], shadowColor: theme.glow, shadowOpacity: theme.shadowOpacity, shadowRadius: 14, elevation: 4 };
    }
  });
  return StyleSheet.create(out);
}
