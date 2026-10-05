import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SettingsIcon } from 'alambre';
import { useLightDark } from '../../providers/theme';
import AppCard from '../../components/AppCard';
import AppTitle, { AppText } from '../../components/AppTitle';
import { ConfigSlider } from '../../components/test-utils/ConfigSlider';
import { ConfigSwitch } from '../../components/test-utils/ConfigSwitch';
import { GummyTabs } from '../../components/test-utils/GummyTabs';
import { TestCard } from '../../components/test-utils/TestCard';
import { AlarmGlyph, GeoHeart, HangingMobile, ItemsGlyph, art, type MotionSettings } from './KineticArt';

export default function KineticMotionTestbed() {
  const { theme } = useLightDark();

  const [speed, setSpeed] = useState(1);
  const [amplitude, setAmplitude] = useState(1);
  const [paused, setPaused] = useState(false);
  const motion: MotionSettings = { speed, amplitude, paused };

  const tabs = [
    { id: 'mobile', label: 'Mobile', content: <MobileScenario motion={motion} /> },
    { id: 'alarm', label: 'Alarm', content: <AlarmScenario motion={motion} /> },
    { id: 'heart', label: 'Heart', content: <HeartScenario motion={motion} /> },
    { id: 'menu', label: 'Menu', content: <MenuScenario motion={motion} /> },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TestCard
        title="Kinetic Motion"
        description="useHarmonicMotion and useRipplePulse drive every illustration on the UI thread. Pauses with reduced motion and when the app is backgrounded."
      >
        <ConfigSlider label={`Speed (${speed}x)`} value={speed} min={0.25} max={4} step={0.25} onChange={setSpeed} />
        <ConfigSlider label={`Amplitude (${amplitude}x)`} value={amplitude} min={0} max={2} step={0.25} onChange={setAmplitude} />
        <ConfigSwitch label="Paused" value={paused} onChange={setPaused} />
      </TestCard>

      <GummyTabs tabs={tabs} />
    </View>
  );
}

function MobileScenario({ motion }: { motion: MotionSettings }) {
  const { theme } = useLightDark();
  return (
    <View style={styles.tab}>
      <AppCard variant="outlined" style={styles.center}>
        <HangingMobile motion={motion} line={theme.color} size={300} />
        <AppTitle level={3} align="center" style={styles.gap}>Home hero</AppTitle>
        <AppText variant="muted" style={styles.copy}>
          Six nested pendulums, each with its own amplitude, period and phase. Child arms inherit the parent&apos;s swing.
        </AppText>
      </AppCard>
    </View>
  );
}

function AlarmScenario({ motion }: { motion: MotionSettings }) {
  const { theme } = useLightDark();
  const [ringing, setRinging] = useState(true);
  const [waves, setWaves] = useState(2);
  const [rippleDuration, setRippleDuration] = useState(2800);

  return (
    <View style={styles.tab}>
      <ConfigSwitch label="Alarm ringing" value={ringing} onChange={setRinging} />
      <ConfigSlider label={`Ripple waves (${waves})`} value={waves} min={1} max={4} step={1} onChange={setWaves} />
      <ConfigSlider label={`Ripple duration (${rippleDuration} ms)`} value={rippleDuration} min={800} max={5000} step={200} onChange={setRippleDuration} />
      <AppCard variant="outlined" style={[styles.center, styles.gap, { backgroundColor: theme.primarySoft }]}>
        <AlarmGlyph
          motion={motion}
          line={theme.color}
          size={180}
          ringing={ringing}
          rippleWaves={waves}
          rippleDuration={rippleDuration}
        />
        <AppTitle level={3} align="center">{ringing ? 'Wake up!' : 'Alarm set for 07:30'}</AppTitle>
      </AppCard>
    </View>
  );
}

function HeartScenario({ motion }: { motion: MotionSettings }) {
  const { theme } = useLightDark();
  const [bpm, setBpm] = useState(72);
  const [beating, setBeating] = useState(true);

  return (
    <View style={styles.tab}>
      <ConfigSlider label={`Heart rate (${bpm} bpm)`} value={bpm} min={40} max={180} step={4} onChange={setBpm} />
      <ConfigSwitch label="Beating" value={beating} onChange={setBeating} />
      <AppCard variant="outlined" style={[styles.center, styles.gap]}>
        <GeoHeart motion={motion} color={theme.primary} size={120} bpm={bpm} beating={beating} />
        <AppTitle level={3} align="center">Made with love</AppTitle>
      </AppCard>
    </View>
  );
}

function MenuScenario({ motion }: { motion: MotionSettings }) {
  const { theme, currThemeName } = useLightDark();
  const dark = currThemeName === 'dark';
  const [ringing, setRinging] = useState(false);

  const tileText = dark ? art.cream : art.ink;

  return (
    <View style={styles.tab}>
      <View style={styles.header}>
        <View style={[styles.roundButton, { backgroundColor: theme.surfaceAlt }]}>
          <GeoHeart motion={motion} color={theme.color} size={24} bpm={72} beating={false} />
        </View>
        <View style={[styles.roundButton, { backgroundColor: theme.surfaceAlt }]}>
          <SettingsIcon size={22} color={theme.color} drawIt />
        </View>
      </View>

      <View style={styles.center}>
        <HangingMobile motion={motion} line={theme.color} size={260} />
        <AppTitle level={1} align="center">Colguetti</AppTitle>
        <AppText variant="muted" style={styles.copy}>Little alarms, hung just right.</AppText>
      </View>

      <AppCard
        variant="soft"
        padding="lg"
        onPress={() => setRinging((value) => !value)}
        style={[styles.tile, { backgroundColor: dark ? '#333b30' : art.sage }]}
      >
        <View style={styles.tileRow}>
          <View style={styles.tileCopy}>
            <AppTitle level={2} color={tileText}>Alarms</AppTitle>
            <AppText style={{ color: tileText }}>Tap to {ringing ? 'silence' : 'ring'} it.</AppText>
          </View>
          <AlarmGlyph motion={motion} line={tileText} size={110} ringing={ringing} rippleWaves={2} rippleDuration={2800} />
        </View>
      </AppCard>

      <AppCard variant="soft" padding="lg" style={[styles.tile, { backgroundColor: dark ? '#3a352f' : art.sand }]}>
        <View style={styles.tileRow}>
          <View style={styles.tileCopy}>
            <AppTitle level={2} color={tileText}>My Items</AppTitle>
            <AppText style={{ color: tileText }}>Your saved sounds, shapes and routines.</AppText>
          </View>
          <ItemsGlyph motion={motion} line={tileText} size={110} />
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  tab: { paddingTop: 16, paddingBottom: 40, gap: 12 },
  center: { alignItems: 'center', justifyContent: 'center' },
  gap: { marginTop: 12 },
  copy: { textAlign: 'center', marginTop: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  roundButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tile: { borderRadius: 32 },
  tileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tileCopy: { flex: 1, gap: 4 },
});
