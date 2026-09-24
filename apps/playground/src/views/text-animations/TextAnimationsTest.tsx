import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../../providers/theme';
import AppButton from '../../components/AppButton';
import AppTitle, { AppText } from '../../components/AppTitle';
import AppCard from '../../components/AppCard';
import AppSwitch from '../../components/AppSwitch';
import AppTextInput from '../../components/AppTextInput';
import AppBadge, { AppChip } from '../../components/AppBadge';
import { TickerText, TypewriterText, WavyText } from '../../components/text-animations';

export default function TextAnimationsTest() {
  const { theme } = useLightDark();

  // 1. Ticker state
  const [tickerValue, setTickerValue] = useState(1250);
  const [staggerDir, setStaggerDir] = useState<'right-to-left' | 'left-to-right'>('right-to-left');
  const [tickerPreset, setTickerPreset] = useState<'snappy' | 'bouncy' | 'calm'>('bouncy');

  const springConfigs = {
    snappy: { damping: 24, stiffness: 260, mass: 0.8 },
    bouncy: { damping: 14, stiffness: 180, mass: 0.9 },
    calm: { damping: 32, stiffness: 150, mass: 1 },
  };

  // 2. Typewriter state
  const presetSentences = [
    'You drew the Ace of Spades! Critical hit deals 250 damage.',
    'Round 3: Choose a card from your hand to attack or defend.',
    'Tactile micro-physics and kinetic typography in alambre.',
  ];
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customText, setCustomText] = useState('');
  const [typewriterSpeed, setTypewriterSpeed] = useState<20 | 45 | 80>(45);
  const [typewriterLoop, setTypewriterLoop] = useState(false);
  const [typewriterKey, setTypewriterKey] = useState(0);

  // 3. Wavy state
  const [wavyActive, setWavyActive] = useState(true);
  const [wavyAmplitude, setWavyAmplitude] = useState<4 | 8 | 14>(8);
  const [wavyTone, setWavyTone] = useState<'primary' | 'success' | 'warning'>('primary');

  // 4. Game HUD Mockup state
  const [gameHp, setGameHp] = useState(100);
  const [gameGold, setGameGold] = useState(350);
  const [gameTurn, setGameTurn] = useState(1);
  const [gameLog, setGameLog] = useState('Battle started. Draw your opening hand.');
  const [gameLogKey, setGameLogKey] = useState(0);

  const activeTypewriterText = customText.trim().length > 0
    ? customText
    : presetSentences[selectedPresetIndex];

  const handleSimulateDamage = () => {
    const dmg = Math.floor(Math.random() * 25) + 15;
    setGameHp((hp) => Math.max(0, hp - dmg));
    setGameLog(`Opponent played Goblin Raider! You suffered -${dmg} damage.`);
    setGameLogKey((k) => k + 1);
  };

  const handleSimulateHeal = () => {
    const heal = 25;
    setGameHp((hp) => Math.min(100, hp + heal));
    setGameLog(`Drank Healing Potion! Restored +${heal} HP.`);
    setGameLogKey((k) => k + 1);
  };

  const handleSimulateGold = () => {
    const loot = Math.floor(Math.random() * 120) + 40;
    setGameGold((g) => g + loot);
    setGameLog(`Defeated treasure chest! Found +${loot} shiny gold coins.`);
    setGameLogKey((k) => k + 1);
  };

  const handleNextTurn = () => {
    setGameTurn((t) => t + 1);
    setGameLog(`Turn ${gameTurn + 1} started. Card draw phase complete.`);
    setGameLogKey((k) => k + 1);
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(260)} style={styles.header}>
        <AppTitle
          level={1}
          badge="Playground"
          badgeTone="primary"
          subtitle="Kinetic typography, slot machine digit tickers, and wave oscillations."
        >
          Text Animations
        </AppTitle>
      </Animated.View>

      {/* 1. TickerText Card */}
      <Animated.View entering={FadeInDown.duration(260).delay(60)}>
        <AppCard
          variant="outlined"
          title="Slot Machine Digit Ticker"
          subtitle="Spring-driven rolling numbers with tabular font metrics"
          badge="TickerText"
          badgeTone="primary"
        >
          <View style={styles.tickerHeroBox}>
            <TickerText
              value={tickerValue}
              prefix="$"
              fontSize={42}
              springConfig={springConfigs[tickerPreset]}
              staggerDirection={staggerDir}
              color={theme.primary}
              containerStyle={styles.tickerCenter}
            />
            <AppText variant="caption" style={styles.centerMuted}>
              Spring: {tickerPreset.toUpperCase()} • Stagger: {staggerDir}
            </AppText>
          </View>

          {/* Value Steppers */}
          <AppText variant="caption">Adjust Value</AppText>
          <View style={styles.buttonRow}>
            <AppButton
              size="sm"
              variant="soft"
              tone="success"
              label="+10"
              onPress={() => setTickerValue((v) => v + 10)}
            />
            <AppButton
              size="sm"
              variant="soft"
              tone="success"
              label="+100"
              onPress={() => setTickerValue((v) => v + 100)}
            />
            <AppButton
              size="sm"
              variant="soft"
              tone="success"
              label="+500"
              onPress={() => setTickerValue((v) => v + 500)}
            />
            <AppButton
              size="sm"
              variant="soft"
              tone="danger"
              label="-50"
              onPress={() => setTickerValue((v) => Math.max(0, v - 50))}
            />
            <AppButton
              size="sm"
              variant="soft"
              tone="danger"
              label="-250"
              onPress={() => setTickerValue((v) => Math.max(0, v - 250))}
            />
          </View>

          <View style={styles.buttonRow}>
            <AppButton
              size="sm"
              variant="outline"
              tone="primary"
              label="Randomize (0 - 9,999)"
              onPress={() => setTickerValue(Math.floor(Math.random() * 9999))}
              style={{ flex: 1 }}
            />
            <AppButton
              size="sm"
              variant="outline"
              tone="neutral"
              label="Reset"
              onPress={() => setTickerValue(0)}
            />
          </View>

          {/* Presets and direction */}
          <AppText variant="caption" style={{ marginTop: 8 }}>Dynamics & Direction</AppText>
          <View style={styles.chipRow}>
            {(['bouncy', 'snappy', 'calm'] as const).map((preset) => (
              <AppChip
                key={preset}
                label={preset.toUpperCase()}
                selected={tickerPreset === preset}
                onPress={() => setTickerPreset(preset)}
                size="sm"
              />
            ))}
            <AppChip
              label={staggerDir === 'right-to-left' ? 'R-to-L' : 'L-to-R'}
              selected
              tone="neutral"
              size="sm"
              onPress={() =>
                setStaggerDir((d) =>
                  d === 'right-to-left' ? 'left-to-right' : 'right-to-left',
                )
              }
            />
          </View>
        </AppCard>
      </Animated.View>

      {/* 2. TypewriterText Card */}
      <Animated.View entering={FadeInDown.duration(260).delay(120)}>
        <AppCard
          variant="outlined"
          title="Typewriter & Script Terminal"
          subtitle="Sequential character revelation with blinking cursor"
          badge="TypewriterText"
          badgeTone="success"
        >
          {/* Terminal Box */}
          <View
            style={[
              styles.terminalBox,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
          >
            <View style={styles.terminalHeader}>
              <View style={[styles.terminalDot, { backgroundColor: '#ef4444' }]} />
              <View style={[styles.terminalDot, { backgroundColor: '#f59e0b' }]} />
              <View style={[styles.terminalDot, { backgroundColor: '#10b981' }]} />
              <AppText variant="code" style={styles.terminalTitle}>dialog.log</AppText>
            </View>

            <TypewriterText
              key={typewriterKey}
              text={activeTypewriterText}
              speed={typewriterSpeed}
              loop={typewriterLoop}
              cursorColor={theme.primary}
              textStyle={[styles.terminalText, { color: theme.color }]}
            />
          </View>

          {/* Preset Chips */}
          <AppText variant="caption">Sentence Presets</AppText>
          <View style={styles.chipRow}>
            {['Card Draw', 'Turn State', 'Tactile Engine'].map((preset, idx) => (
              <AppChip
                key={preset}
                label={preset}
                selected={customText === '' && selectedPresetIndex === idx}
                onPress={() => {
                  setCustomText('');
                  setSelectedPresetIndex(idx);
                  setTypewriterKey((k) => k + 1);
                }}
                size="sm"
              />
            ))}
          </View>

          {/* Custom Input */}
          <AppTextInput
            label="Custom Input"
            placeholder="Type your own sentence here..."
            value={customText}
            onChangeText={(txt) => {
              setCustomText(txt);
              setTypewriterKey((k) => k + 1);
            }}
            clearable
          />

          {/* Speed & Controls */}
          <View style={styles.controlsRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="caption">Typing Speed</AppText>
              <View style={styles.chipRow}>
                {([20, 45, 80] as const).map((spd) => (
                  <AppChip
                    key={spd}
                    label={`${spd}ms`}
                    selected={typewriterSpeed === spd}
                    onPress={() => {
                      setTypewriterSpeed(spd);
                      setTypewriterKey((k) => k + 1);
                    }}
                    size="sm"
                  />
                ))}
              </View>
            </View>

            <AppSwitch
              label="Loop"
              size="sm"
              checked={typewriterLoop}
              onChange={setTypewriterLoop}
            />
          </View>

          <AppButton
            variant="solid"
            tone="primary"
            size="md"
            label="Replay Typewriter"
            leftIcon={
              <AlambreIcons.Refresh
                color="#ffffff"
                lineWidth={2}
                style={{ width: 16, height: 16 }}
              />
            }
            onPress={() => setTypewriterKey((k) => k + 1)}
            style={{ marginTop: 8 }}
          />
        </AppCard>
      </Animated.View>

      {/* 3. WavyText Card */}
      <Animated.View entering={FadeInDown.duration(260).delay(180)}>
        <AppCard
          variant="outlined"
          title="Kinetic Sine Wave & Bounce"
          subtitle="Continuous sine wave oscillation with staggered character phase"
          badge="WavyText"
          badgeTone="warning"
        >
          <View style={styles.wavyCenterBox}>
            <WavyText
              text="VICTORY ROYALE!"
              active={wavyActive}
              amplitude={wavyAmplitude}
              color={
                wavyTone === 'success'
                  ? '#10b981'
                  : wavyTone === 'warning'
                    ? '#f59e0b'
                    : theme.primary
              }
              textStyle={{ fontSize: 26, fontWeight: '900', letterSpacing: 0.5 }}
            />
            <WavyText
              text="Level Up +450 XP"
              active={wavyActive}
              amplitude={wavyAmplitude * 0.7}
              color={theme.muted}
              textStyle={{ fontSize: 15, fontWeight: '600' }}
            />
          </View>

          <View style={styles.controlsRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="caption">Amplitude (Wave Height)</AppText>
              <View style={styles.chipRow}>
                {([4, 8, 14] as const).map((amp) => (
                  <AppChip
                    key={amp}
                    label={`${amp}px`}
                    selected={wavyAmplitude === amp}
                    onPress={() => setWavyAmplitude(amp)}
                    size="sm"
                  />
                ))}
              </View>
            </View>

            <AppSwitch
              label="Active Wave"
              size="sm"
              checked={wavyActive}
              onChange={setWavyActive}
            />
          </View>

          <AppText variant="caption" style={{ marginTop: 4 }}>Color Tone</AppText>
          <View style={styles.chipRow}>
            {(['primary', 'success', 'warning'] as const).map((t) => (
              <AppChip
                key={t}
                label={t.toUpperCase()}
                selected={wavyTone === t}
                tone={t}
                size="sm"
                onPress={() => setWavyTone(t)}
              />
            ))}
          </View>
        </AppCard>
      </Animated.View>

      {/* 4. Real-World Card Game HUD Mockup */}
      <Animated.View entering={FadeInDown.duration(260).delay(240)}>
        <AppCard
          variant="elevated"
          title="Card Game HUD Prototype"
          subtitle="Real-world integration showing animated scores, gold, and dialogue"
          badge="Game HUD"
          badgeTone="success"
        >
          {/* Top Status Bar */}
          <View
            style={[
              styles.hudHeaderRow,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
          >
            {/* Player Health */}
            <View style={styles.hudStatCol}>
              <AppText variant="caption" style={{ color: '#ef4444' }}>HP</AppText>
              <TickerText
                value={gameHp}
                fontSize={22}
                color="#ef4444"
                suffix="/ 100"
                textStyle={{ fontSize: 20 }}
              />
            </View>

            {/* Gold */}
            <View style={styles.hudStatCol}>
              <AppText variant="caption" style={{ color: '#f59e0b' }}>GOLD</AppText>
              <TickerText
                value={gameGold}
                prefix="🪙 "
                fontSize={22}
                color="#f59e0b"
                textStyle={{ fontSize: 20 }}
              />
            </View>

            {/* Turn */}
            <View style={styles.hudStatCol}>
              <AppText variant="caption" style={{ color: theme.primary }}>TURN</AppText>
              <TickerText
                value={gameTurn}
                fontSize={22}
                color={theme.primary}
                textStyle={{ fontSize: 20 }}
              />
            </View>
          </View>

          {/* Turn Banner */}
          <View style={styles.turnBannerRow}>
            <WavyText
              text={`★ ROUND ${gameTurn}: YOUR TURN ★`}
              amplitude={5}
              duration={700}
              color={theme.color}
              textStyle={{ fontSize: 16, fontWeight: '800' }}
            />
          </View>

          {/* Dialogue Log */}
          <View
            style={[
              styles.combatLogBox,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
          >
            <View style={styles.logHeader}>
              <AppBadge label="Combat Log" tone="neutral" size="sm" />
            </View>
            <TypewriterText
              key={gameLogKey}
              text={gameLog}
              speed={25}
              cursor={false}
              textStyle={{ fontSize: 14, lineHeight: 20, color: theme.color }}
            />
          </View>

          {/* Interactive Game Action Buttons */}
          <AppText variant="caption" style={{ marginTop: 10 }}>Trigger Game Events</AppText>
          <View style={styles.buttonRow}>
            <AppButton
              size="sm"
              variant="outline"
              tone="danger"
              label="Take Damage"
              onPress={handleSimulateDamage}
              style={{ flex: 1 }}
            />
            <AppButton
              size="sm"
              variant="outline"
              tone="success"
              label="Heal +25"
              onPress={handleSimulateHeal}
              style={{ flex: 1 }}
            />
          </View>

          <View style={styles.buttonRow}>
            <AppButton
              size="sm"
              variant="outline"
              tone="warning"
              label="Loot Gold"
              onPress={handleSimulateGold}
              style={{ flex: 1 }}
            />
            <AppButton
              size="sm"
              variant="solid"
              tone="primary"
              label="Next Turn"
              onPress={handleNextTurn}
              style={{ flex: 1 }}
            />
          </View>
        </AppCard>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 18,
    gap: 18,
    paddingBottom: 40,
  },
  header: {
    gap: 4,
    marginBottom: 4,
  },
  tickerHeroBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  tickerCenter: {
    alignSelf: 'center',
  },
  centerMuted: {
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  terminalBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginVertical: 10,
    minHeight: 110,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  terminalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  terminalTitle: {
    marginLeft: 6,
    fontSize: 12,
  },
  terminalText: {
    fontFamily: 'monospace',
    fontSize: 15,
    lineHeight: 22,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  wavyCenterBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 4,
  },
  hudHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  hudStatCol: {
    alignItems: 'center',
    gap: 2,
  },
  turnBannerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  combatLogBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 6,
    minHeight: 64,
  },
  logHeader: {
    marginBottom: 6,
  },
});
