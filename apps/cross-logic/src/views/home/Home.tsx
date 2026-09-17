import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useNavigator } from 'alambre';
import type { Difficulty, GameMode } from '../../domain/types';
import { useGame } from '../../session/game-context';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import AppTitle from '../../components/AppTitle';
import AppButton from '../../components/AppButton';

export default function Home() {
  const { theme } = useLightDark();
  const { lang } = useLang();
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

  const modes: { key: GameMode; title: string; desc: string; icon: string }[] = [
    {
      key: 'zen',
      title: lang.home.zenMode,
      desc: lang.home.zenModeDesc,
      icon: '🌱',
    },
    {
      key: 'challenge',
      title: lang.home.challengeMode,
      desc: lang.home.challengeModeDesc,
      icon: '⚡',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Banner */}
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle style={{ color: theme.color }}>{lang.home.title}</AppTitle>
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
            <Text style={{ color: theme.primary, fontWeight: '700' }}>
              Reanudar ▶
            </Text>
          </AppButton>
        </View>
      )}

      {/* Difficulty Selection */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.color }]}>
          {lang.home.selectDifficulty}
        </Text>
        <View style={styles.difficultyRow}>
          {difficulties.map((diff) => {
            const isSelected = selectedDifficulty === diff.key;
            return (
              <Pressable
                key={diff.key}
                onPress={() => setSelectedDifficulty(diff.key)}
                style={[
                  styles.chip,
                  {
                    borderColor: isSelected ? theme.primary : theme.border,
                    backgroundColor: isSelected ? theme.primarySoft : theme.surfaceAlt,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? theme.primary : theme.color,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {diff.label}
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
                <Text style={styles.modeIcon}>{m.icon}</Text>
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
        <Text style={[styles.playButtonText, { color: theme.primary }]}>
          🎮 {lang.home.playNow}
        </Text>
      </AppButton>

      {/* Navigation Footer */}
      <View style={styles.footerRow}>
        <AppButton style={{ flex: 1 }} onPress={() => navigate('howToPlay')}>
          <Text style={{ color: theme.color, fontSize: 13, fontWeight: '600' }}>
            📖 {lang.home.howToPlay}
          </Text>
        </AppButton>

        <AppButton style={{ flex: 1 }} onPress={() => navigate('settings')}>
          <Text style={{ color: theme.color, fontSize: 13, fontWeight: '600' }}>
            ⚙️ {lang.home.settings}
          </Text>
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
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  resumeTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  resumeSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
  },
  modesContainer: {
    gap: 10,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  modeIcon: {
    fontSize: 24,
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
    fontSize: 11,
    lineHeight: 15,
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
