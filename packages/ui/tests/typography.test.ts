import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => {
  const Platform = {
    OS: 'ios' as 'ios' | 'android' | 'windows' | 'macos' | 'web',
    select: <T>(dict: Record<string, T | undefined>): T | undefined =>
      dict[Platform.OS] ?? dict.default,
  };
  return { Platform };
});

import { Platform } from 'react-native';
import {
  isTypographyVariants,
  resolveTypography,
  type TypographyWeight,
} from '../src/theme/typography';
import {
  defaultLightTheme,
  type ThemeTokens,
  type ThemeTypographyVariants,
} from '../src/theme/tokens';

describe('typography resolver', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
  });

  describe('isTypographyVariants type guard', () => {
    it('returns true for an object with a regular variant property', () => {
      const variants: ThemeTypographyVariants = {
        regular: 'Inter_400Regular',
      };
      expect(isTypographyVariants(variants)).toBe(true);
    });

    it('returns true for a complete ThemeTypographyVariants definition', () => {
      const variants: ThemeTypographyVariants = {
        regular: 'Inter_400Regular',
        medium: 'Inter_500Medium',
        semiBold: 'Inter_600SemiBold',
        bold: 'Inter_700Bold',
        heavy: 'Inter_900Black',
        mono: 'SpaceMono_400Regular',
      };
      expect(isTypographyVariants(variants)).toBe(true);
    });

    it('returns false for plain string font family names', () => {
      expect(isTypographyVariants('Inter')).toBe(false);
      expect(isTypographyVariants('SpaceMono_400Regular')).toBe(false);
    });

    it('returns false for undefined and null', () => {
      expect(isTypographyVariants(undefined)).toBe(false);
      expect(isTypographyVariants(null as unknown as undefined)).toBe(false);
    });

    it('returns false for objects lacking the regular property', () => {
      expect(isTypographyVariants({} as unknown as ThemeTypographyVariants)).toBe(false);
      expect(
        isTypographyVariants({
          bold: 'Inter_700Bold',
        } as unknown as ThemeTypographyVariants),
      ).toBe(false);
    });
  });

  describe('default system font (undefined or empty fontFamily)', () => {
    it('resolves to undefined fontFamily and normal fontWeight when no parameters are passed', () => {
      const result = resolveTypography(undefined);
      expect(result).toEqual({
        fontFamily: undefined,
        fontWeight: 'normal',
      });
    });

    it('resolves defaultLightTheme (fontFamily: undefined) to undefined fontFamily with default normal weight', () => {
      const result = resolveTypography(defaultLightTheme);
      expect(result).toEqual({
        fontFamily: undefined,
        fontWeight: 'normal',
      });
    });

    it('treats empty string and whitespace-only strings as default system font', () => {
      expect(resolveTypography('')).toEqual({
        fontFamily: undefined,
        fontWeight: 'normal',
      });
      expect(resolveTypography('   ')).toEqual({
        fontFamily: undefined,
        fontWeight: 'normal',
      });
      expect(resolveTypography({ ...defaultLightTheme, fontFamily: '' })).toEqual({
        fontFamily: undefined,
        fontWeight: 'normal',
      });
      expect(resolveTypography({ ...defaultLightTheme, fontFamily: '   ' })).toEqual({
        fontFamily: undefined,
        fontWeight: 'normal',
      });
    });

    it('normalizes named semantic weights correctly for system font', () => {
      expect(resolveTypography(undefined, 'normal')).toEqual({
        fontFamily: undefined,
        fontWeight: 'normal',
      });
      expect(resolveTypography(undefined, 'regular')).toEqual({
        fontFamily: undefined,
        fontWeight: 'normal',
      });
      expect(resolveTypography(undefined, 'medium')).toEqual({
        fontFamily: undefined,
        fontWeight: 'medium',
      });
      expect(resolveTypography(undefined, 'semiBold')).toEqual({
        fontFamily: undefined,
        fontWeight: '600',
      });
      expect(resolveTypography(undefined, 'bold')).toEqual({
        fontFamily: undefined,
        fontWeight: 'bold',
      });
      expect(resolveTypography(undefined, 'heavy')).toEqual({
        fontFamily: undefined,
        fontWeight: '800',
      });
    });

    it('preserves numeric string weights for system font', () => {
      const numericWeights: TypographyWeight[] = [
        '100',
        '200',
        '300',
        '400',
        '500',
        '600',
        '700',
        '800',
        '900',
      ];

      for (const weight of numericWeights) {
        expect(resolveTypography(undefined, weight)).toEqual({
          fontFamily: undefined,
          fontWeight: weight,
        });
        expect(resolveTypography(undefined, { weight })).toEqual({
          fontFamily: undefined,
          fontWeight: weight,
        });
      }
    });

    it('preserves specified fontWeight on Android when using system font (no fallback bug occurs)', () => {
      Platform.OS = 'android';

      expect(resolveTypography(undefined, 'bold')).toEqual({
        fontFamily: undefined,
        fontWeight: 'bold',
      });
      expect(resolveTypography(undefined, '700')).toEqual({
        fontFamily: undefined,
        fontWeight: '700',
      });
      expect(resolveTypography(undefined, 'heavy')).toEqual({
        fontFamily: undefined,
        fontWeight: '800',
      });
      expect(resolveTypography(defaultLightTheme, 'semiBold')).toEqual({
        fontFamily: undefined,
        fontWeight: '600',
      });
    });
  });

  describe('flat font family string (e.g. "Inter", "Kranky")', () => {
    const flatFont = 'Inter';
    const themeWithFlatFont: ThemeTokens = {
      ...defaultLightTheme,
      fontFamily: flatFont,
    };

    describe('on Android platform', () => {
      beforeEach(() => {
        Platform.OS = 'android';
      });

      it('sanitizes fontWeight to "normal" for bold and heavy weights to prevent silent Roboto fallback', () => {
        expect(resolveTypography(flatFont, 'bold')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'normal',
        });
        expect(resolveTypography(flatFont, 'heavy')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'normal',
        });
        expect(resolveTypography(flatFont, '700')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'normal',
        });
        expect(resolveTypography(flatFont, '800')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'normal',
        });
        expect(resolveTypography(flatFont, '900')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'normal',
        });
      });

      it('sanitizes fontWeight to "normal" for semiBold and medium weights', () => {
        expect(resolveTypography(flatFont, 'semiBold')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'normal',
        });
        expect(resolveTypography(flatFont, '600')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'normal',
        });
        expect(resolveTypography(flatFont, 'medium')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'normal',
        });
        expect(resolveTypography(flatFont, '500')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'normal',
        });
      });

      it('sanitizes fontWeight to "normal" when wrapped in ThemeTokens', () => {
        expect(resolveTypography(themeWithFlatFont, 'bold')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'normal',
        });
        expect(resolveTypography(themeWithFlatFont, { weight: 'bold' })).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'normal',
        });
      });
    });

    describe('on iOS platform', () => {
      beforeEach(() => {
        Platform.OS = 'ios';
      });

      it('preserves normalized fontWeight alongside the fontFamily', () => {
        expect(resolveTypography(flatFont, 'bold')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'bold',
        });
        expect(resolveTypography(flatFont, '700')).toEqual({
          fontFamily: 'Inter',
          fontWeight: '700',
        });
        expect(resolveTypography(flatFont, 'semiBold')).toEqual({
          fontFamily: 'Inter',
          fontWeight: '600',
        });
        expect(resolveTypography(flatFont, 'heavy')).toEqual({
          fontFamily: 'Inter',
          fontWeight: '800',
        });
        expect(resolveTypography(flatFont, 'regular')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'normal',
        });
        expect(resolveTypography(flatFont, 'normal')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'normal',
        });
        expect(resolveTypography(flatFont, 'medium')).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'medium',
        });
        expect(resolveTypography(flatFont, '500')).toEqual({
          fontFamily: 'Inter',
          fontWeight: '500',
        });
      });

      it('works with ThemeTokens object and options object syntax', () => {
        expect(resolveTypography(themeWithFlatFont, { weight: 'bold' })).toEqual({
          fontFamily: 'Inter',
          fontWeight: 'bold',
        });
        expect(resolveTypography(themeWithFlatFont, 'semiBold')).toEqual({
          fontFamily: 'Inter',
          fontWeight: '600',
        });
      });
    });

    describe('fontFamilyOverride option', () => {
      it('overrides theme fontFamily with specified override on iOS', () => {
        Platform.OS = 'ios';
        const result = resolveTypography(themeWithFlatFont, {
          fontFamilyOverride: 'Kranky',
          weight: 'bold',
        });
        expect(result).toEqual({
          fontFamily: 'Kranky',
          fontWeight: 'bold',
        });
      });

      it('overrides theme fontFamily and sanitizes weight to normal on Android', () => {
        Platform.OS = 'android';
        const result = resolveTypography(themeWithFlatFont, {
          fontFamilyOverride: 'Kranky',
          weight: 'bold',
        });
        expect(result).toEqual({
          fontFamily: 'Kranky',
          fontWeight: 'normal',
        });
      });
    });
  });

  describe('structured typography variants (ThemeTypographyVariants)', () => {
    const fullVariants: ThemeTypographyVariants = {
      regular: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semiBold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
      heavy: 'Inter_900Black',
      mono: 'SpaceMono_400Regular',
    };

    const themeWithVariants: ThemeTokens = {
      ...defaultLightTheme,
      fontFamily: fullVariants,
    };

    it('maps bold and 700 to the bold variant with fontWeight normal', () => {
      expect(resolveTypography(fullVariants, 'bold')).toEqual({
        fontFamily: 'Inter_700Bold',
        fontWeight: 'normal',
      });
      expect(resolveTypography(fullVariants, '700')).toEqual({
        fontFamily: 'Inter_700Bold',
        fontWeight: 'normal',
      });
      expect(resolveTypography(themeWithVariants, { weight: 'bold' })).toEqual({
        fontFamily: 'Inter_700Bold',
        fontWeight: 'normal',
      });
    });

    it('maps heavy, 800, and 900 to the heavy variant with fontWeight normal', () => {
      expect(resolveTypography(fullVariants, 'heavy')).toEqual({
        fontFamily: 'Inter_900Black',
        fontWeight: 'normal',
      });
      expect(resolveTypography(fullVariants, '800')).toEqual({
        fontFamily: 'Inter_900Black',
        fontWeight: 'normal',
      });
      expect(resolveTypography(fullVariants, '900')).toEqual({
        fontFamily: 'Inter_900Black',
        fontWeight: 'normal',
      });
      expect(resolveTypography(themeWithVariants, { weight: 'heavy' })).toEqual({
        fontFamily: 'Inter_900Black',
        fontWeight: 'normal',
      });
    });

    it('maps semiBold and 600 to the semiBold variant with fontWeight normal', () => {
      expect(resolveTypography(fullVariants, 'semiBold')).toEqual({
        fontFamily: 'Inter_600SemiBold',
        fontWeight: 'normal',
      });
      expect(resolveTypography(fullVariants, '600')).toEqual({
        fontFamily: 'Inter_600SemiBold',
        fontWeight: 'normal',
      });
      expect(resolveTypography(themeWithVariants, { weight: 'semiBold' })).toEqual({
        fontFamily: 'Inter_600SemiBold',
        fontWeight: 'normal',
      });
    });

    it('maps medium and 500 to the medium variant with fontWeight normal', () => {
      expect(resolveTypography(fullVariants, 'medium')).toEqual({
        fontFamily: 'Inter_500Medium',
        fontWeight: 'normal',
      });
      expect(resolveTypography(fullVariants, '500')).toEqual({
        fontFamily: 'Inter_500Medium',
        fontWeight: 'normal',
      });
      expect(resolveTypography(themeWithVariants, { weight: 'medium' })).toEqual({
        fontFamily: 'Inter_500Medium',
        fontWeight: 'normal',
      });
    });

    it('maps regular, normal, 400, and light weights (100, 200, 300) to the regular variant', () => {
      const regularWeights: TypographyWeight[] = [
        'regular',
        'normal',
        '400',
        '100',
        '200',
        '300',
      ];

      for (const weight of regularWeights) {
        expect(resolveTypography(fullVariants, weight)).toEqual({
          fontFamily: 'Inter_400Regular',
          fontWeight: 'normal',
        });
      }

      // Default when no options specified
      expect(resolveTypography(fullVariants)).toEqual({
        fontFamily: 'Inter_400Regular',
        fontWeight: 'normal',
      });
    });

    it('ensures fontWeight is always normal on both iOS and Android for structured variants', () => {
      Platform.OS = 'android';
      expect(resolveTypography(fullVariants, 'bold')).toEqual({
        fontFamily: 'Inter_700Bold',
        fontWeight: 'normal',
      });

      Platform.OS = 'ios';
      expect(resolveTypography(fullVariants, 'bold')).toEqual({
        fontFamily: 'Inter_700Bold',
        fontWeight: 'normal',
      });
    });

    describe('fallback cascades when variants are omitted', () => {
      it('falls back heavy -> bold when heavy is omitted', () => {
        const variantsWithoutHeavy: ThemeTypographyVariants = {
          regular: 'Font_Regular',
          semiBold: 'Font_SemiBold',
          bold: 'Font_Bold',
        };
        expect(resolveTypography(variantsWithoutHeavy, 'heavy')).toEqual({
          fontFamily: 'Font_Bold',
          fontWeight: 'normal',
        });
        expect(resolveTypography(variantsWithoutHeavy, '800')).toEqual({
          fontFamily: 'Font_Bold',
          fontWeight: 'normal',
        });
        expect(resolveTypography(variantsWithoutHeavy, '900')).toEqual({
          fontFamily: 'Font_Bold',
          fontWeight: 'normal',
        });
      });

      it('falls back heavy -> regular when both heavy and bold are omitted', () => {
        const variantsMinimal: ThemeTypographyVariants = {
          regular: 'Font_Regular',
          semiBold: 'Font_SemiBold',
        };
        expect(resolveTypography(variantsMinimal, 'heavy')).toEqual({
          fontFamily: 'Font_Regular',
          fontWeight: 'normal',
        });
      });

      it('falls back bold -> semiBold when bold is omitted', () => {
        const variantsWithoutBold: ThemeTypographyVariants = {
          regular: 'Font_Regular',
          semiBold: 'Font_SemiBold',
        };
        expect(resolveTypography(variantsWithoutBold, 'bold')).toEqual({
          fontFamily: 'Font_SemiBold',
          fontWeight: 'normal',
        });
        expect(resolveTypography(variantsWithoutBold, '700')).toEqual({
          fontFamily: 'Font_SemiBold',
          fontWeight: 'normal',
        });
      });

      it('falls back bold -> regular when both bold and semiBold are omitted', () => {
        const variantsRegularOnly: ThemeTypographyVariants = {
          regular: 'Font_Regular',
        };
        expect(resolveTypography(variantsRegularOnly, 'bold')).toEqual({
          fontFamily: 'Font_Regular',
          fontWeight: 'normal',
        });
      });

      it('falls back semiBold -> bold when semiBold is omitted', () => {
        const variantsWithoutSemiBold: ThemeTypographyVariants = {
          regular: 'Font_Regular',
          bold: 'Font_Bold',
        };
        expect(resolveTypography(variantsWithoutSemiBold, 'semiBold')).toEqual({
          fontFamily: 'Font_Bold',
          fontWeight: 'normal',
        });
        expect(resolveTypography(variantsWithoutSemiBold, '600')).toEqual({
          fontFamily: 'Font_Bold',
          fontWeight: 'normal',
        });
      });

      it('falls back semiBold -> regular when both semiBold and bold are omitted', () => {
        const variantsRegularOnly: ThemeTypographyVariants = {
          regular: 'Font_Regular',
        };
        expect(resolveTypography(variantsRegularOnly, 'semiBold')).toEqual({
          fontFamily: 'Font_Regular',
          fontWeight: 'normal',
        });
      });

      it('falls back medium -> regular when medium is omitted', () => {
        const variantsWithoutMedium: ThemeTypographyVariants = {
          regular: 'Font_Regular',
          bold: 'Font_Bold',
        };
        expect(resolveTypography(variantsWithoutMedium, 'medium')).toEqual({
          fontFamily: 'Font_Regular',
          fontWeight: 'normal',
        });
        expect(resolveTypography(variantsWithoutMedium, '500')).toEqual({
          fontFamily: 'Font_Regular',
          fontWeight: 'normal',
        });
      });
    });
  });

  describe('monospace resolution (mono: true)', () => {
    it('selects the mono variant when defined in ThemeTypographyVariants', () => {
      const variantsWithMono: ThemeTypographyVariants = {
        regular: 'Inter_400Regular',
        bold: 'Inter_700Bold',
        mono: 'SpaceMono_400Regular',
      };
      const result = resolveTypography(variantsWithMono, { mono: true });
      expect(result).toEqual({
        fontFamily: 'SpaceMono_400Regular',
        fontWeight: 'normal',
      });
    });

    it('falls back to "monospace" when variants omit mono', () => {
      const variantsWithoutMono: ThemeTypographyVariants = {
        regular: 'Inter_400Regular',
        bold: 'Inter_700Bold',
      };
      const result = resolveTypography(variantsWithoutMono, { mono: true });
      expect(result).toEqual({
        fontFamily: 'monospace',
        fontWeight: 'normal',
      });
    });

    it('falls back to active flat font string when mono: true is requested', () => {
      expect(resolveTypography('Inter', { mono: true })).toEqual({
        fontFamily: 'Inter',
        fontWeight: 'normal',
      });
      expect(resolveTypography('Courier', { mono: true })).toEqual({
        fontFamily: 'Courier',
        fontWeight: 'normal',
      });
    });

    it('falls back to "monospace" when fontFamily is undefined', () => {
      expect(resolveTypography(undefined, { mono: true })).toEqual({
        fontFamily: 'monospace',
        fontWeight: 'normal',
      });
      expect(resolveTypography(defaultLightTheme, { mono: true })).toEqual({
        fontFamily: 'monospace',
        fontWeight: 'normal',
      });
    });

    it('honors fontFamilyOverride when mono: true is specified', () => {
      const result = resolveTypography(defaultLightTheme, {
        mono: true,
        fontFamilyOverride: 'FiraCode_400Regular',
      });
      expect(result).toEqual({
        fontFamily: 'FiraCode_400Regular',
        fontWeight: 'normal',
      });
    });

    it('enforces fontWeight "normal" on mono resolution regardless of requested weight or platform', () => {
      Platform.OS = 'android';
      expect(
        resolveTypography('Inter', { mono: true, weight: 'bold' }),
      ).toEqual({
        fontFamily: 'Inter',
        fontWeight: 'normal',
      });

      Platform.OS = 'ios';
      expect(
        resolveTypography('Inter', { mono: true, weight: 'bold' }),
      ).toEqual({
        fontFamily: 'Inter',
        fontWeight: 'normal',
      });
    });
  });

  describe('style inspection and fontWeight defense in resolveTypography', () => {
    const fullVariants: ThemeTypographyVariants = {
      regular: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semiBold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
      heavy: 'Inter_900Black',
      mono: 'SpaceMono_400Regular',
    };

    it('extracts fontWeight from inline style object and maps to variant', () => {
      const result = resolveTypography(fullVariants, {
        style: { fontSize: 16, fontWeight: '700' },
      });
      expect(result).toEqual({
        fontFamily: 'Inter_700Bold',
        fontWeight: 'normal',
      });
    });

    it('extracts fontWeight from nested style array and maps to variant', () => {
      const result = resolveTypography(fullVariants, {
        style: [{ fontSize: 14 }, [{ color: 'red' }, { fontWeight: 'bold' }]],
      });
      expect(result).toEqual({
        fontFamily: 'Inter_700Bold',
        fontWeight: 'normal',
      });
    });

    it('sanitizes inline style fontWeight to normal on Android for flat custom fonts', () => {
      Platform.OS = 'android';
      const result = resolveTypography('Kranky', {
        style: { fontWeight: 'bold' },
      });
      expect(result).toEqual({
        fontFamily: 'Kranky',
        fontWeight: 'normal',
      });
    });

    it('preserves system font bold when style specifies fontWeight and no fontFamily is configured', () => {
      Platform.OS = 'android';
      const result = resolveTypography(undefined, {
        style: { fontWeight: '700' },
      });
      expect(result).toEqual({
        fontFamily: undefined,
        fontWeight: '700',
      });
    });

    it('extracts fontFamily override from style when no explicit override is provided', () => {
      Platform.OS = 'android';
      const result = resolveTypography(undefined, {
        style: { fontFamily: 'Kranky', fontWeight: 'bold' },
      });
      expect(result).toEqual({
        fontFamily: 'Kranky',
        fontWeight: 'normal',
      });
    });
  });
});
