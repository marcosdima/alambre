import { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { AlambreIcons, useNavigator } from 'alambre';
import type { GameMode, CompletedRecord, Difficulty } from '../../domain/types';
import { useRecords } from '../../session/records-context';
import { usePuzzles } from '../../session/puzzles-context';
import { useGame } from '../../session/game-context';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { getPuzzleById } from '../../domain/puzzles/service';
import AppButton from '../../components/AppButton';

const formatTime = (totalSecs: number): string => {
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}m ${secs}s`;
};

interface GroupedPuzzleRecord {
  puzzleId: string;
  title: string;
  difficulty: Difficulty;
  latestCompletedAt: string;
  attempts: CompletedRecord[]; // sorted: elapsedSeconds ascending (best time first)
}

export default function History() {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { navigate } = useNavigator();
  const { records } = useRecords();
  const { customPuzzles } = usePuzzles();
  const { startNewGame } = useGame();

  const [filterMode, setFilterMode] = useState<GameMode | 'all'>('all');
  const [expandedPuzzles, setExpandedPuzzles] = useState<Record<string, boolean>>({});

  const toggleExpanded = (puzzleId: string) => {
    setExpandedPuzzles((prev) => ({ ...prev, [puzzleId]: !prev[puzzleId] }));
  };

  const groupedPuzzles = useMemo((): GroupedPuzzleRecord[] => {
    const list = filterMode === 'all'
      ? records
      : records.filter((r) => r.mode === filterMode);

    const map = new Map<string, CompletedRecord[]>();
    for (const rec of list) {
      const existing = map.get(rec.id);
      if (existing) {
        existing.push(rec);
      } else {
        map.set(rec.id, [rec]);
      }
    }

    const groups: GroupedPuzzleRecord[] = [];
    for (const [puzzleId, attempts] of map.entries()) {
      const puzzle = getPuzzleById(puzzleId, customPuzzles);
      const title = puzzle?.title ?? puzzleId;
      const difficulty = puzzle?.difficulty ?? attempts[0]?.difficulty ?? 'easy';

      // Sort attempts strictly from best to worst time (elapsedSeconds ascending)
      const sortedAttempts = [...attempts].sort(
        (a, b) => a.elapsedSeconds - b.elapsedSeconds,
      );

      const latestTime = Math.max(
        ...attempts.map((a) => new Date(a.completedAt).getTime()),
      );
      const latestCompletedAt = new Date(latestTime).toISOString();

      groups.push({
        puzzleId,
        title,
        difficulty,
        latestCompletedAt,
        attempts: sortedAttempts,
      });
    }

    // Sort puzzle cards: most recently played puzzle first
    return groups.sort(
      (a, b) => new Date(b.latestCompletedAt).getTime() - new Date(a.latestCompletedAt).getTime(),
    );
  }, [records, filterMode, customPuzzles]);

  const handleReplay = (group: GroupedPuzzleRecord) => {
    const mode = filterMode === 'all' ? group.attempts[0].mode : filterMode;
    startNewGame(group.difficulty, mode, group.puzzleId);
    navigate('game');
  };

  if (records.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.emptyIconBox, { backgroundColor: theme.surfaceAlt }]}>
          <AlambreIcons.Trophy
            color={theme.muted}
            lineWidth={2}
            style={{ width: 44, height: 44 }}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.color }]}>
          {lang.history.emptyTitle}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
          {lang.history.emptySubtitle}
        </Text>
        <AppButton onPress={() => navigate('gameSelect')}>
          <View style={styles.buttonInnerRow}>
            <AlambreIcons.Play
              color={theme.primary}
              lineWidth={2}
              style={{ width: 16, height: 16 }}
            />
            <Text style={{ color: theme.primary, fontWeight: '700' }}>
              {lang.history.playFirst}
            </Text>
          </View>
        </AppButton>
      </View>
    );
  }

  const zenCount = records.filter((r) => r.mode === 'zen').length;
  const challengeCount = records.filter((r) => r.mode === 'challenge').length;

  const getDifficultyLabel = (diff: Difficulty) => {
    switch (diff) {
      case 'easy':
        return lang.home.easy.split(' ')[0];
      case 'medium':
        return lang.home.medium.split(' ')[0];
      case 'hard':
        return lang.home.hard.split(' ')[0];
      default:
        return diff;
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: theme.primary }]}>
            {records.length}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>
            {lang.history.totalCompleted}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: theme.color }]}>
            {zenCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>
            {lang.history.zenMode}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: theme.color }]}>
            {challengeCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>
            {lang.history.challengeMode}
          </Text>
        </View>
      </View>

      {/* Mode Filters */}
      <View style={styles.filterRow}>
        {(['all', 'zen', 'challenge'] as const).map((modeKey) => {
          const isSelected = filterMode === modeKey;
          const label =
            modeKey === 'all'
              ? 'Todos'
              : modeKey === 'zen'
                ? lang.history.zenMode
                : lang.history.challengeMode;
          return (
            <Pressable
              key={modeKey}
              onPress={() => setFilterMode(modeKey)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected ? theme.primarySoft : theme.surfaceAlt,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isSelected ? theme.primary : theme.color,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Grouped Records List */}
      <View style={styles.recordsList}>
        {groupedPuzzles.map((group) => {
          const isExpanded = !!expandedPuzzles[group.puzzleId];
          const visibleAttempts = isExpanded ? group.attempts : group.attempts.slice(0, 3);
          const hasMore = group.attempts.length > 3;

          return (
            <View
              key={group.puzzleId}
              style={[
                styles.recordCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              {/* Card Header: Title on Left, Difficulty Badge on Right */}
              <View style={styles.recordHeader}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.recordTitle, { color: theme.color }]} numberOfLines={1}>
                    {group.title}
                  </Text>
                  <Text style={[styles.recordSubtitle, { color: theme.muted }]}>
                    {group.attempts.length === 1
                      ? `1 ${lang.history.singlePlay}`
                      : `${group.attempts.length} ${lang.history.plays}`}
                  </Text>
                </View>

                {/* Difficulty Badge in Header (replaces redundant best time badge) */}
                <View
                  style={[
                    styles.difficultyBadge,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.difficultyBadgeText, { color: theme.primary }]}>
                    {getDifficultyLabel(group.difficulty)}
                  </Text>
                </View>
              </View>

              {/* Attempts List (sorted Best to Worst) */}
              <View style={[styles.attemptsList, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                {visibleAttempts.map((attempt, index) => {
                  const isBest = index === 0;
                  const formattedDate = new Date(attempt.completedAt).toLocaleDateString();

                  return (
                    <View
                      key={`${attempt.completedAt}_${index}`}
                      style={[
                        styles.attemptRow,
                        index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                      ]}
                    >
                      {/* Rank Indicator */}
                      <View style={styles.rankCol}>
                        {isBest ? (
                          <View style={[styles.trophyPill, { backgroundColor: theme.primarySoft }]}>
                            <AlambreIcons.Trophy
                              color={theme.primary}
                              lineWidth={2.5}
                              style={{ width: 11, height: 11 }}
                            />
                            <Text style={[styles.rankText, { color: theme.primary, fontWeight: '800' }]}>
                              #1
                            </Text>
                          </View>
                        ) : (
                          <Text style={[styles.rankText, { color: theme.muted, fontWeight: '600' }]}>
                            #{index + 1}
                          </Text>
                        )}
                      </View>

                      {/* Time */}
                      <View style={styles.timeCol}>
                        <Text
                          style={[
                            styles.timeText,
                            {
                              color: isBest ? theme.primary : theme.color,
                              fontWeight: isBest ? '800' : '600',
                            },
                          ]}
                        >
                          {formatTime(attempt.elapsedSeconds)}
                        </Text>
                      </View>

                      {/* Mode & Mistakes */}
                      <View style={styles.modeCol}>
                        {attempt.mode === 'challenge' ? (
                          <View style={styles.modeBadgeRow}>
                            <AlambreIcons.Zap
                              color={theme.warning}
                              lineWidth={2}
                              style={{ width: 11, height: 11 }}
                            />
                            <Text style={[styles.modeDescText, { color: theme.warning }]}>
                              {lang.history.challengeMode} • {attempt.mistakesCount} {attempt.mistakesCount === 1 ? 'fallo' : 'fallos'}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.modeBadgeRow}>
                            <AlambreIcons.Leaf
                              color={theme.color}
                              lineWidth={2}
                              style={{ width: 11, height: 11 }}
                            />
                            <Text style={[styles.modeDescText, { color: theme.muted }]}>
                              {lang.history.zenMode}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Date */}
                      <Text style={[styles.dateColText, { color: theme.muted }]}>
                        {formattedDate}
                      </Text>
                    </View>
                  );
                })}

                {/* Show More / Show Less Toggle */}
                {hasMore && (
                  <Pressable
                    onPress={() => toggleExpanded(group.puzzleId)}
                    style={[styles.expandBtn, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.expandBtnText, { color: theme.primary }]}>
                      {isExpanded
                        ? lang.history.showLess
                        : `${lang.history.showMore} (${group.attempts.length - 3} ${lang.history.plays})`}
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Replay Button */}
              <AppButton onPress={() => handleReplay(group)}>
                <View style={styles.buttonInnerRow}>
                  <AlambreIcons.Refresh
                    color={theme.primary}
                    lineWidth={2}
                    style={{ width: 14, height: 14 }}
                  />
                  <Text style={[styles.replayButtonText, { color: theme.primary }]}>
                    {lang.history.replay}
                  </Text>
                </View>
              </AppButton>
            </View>
          );
        })}
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 8,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryItem: {
    alignItems: 'center',
    gap: 2,
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 32,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: 12,
  },
  recordsList: {
    gap: 12,
  },
  recordCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  recordSubtitle: {
    fontSize: 11,
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  attemptsList: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  attemptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
  },
  rankCol: {
    width: 32,
    alignItems: 'center',
  },
  trophyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankText: {
    fontSize: 11,
  },
  timeCol: {
    minWidth: 55,
  },
  timeText: {
    fontSize: 13,
  },
  modeCol: {
    flex: 1,
  },
  modeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeDescText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateColText: {
    fontSize: 10,
  },
  expandBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  expandBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  replayButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

