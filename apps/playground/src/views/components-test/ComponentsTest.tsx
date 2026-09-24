import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../../providers/theme';
import AppTitle, { AppText } from '../../components/AppTitle';
import AppButton from '../../components/AppButton';
import type { ButtonSize, ButtonTone, ButtonVariant } from '../../components/AppButton';
import AppSegmentedControl from '../../components/AppSegmentedControl';

export default function ComponentsTest() {
  const { theme } = useLightDark();

  // Interactive playground state
  const [variant, setVariant] = useState<ButtonVariant>('solid');
  const [tone, setTone] = useState<ButtonTone>('primary');
  const [size, setSize] = useState<ButtonSize>('md');
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [fullWidth, setFullWidth] = useState(false);
  const [clicks, setClicks] = useState(0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 1. Header Hero with Compound AppTitle */}
      <Animated.View
        entering={FadeInDown.duration(280).easing(Easing.out(Easing.cubic))}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <AppTitle
          level={1}
          badge="UI Core"
          badgeTone="primary"
          subtitle="Explore visual variants, semantic tones, sizing tokens, and tactile spring physics for buttons and typography."
        >
          Buttons & Typography
        </AppTitle>
      </Animated.View>

      {/* 2. Interactive Button Playground */}
      <Animated.View
        entering={FadeInLeft.duration(280).delay(60).easing(Easing.out(Easing.cubic))}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <AppTitle level={2} subtitle="Tune button parameters to test variant, tone, size, and spring responses in real time.">
          Interactive Playground
        </AppTitle>

        {/* Variant selector */}
        <AppSegmentedControl<ButtonVariant>
          label="Visual Variant"
          value={variant}
          onChange={setVariant}
          options={[
            { label: 'Solid', value: 'solid' },
            { label: 'Outline', value: 'outline' },
            { label: 'Soft', value: 'soft' },
            { label: 'Ghost', value: 'ghost' },
          ]}
        />

        {/* Tone selector */}
        <AppSegmentedControl<ButtonTone>
          label="Semantic Tone"
          value={tone}
          onChange={setTone}
          options={[
            { label: 'Primary', value: 'primary' },
            { label: 'Success', value: 'success' },
            { label: 'Warning', value: 'warning' },
            { label: 'Danger', value: 'danger' },
            { label: 'Neutral', value: 'neutral' },
          ]}
        />

        {/* Size selector */}
        <AppSegmentedControl<ButtonSize>
          label="Size"
          value={size}
          onChange={setSize}
          options={[
            { label: 'SM (34px)', value: 'sm' },
            { label: 'MD (44px)', value: 'md' },
            { label: 'LG (52px)', value: 'lg' },
          ]}
        />

        {/* Toggles */}
        <View style={styles.togglesRow}>
          <AppButton
            variant={loading ? 'solid' : 'soft'}
            tone={loading ? 'warning' : 'neutral'}
            size="sm"
            label={loading ? 'Loading: YES' : 'Loading: NO'}
            onPress={() => setLoading((v) => !v)}
          />
          <AppButton
            variant={disabled ? 'solid' : 'soft'}
            tone={disabled ? 'danger' : 'neutral'}
            size="sm"
            label={disabled ? 'Disabled: YES' : 'Disabled: NO'}
            onPress={() => setDisabled((v) => !v)}
          />
          <AppButton
            variant={fullWidth ? 'solid' : 'soft'}
            tone={fullWidth ? 'primary' : 'neutral'}
            size="sm"
            label={fullWidth ? 'Width: 100%' : 'Width: Auto'}
            onPress={() => setFullWidth((v) => !v)}
          />
        </View>

        {/* Live Preview Area */}
        <View
          style={[
            styles.previewArea,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
        >
          <AppText variant="caption">Tactile Spring Physics Preview</AppText>
          <AppButton
            variant={variant}
            tone={tone}
            size={size}
            loading={loading}
            disabled={disabled}
            fullWidth={fullWidth}
            label={`Press Button (${clicks})`}
            leftIcon={
              <AlambreIcons.Zap
                drawIt={true}
                color={variant === 'solid' ? (tone === 'warning' ? '#1e1e1e' : '#fff') : theme.primary}
                lineWidth={2}
                style={{ width: 18, height: 18 }}
              />
            }
            onPress={() => setClicks((c) => c + 1)}
          />
          <AppText variant="subtitle">
            Press and hold to feel the spring scale feedback (withSpring).
          </AppText>
        </View>
      </Animated.View>

      {/* 3. Variants Showcase */}
      <Animated.View
        entering={FadeInRight.duration(280).delay(120).easing(Easing.out(Easing.cubic))}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <AppTitle level={2} subtitle="Four visual styles to establish clear hierarchy for user actions.">
          Visual Variants
        </AppTitle>

        <View style={styles.gridRow}>
          <AppButton
            variant="solid"
            tone="primary"
            label="Solid"
            style={styles.gridBtn}
            leftIcon={<AlambreIcons.CircleCheck drawIt color="#fff" lineWidth={2} style={styles.btnIcon} />}
          />
          <AppButton
            variant="outline"
            tone="primary"
            label="Outline"
            style={styles.gridBtn}
          />
        </View>

        <View style={styles.gridRow}>
          <AppButton
            variant="soft"
            tone="primary"
            label="Soft"
            style={styles.gridBtn}
          />
          <AppButton
            variant="ghost"
            tone="primary"
            label="Ghost"
            style={styles.gridBtn}
          />
        </View>
      </Animated.View>

      {/* 4. Semantic Tones Showcase */}
      <Animated.View
        entering={FadeInLeft.duration(280).delay(160).easing(Easing.out(Easing.cubic))}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <AppTitle level={2} subtitle="Semantic color palettes ready for every UI context and tone.">
          Semantic Tones
        </AppTitle>

        <View style={styles.tonesGrid}>
          <AppButton variant="solid" tone="primary" label="Primary" size="sm" />
          <AppButton variant="solid" tone="success" label="Success" size="sm" />
          <AppButton variant="solid" tone="warning" label="Warning" size="sm" />
          <AppButton variant="solid" tone="danger" label="Danger" size="sm" />
          <AppButton variant="solid" tone="neutral" label="Neutral" size="sm" />
        </View>

        <View style={styles.tonesGrid}>
          <AppButton variant="soft" tone="primary" label="Soft Primary" size="sm" />
          <AppButton variant="soft" tone="success" label="Soft Success" size="sm" />
          <AppButton variant="soft" tone="warning" label="Soft Warning" size="sm" />
          <AppButton variant="soft" tone="danger" label="Soft Danger" size="sm" />
          <AppButton variant="soft" tone="neutral" label="Soft Neutral" size="sm" />
        </View>
      </Animated.View>

      {/* 5. Icons and Shapes */}
      <Animated.View
        entering={FadeInRight.duration(280).delay(200).easing(Easing.out(Easing.cubic))}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <AppTitle level={2} subtitle="Support for left/right icon slots, responsive sizing, and square icon-only buttons.">
          Icons & Layout
        </AppTitle>

        <View style={styles.gridRow}>
          <AppButton
            variant="solid"
            tone="primary"
            label="Left Icon"
            style={styles.gridBtn}
            leftIcon={<AlambreIcons.Zap drawIt color="#fff" lineWidth={2} style={styles.btnIcon} />}
          />
          <AppButton
            variant="outline"
            tone="primary"
            label="Right Arrow"
            style={styles.gridBtn}
            rightIcon={<AlambreIcons.Arrow drawIt color={theme.primary} lineWidth={2} style={styles.btnIcon} />}
          />
        </View>

        <AppText variant="caption">Square Icon Buttons (iconOnly)</AppText>
        <View style={styles.iconRow}>
          <AppButton
            variant="soft"
            tone="primary"
            iconOnly
            leftIcon={<AlambreIcons.Gear drawIt color={theme.primary} lineWidth={2.2} style={styles.btnIcon} />}
          />
          <AppButton
            variant="soft"
            tone="success"
            iconOnly
            leftIcon={<AlambreIcons.CircleCheck drawIt color="#10b981" lineWidth={2.2} style={styles.btnIcon} />}
          />
          <AppButton
            variant="soft"
            tone="danger"
            iconOnly
            leftIcon={<AlambreIcons.CircleX drawIt color="#ef4444" lineWidth={2.2} style={styles.btnIcon} />}
          />
          <AppButton
            variant="outline"
            tone="neutral"
            iconOnly
            leftIcon={<AlambreIcons.Moon drawIt color={theme.color} lineWidth={2.2} style={styles.btnIcon} />}
          />
        </View>
      </Animated.View>

      {/* 6. Typography System */}
      <Animated.View
        entering={FadeInDown.duration(280).delay(240).easing(Easing.out(Easing.cubic))}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <AppTitle level={2} subtitle="Structured hierarchy with dynamic light and dark theme bindings.">
          Typography System (AppTitle & AppText)
        </AppTitle>

        <View style={[styles.typeBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <AppTitle level={1} badge="H1 (28px)" badgeTone="primary">
            Title Level 1 (Hero)
          </AppTitle>
          <AppText variant="subtitle">For primary screens, hero banners, and full-page titles.</AppText>
        </View>

        <View style={[styles.typeBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <AppTitle level={2} badge="H2 (22px)" badgeTone="success">
            Title Level 2 (Section)
          </AppTitle>
          <AppText variant="subtitle">For content sections, modal sheets, and configuration cards.</AppText>
        </View>

        <View style={[styles.typeBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <AppTitle level={3} badge="H3 (17px)" badgeTone="warning">
            Title Level 3 (Card)
          </AppTitle>
          <AppText variant="subtitle">For internal cards, summary blocks, and item headers.</AppText>
        </View>

        <View style={[styles.typeBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <AppText variant="caption">CAPTION / UPPERCASE LABEL (11px)</AppText>
          <AppText variant="body">
            Standard body text (<AppText variant="code">variant="body"</AppText>) with optimized line height for comfortable mobile reading.
          </AppText>
          <AppText variant="muted">
            Secondary muted text (<AppText variant="code">variant="muted"</AppText>) providing balanced context without distraction.
          </AppText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  togglesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewArea: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  gridBtn: {
    flex: 1,
    minWidth: 120,
  },
  tonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnIcon: {
    width: 18,
    height: 18,
  },
  typeBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
});
