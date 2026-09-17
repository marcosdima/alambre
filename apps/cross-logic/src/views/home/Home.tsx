import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { AlambreIcons, useNavigator } from 'alambre';
import type { Difficulty, GameMode } from '../../domain/types';
import { useGame } from '../../session/game-context';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import LetterReveal from '../../components/LetterReveal';
import AppButton from '../../components/AppButton';

export default function Home() {
  const { theme } = useLightDark();
  const { lang, currentLang } = useLang();
  const { navigate } = useNavigator();
  const { startNewGame, activePuzzle, isCompleted, isDefeated } = useGame();

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [selectedMode, setSelectedMode] = useState<GameMode>('zen');

  const hasActiveGame = Boolean(activePuzzle && !isCompleted && !isDefeated);

  const handleStartGame = () => {
    startNewGame(selectedDifficulty, selectedMode);
    navigate('game');
  };

  const handleResumeGame = () => {
    navigate('game');
  };

  const difficulties: { key: Difficulty; label: string }[] = [
    { key: 'easy', label: lang.home.easy },
    { key: 'medium', label: lang.home.medium },
    { key: 'hard', label: lang.home.hard },
  ];

  const modes: { key: GameMode; title: string; desc: string }[] = [
    {
      key: 'zen',
      title: lang.home.zenMode,
      desc: lang.home.zenModeDesc,
    },
    {
      key: 'challenge',
      title: lang.home.challengeMode,
      desc: lang.home.challengeModeDesc,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Banner with LetterReveal animation on language change */}
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <LetterReveal
          key={`${currentLang}_${lang.home.title}`}
          text={lang.home.title}
          style={{ color: theme.color, fontSize: 26 }}
        />
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          {lang.home.subtitle}
        </Text>
      </View>

      {/* Resume Game if in progress */}
      {hasActiveGame && (
        <View style={[styles.resumeCard, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.resumeTitle, { color: theme.primary }]}>
              Partida en curso
            </Text>
            <Text style={[styles.resumeSubtitle, { color: theme.color }]} numberOfLines={1}>
              {activePuzzle?.title}
            </Text>
          </View>
          <AppButton onPress={handleResumeGame}>
            <View style={styles.buttonInnerRow}>
              <Text style={{ color: theme.primary, fontWeight: '700' }}>
                Reanudar
              </Text>
              <AlambreIcons.Play
                color={theme.primary}
                lineWidth={2}
                style={{ width: 14, height: 14 }}
              />
            </View>
          </AppButton>
        </View>
      )}

      {/* Difficulty Selection */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.color }]}>
          {lang.home.selectDifficulty}
        </Text>
        <View style={styles.segmentedControl}>
          {difficulties.map((d) => {
            const isSelected = selectedDifficulty === d.key;
            return (
              <Pressable
                key={d.key}
                onPress={() => setSelectedDifficulty(d.key)}
                style={[
                  styles.segment,
                  {
                    borderColor: isSelected ? theme.primary : theme.border,
                    backgroundColor: isSelected ? theme.primarySoft : theme.surfaceAlt,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: isSelected ? theme.primary : theme.color,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Mode Selection */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.color }]}>
          {lang.home.selectMode}
        </Text>
        <View style={styles.modesContainer}>
          {modes.map((m) => {
            const isSelected = selectedMode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setSelectedMode(m.key)}
                style={[
                  styles.modeCard,
                  {
                    borderColor: isSelected ? theme.primary : theme.border,
                    backgroundColor: isSelected ? theme.primarySoft : theme.surfaceAlt,
                  },
                ]}
              >
                <View style={styles.modeIconContainer}>
                  {m.key === 'zen' ? (
                    <AlambreIcons.Leaf
                      color={isSelected ? theme.primary : theme.color}
                      lineWidth={2}
                      style={{ width: 20, height: 20 }}
                    />
                  ) : (
                    <AlambreIcons.Zap
                      color={isSelected ? theme.primary : theme.color}
                      lineWidth={2}
                      style={{ width: 20, height: 20 }}
                    />
                  )}
                </View>
                <View style={styles.modeTextContainer}>
                  <Text
                    style={[
                      styles.modeTitle,
                      { color: isSelected ? theme.primary : theme.color },
                    ]}
                  >
                    {m.title}
                  </Text>
                  <Text style={[styles.modeDesc, { color: theme.muted }]}>
                    {m.desc}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Start Button */}
      <AppButton onPress={handleStartGame}>
        <View style={styles.buttonInnerRow}>
          <AlambreIcons.Play
            color={theme.primary}
            lineWidth={2.5}
            style={{ width: 16, height: 16 }}
          />
          <Text style={[styles.playButtonText, { color: theme.primary }]}>
            {lang.home.playNow}
          </Text>
        </View>
      </AppButton>

      {/* Navigation Footer */}
      <View style={styles.footerRow}>
        <AppButton style={{ flex: 1 }} onPress={() => navigate('howToPlay')}>
          <View style={styles.buttonInnerRow}>
            <AlambreIcons.Book
              color={theme.color}
              lineWidth={2}
              style={{ width: 14, height: 14 }}
            />
            <Text style={{ color: theme.color, fontSize: 13, fontWeight: '600' }}>
              {lang.home.howToPlay}
            </Text>
          </View>
        </AppButton>

        <AppButton style={{ flex: 1 }} onPress={() => navigate('settings')}>
          <View style={styles.buttonInnerRow}>
            <AlambreIcons.Gear
              color={theme.color}
              lineWidth={2}
              style={{ width: 14, height: 14 }}
            />
            <Text style={{ color: theme.color, fontSize: 13, fontWeight: '600' }}>
              {lang.home.settings}
            </Text>
          </View>
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    gap: 14,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  resumeTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  resumeSubtitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  modesContainer: {
    gap: 8,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  modeIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTextContainer: {
    flex: 1,
    gap: 2,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  modeDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
