import { Platform, type StyleProp, type TextStyle } from 'react-native';
import type { ThemeFontFamily, ThemeTokens, ThemeTypographyVariants } from './tokens';

export type TypographyWeight =
  | 'normal'
  | 'regular'
  | 'medium'
  | 'semiBold'
  | 'bold'
  | 'heavy'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';

export interface ResolveTypographyOptions {
  weight?: TypographyWeight;
  mono?: boolean;
  fontFamilyOverride?: string;
  style?: StyleProp<TextStyle>;
}

export interface ResolvedTypography {
  fontFamily?: string;
  fontWeight?: TextStyle['fontWeight'];
}

export function isTypographyVariants(
  val: ThemeFontFamily | undefined,
): val is ThemeTypographyVariants {
  return typeof val === 'object' && val !== null && 'regular' in val;
}

function flattenTextStyle(style: StyleProp<TextStyle>): TextStyle | undefined {
  if (!style) return undefined;
  if (Array.isArray(style)) {
    const merged: TextStyle = {};
    for (const item of style) {
      const flat = flattenTextStyle(item as StyleProp<TextStyle>);
      if (flat) Object.assign(merged, flat);
    }
    return merged;
  }
  if (typeof style === 'object') {
    return style as TextStyle;
  }
  return undefined;
}

function normalizeStyleFontWeight(
  rawWeight: TextStyle['fontWeight'] | number | undefined,
): TypographyWeight | undefined {
  if (rawWeight === undefined || rawWeight === null) return undefined;
  const str = String(rawWeight).trim();
  switch (str) {
    case 'normal':
    case 'regular':
    case 'medium':
    case 'semiBold':
    case 'bold':
    case 'heavy':
    case '100':
    case '200':
    case '300':
    case '400':
    case '500':
    case '600':
    case '700':
    case '800':
    case '900':
      return str;
    case 'semibold':
    case 'demibold':
      return 'semiBold';
    case 'extrabold':
    case 'ultrabold':
    case 'black':
      return 'heavy';
    case 'light':
    case 'thin':
    case 'ultralight':
      return 'regular';
    default:
      return undefined;
  }
}

/**
 * Pure typography resolver that bridges theme font tokens, weights, and cross-platform
 * React Native font asset resolution.
 *
 * In Android, React Native fails font-matching and drops back to default system sans-serif (Roboto)
 * whenever a non-normal `fontWeight` is specified alongside a custom `fontFamily` that does not
 * have an associated native Typeface bold variant.
 *
 * When structured variants are provided (`{ regular, bold, ... }`), this resolver selects the exact
 * font asset family and sets `fontWeight: "normal"`. When a single custom font family string is provided,
 * it safely sanitizes the `fontWeight` to "normal" on Android, preventing the silent Roboto fallback.
 */
export function resolveTypography(
  themeOrFont: ThemeTokens | ThemeFontFamily | undefined,
  options: ResolveTypographyOptions | TypographyWeight = {},
): ResolvedTypography {
  const opts: ResolveTypographyOptions =
    typeof options === 'string' ? { weight: options } : options;
  const flatStyle = flattenTextStyle(opts.style);
  const styleWeight = normalizeStyleFontWeight(flatStyle?.fontWeight);
  const styleFontFamily =
    typeof flatStyle?.fontFamily === 'string' && flatStyle.fontFamily.trim().length > 0
      ? flatStyle.fontFamily
      : undefined;

  const weight = styleWeight ?? opts.weight ?? 'normal';
  const { mono = false, fontFamilyOverride } = opts;

  const activeFontFamily =
    fontFamilyOverride ??
    styleFontFamily ??
    (typeof themeOrFont === 'object' && themeOrFont !== null && 'fontFamily' in themeOrFont
      ? (themeOrFont as ThemeTokens).fontFamily
      : (themeOrFont as ThemeFontFamily | undefined));

  // 1. Mono requested (e.g. for CountUpText, TickerText, code snippets)
  if (mono) {
    if (isTypographyVariants(activeFontFamily) && activeFontFamily.mono) {
      return {
        fontFamily: activeFontFamily.mono,
        fontWeight: 'normal',
      };
    }
    return {
      fontFamily: typeof activeFontFamily === 'string' ? activeFontFamily : 'monospace',
      fontWeight: 'normal',
    };
  }

  // 2. Structured typography variant mapping
  if (isTypographyVariants(activeFontFamily)) {
    let resolvedFamily = activeFontFamily.regular;

    switch (weight) {
      case 'heavy':
      case '800':
      case '900':
        resolvedFamily =
          activeFontFamily.heavy ?? activeFontFamily.bold ?? activeFontFamily.regular;
        break;
      case 'bold':
      case '700':
        resolvedFamily =
          activeFontFamily.bold ?? activeFontFamily.semiBold ?? activeFontFamily.regular;
        break;
      case 'semiBold':
      case '600':
        resolvedFamily =
          activeFontFamily.semiBold ?? activeFontFamily.bold ?? activeFontFamily.regular;
        break;
      case 'medium':
      case '500':
        resolvedFamily = activeFontFamily.medium ?? activeFontFamily.regular;
        break;
      case 'regular':
      case 'normal':
      case '400':
      case '100':
      case '200':
      case '300':
      default:
        resolvedFamily = activeFontFamily.regular;
        break;
    }

    return {
      fontFamily: resolvedFamily,
      fontWeight: 'normal',
    };
  }

  // Normalize weight to standard TextStyle["fontWeight"]
  const normalizedWeight: TextStyle['fontWeight'] =
    weight === 'regular'
      ? 'normal'
      : weight === 'semiBold'
        ? '600'
        : weight === 'heavy'
          ? '800'
          : weight;

  // 3. Custom font family as a flat string (e.g. "Inter", "Kranky")
  if (typeof activeFontFamily === 'string' && activeFontFamily.trim().length > 0) {
    if (Platform.OS === 'android') {
      return {
        fontFamily: activeFontFamily,
        fontWeight: 'normal',
      };
    }

    return {
      fontFamily: activeFontFamily,
      fontWeight: normalizedWeight,
    };
  }

  // 4. Default system font (undefined or empty)
  return {
    fontFamily: undefined,
    fontWeight: normalizedWeight,
  };
}
