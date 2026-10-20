import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Platform, type TextStyle } from 'react-native';
import {
  ThemeProvider,
  AppCard,
  AppButton,
  AppTitle,
  AppText,
  AppBadge,
  AppTextInput,
  resolveTypography,
  type ThemeFontFamily,
  TickerText,
  CountUpText,
  TypewriterText,
  WavyText,
  ScrambleText,
} from '@some-alambre/ui';
import { useLightDark } from '../../providers/theme';
import { TestCard } from '../../components/test-utils/TestCard';
import { ConfigSwitch } from '../../components/test-utils/ConfigSwitch';

type FontPreset = 'system' | 'flatMono' | 'variantsInter';

export default function TypographyTestbed() {
  const { theme, toggleTheme, currThemeName } = useLightDark();
  const isDark = currThemeName === 'dark';
  const [preset, setPreset] = useState<FontPreset>('system');
  const [customText, setCustomText] = useState('Alambre Typography 2026');

  // Build the active ThemeFontFamily according to the selected preset
  const activeFontFamily: ThemeFontFamily | undefined = useMemo(() => {
    switch (preset) {
      case 'flatMono':
        return 'SpaceMono';
      case 'variantsInter':
        return {
          regular: 'Inter',
          medium: 'Inter_500Medium',
          semiBold: 'Inter_600SemiBold',
          bold: 'Inter_700Bold',
          heavy: 'Inter_800ExtraBold',
          mono: 'SpaceMono',
        };
      case 'system':
      default:
        return undefined;
    }
  }, [preset]);

  // Nested theme with custom typography injected
  const resolvedTheme = useMemo(() => {
    return {
      ...theme,
      fontFamily: activeFontFamily,
    };
  }, [theme, activeFontFamily]);

  // Sample weights to inspect
  const weightSamples: Array<{ label: string; weight: TextStyle['fontWeight'] }> = [
    { label: 'Normal (400)', weight: 'normal' },
    { label: 'Medium (500)', weight: '500' },
    { label: 'SemiBold (600)', weight: '600' },
    { label: 'Bold (700)', weight: '700' },
    { label: 'ExtraBold (800)', weight: '800' },
    { label: 'Heavy (900)', weight: '900' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Intro & Root Cause Explanation */}
      <TestCard
        title="Typography & Android Defense"
        description="Comprehensive audit testbed for resolveTypography. On Android, pairing a custom fontFamily with heavy fontWeight causes the system font engine to drop the font silently and fall back to Roboto. This module proves variant mapping and sanitization."
      >
        <AppText variant="subtitle" style={{ fontWeight: '700' }}>Active Font Strategy</AppText>
        <View style={styles.presetButtonsRow}>
          <AppButton
            variant={preset === 'system' ? 'solid' : 'outline'}
            tone="primary"
            size="sm"
            label="System Default"
            onPress={() => setPreset('system')}
          />
          <AppButton
            variant={preset === 'flatMono' ? 'solid' : 'outline'}
            tone="secondary"
            size="sm"
            label="Flat Mono (Auto-Sanitized)"
            onPress={() => setPreset('flatMono')}
          />
          <AppButton
            variant={preset === 'variantsInter' ? 'solid' : 'outline'}
            tone="primary"
            size="sm"
            label="Variants Object (Inter)"
            onPress={() => setPreset('variantsInter')}
          />
        </View>

        <ConfigSwitch
          label={`Dark Mode (${isDark ? 'Dark' : 'Light'})`}
          value={isDark}
          onChange={() => toggleTheme()}
        />

        <AppTextInput
          label="Interactive Preview Text"
          value={customText}
          onChangeText={setCustomText}
          placeholder="Type custom text..."
        />
      </TestCard>

      {/* Scoped Theme Provider wrapping the live components */}
      <ThemeProvider theme={resolvedTheme}>
        {/* Section 1: Resolved Weight Inspector */}
        <AppCard variant="outlined" style={styles.card}>
          <AppTitle level={3}>Font Weight Resolution Table</AppTitle>
          <AppText variant="muted">
            Running on: <AppText variant="body" style={{ fontWeight: '700' }}>{Platform.OS.toUpperCase()}</AppText>.
            Notice how flat fonts normalize fontWeight to prevent Android typeface crashes.
          </AppText>

          <View style={styles.weightsTable}>
            {weightSamples.map(({ label, weight }) => {
              const resolved = resolveTypography(activeFontFamily, weight);
              return (
                <View key={label} style={[styles.weightRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.weightLabelCol}>
                    <AppText variant="subtitle" style={{ fontSize: 13, fontWeight: '600' }}>{label}</AppText>
                    <AppBadge size="sm" variant="soft" tone="neutral">
                      {JSON.stringify(resolved)}
                    </AppBadge>
                  </View>
                  <View style={styles.weightPreviewCol}>
                    <AppText style={[resolved, { fontSize: 15, color: theme.color }]}>
                      {customText}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </AppCard>

        {/* Section 2: Core Components Showcase */}
        <AppCard variant="outlined" style={styles.card}>
          <AppTitle level={3}>UI Components with Theme Typography</AppTitle>
          <AppText variant="muted">
            All @some-alambre/ui components inherit the resolved typography automatically.
          </AppText>

          {/* Titles */}
          <View style={styles.groupContainer}>
            <AppText variant="caption" style={{ color: theme.muted }}>APP TITLE LEVELS</AppText>
            <AppTitle level={1}>Heading Level 1</AppTitle>
            <AppTitle level={2}>Heading Level 2</AppTitle>
            <AppTitle level={3}>Heading Level 3</AppTitle>
          </View>

          {/* Buttons */}
          <View style={styles.groupContainer}>
            <AppText variant="caption" style={{ color: theme.muted }}>BUTTON VARIANTS & WEIGHTS</AppText>
            <View style={styles.buttonShowcaseRow}>
              <AppButton variant="solid" tone="primary" label="Solid Primary" />
              <AppButton variant="soft" tone="secondary" label="Soft Secondary" />
              <AppButton variant="outline" tone="neutral" label="Outline Neutral" />
              <AppButton variant="ghost" tone="danger" label="Ghost Danger" />
            </View>
          </View>

          {/* Badges */}
          <View style={styles.groupContainer}>
            <AppText variant="caption" style={{ color: theme.muted }}>BADGES WITH BOLD TOKENS</AppText>
            <View style={styles.badgeShowcaseRow}>
              <AppBadge tone="primary" variant="solid">Primary</AppBadge>
              <AppBadge tone="success" variant="soft">Success</AppBadge>
              <AppBadge tone="warning" variant="soft">Warning</AppBadge>
              <AppBadge tone="danger" variant="outline">Danger</AppBadge>
            </View>
          </View>
        </AppCard>

        {/* Section 3: Kinetic Text Animations */}
        <AppCard variant="outlined" style={styles.card}>
          <AppTitle level={3}>Kinetic Text Typography</AppTitle>
          <AppText variant="muted">
            Testing physics and kinetic animations with the resolved font family.
          </AppText>

          <View style={styles.kineticRow}>
            <View style={styles.kineticItem}>
              <AppText variant="caption" style={{ color: theme.muted }}>COUNT UP TEXT</AppText>
              <CountUpText
                value={9850}
                duration={1800}
                formatter={(val) => `$${Math.round(val).toLocaleString()}`}
                textStyle={{ fontSize: 24, fontWeight: '700', color: theme.primary }}
              />
            </View>

            <View style={styles.kineticItem}>
              <AppText variant="caption" style={{ color: theme.muted }}>TICKER TEXT</AppText>
              <TickerText
                value={1249}
                textStyle={{ fontSize: 22, fontWeight: '700', color: theme.color }}
              />
            </View>
          </View>

          <View style={styles.groupContainer}>
            <AppText variant="caption" style={{ color: theme.muted }}>WAVY TEXT</AppText>
            <WavyText
              text="Fluid kinetic typography wave"
              textStyle={{ fontSize: 16, color: theme.color, fontWeight: '600' }}
            />
          </View>

          <View style={styles.groupContainer}>
            <AppText variant="caption" style={{ color: theme.muted }}>SCRAMBLE TEXT</AppText>
            <ScrambleText
              text="ENCRYPTED SECURE TOKEN"
              textStyle={{ fontSize: 15, color: theme.secondary, fontWeight: '700' }}
            />
          </View>

          <View style={styles.groupContainer}>
            <AppText variant="caption" style={{ color: theme.muted }}>TYPEWRITER TEXT</AppText>
            <TypewriterText
              text="Testing typewriter motion with sanitized Android weights."
              textStyle={{ fontSize: 14, color: theme.muted }}
            />
          </View>
        </AppCard>
      </ThemeProvider>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  weightsTable: {
    gap: 8,
    marginTop: 4,
  },
  weightRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 6,
  },
  weightLabelCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightPreviewCol: {
    paddingVertical: 4,
  },
  groupContainer: {
    gap: 6,
    marginVertical: 4,
  },
  buttonShowcaseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeShowcaseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kineticRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  kineticItem: {
    alignItems: 'center',
    gap: 4,
  },
});
