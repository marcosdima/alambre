import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { AlambreIcons, useNavigator } from 'alambre';
import type { Difficulty, GameMode, PuzzleDefinition } from '../../domain/types';
import { useGame } from '../../session/game-context';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { getPuzzlesByDifficulty } from '../../domain/puzzles/service';
import AppButton from '../../components/AppButton';

export default function GameSelect() {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { navigate } = useNavigator();
  const { startNewGame } = useGame();

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  const [selectedMode, setSelectedMode] = useState<GameMode>('zen');

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

  const availablePuzzles = getPuzzlesByDifficulty(selectedDifficulty);

  const handleStartRandom = () => {
    startNewGame(selectedDifficulty, selectedMode);
    navigate('game');
  };

  const handleSelectPuzzle = (puzzle: PuzzleDefinition) => {
    startNewGame(selectedDifficulty, selectedMode, puzzle.id);
    navigate('game');
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Difficulty Selection */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.color }]}>
          {lang.gameSelect.difficulty}
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
          {lang.gameSelect.gameMode}
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

      {/* Random Play Button */}
      <AppButton onPress={handleStartRandom}>
        <View style={styles.buttonInnerRow}>
          <AlambreIcons.Play
            color={theme.primary}
            lineWidth={2.5}
            style={{ width: 16, height: 16 }}
          />
          <Text style={[styles.playButtonText, { color: theme.primary }]}>
            {lang.gameSelect.playRandom}
          </Text>
        </View>
      </AppButton>

      {/* Puzzles List */}
      <View style={[styles.listCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.listHeader}>
          <Text style={[styles.sectionTitle, { color: theme.color }]}>
            {lang.gameSelect.chooseFromList}
          </Text>
          <Text style={[styles.listCount, { color: theme.muted }]}>
            {availablePuzzles.length} {lang.gameSelect.availablePuzzles}
          </Text>
        </View>

        <View style={styles.puzzlesList}>
          {availablePuzzles.map((puzzle) => (
            <Pressable
              key={puzzle.id}
              onPress={() => handleSelectPuzzle(puzzle)}
              style={({ pressed }) => [
                styles.puzzleItem,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                },
                pressed && { opacity: 0.75, borderColor: theme.primary },
              ]}
            >
              <View style={styles.puzzleItemHeader}>
                <Text style={[styles.puzzleItemTitle, { color: theme.color }]} numberOfLines={1}>
                  {puzzle.title}
                </Text>
                {puzzle.author && puzzle.author !== 'builtin' && (
                  <View style={[styles.customBadge, { backgroundColor: theme.primarySoft }]}>
                    <Text style={[styles.customBadgeText, { color: theme.primary }]}>
                      {lang.gameSelect.customTag}
                    </Text>
                  </View>
                )}
              </View>

              {puzzle.story ? (
                <Text style={[styles.puzzleStory, { color: theme.muted }]} numberOfLines={2}>
                  {puzzle.story}
                </Text>
              ) : null}

              <View style={styles.puzzleMeta}>
                <Text style={[styles.puzzleMetaText, { color: theme.muted }]}>
                  {puzzle.categories.length} {lang.gameSelect.categories} · {puzzle.categories[0]?.items.length ?? 0} {lang.gameSelect.items}
                </Text>
                <AlambreIcons.Arrow
                  color={theme.primary}
                  lineWidth={2}
                  style={{ width: 14, height: 14 }}
                />
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 30,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 12,
    textAlign: 'center',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 15,
    fontWeight: '700',
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listCount: {
    fontSize: 12,
  },
  puzzlesList: {
    gap: 10,
  },
  puzzleItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  puzzleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  puzzleItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  customBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  puzzleStory: {
    fontSize: 12,
    lineHeight: 16,
  },
  puzzleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  puzzleMetaText: {
    fontSize: 11,
  },
});
