import { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { AlambreIcons, useNavigator, useToast } from 'alambre';
import type {
  Category,
  Clue,
  ClueRelationType,
  Difficulty,
  SolutionTuple,
} from '../../domain/types';
import { solvePuzzle, type SolverResult } from '../../domain/solver';
import { usePuzzles } from '../../session/puzzles-context';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import AppButton from '../../components/AppButton';

const DEFAULT_CATEGORY_NAMES = ['Personas', 'Mascotas', 'Bebidas', 'Ciudades'];
const DEFAULT_ITEM_NAMES = [
  ['Ana', 'Beto', 'Clara', 'David'],
  ['Perro', 'Gato', 'Loro', 'Pez'],
  ['Café', 'Té', 'Jugo', 'Agua'],
  ['Roma', 'París', 'Tokio', 'Lima'],
];

export default function PuzzleCreator() {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { navigate } = useNavigator();
  const { show } = useToast();
  const { savePuzzle } = usePuzzles();

  const [activeStep, setActiveStep] = useState(1);

  // Step 1: Info & Dimensions
  const [title, setTitle] = useState('Mi Acertijo');
  const [story, setStory] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [catCount, setCatCount] = useState<3 | 4>(3);
  const [itemCount, setItemCount] = useState<3 | 4>(3);

  // Step 2: Categories & Items
  const [categories, setCategories] = useState<Category[]>(() => {
    return Array.from({ length: 3 }, (_, cIdx) => ({
      id: `cat-${cIdx}`,
      name: DEFAULT_CATEGORY_NAMES[cIdx] ?? `Categoría ${cIdx + 1}`,
      items: Array.from({ length: 3 }, (_, iIdx) => ({
        id: `cat-${cIdx}-item-${iIdx}`,
        name: DEFAULT_ITEM_NAMES[cIdx]?.[iIdx] ?? `Ítem ${iIdx + 1}`,
      })),
    }));
  });

  // Adjust categories structure when catCount or itemCount changes
  useEffect(() => {
    setCategories((prev) => {
      return Array.from({ length: catCount }, (_, cIdx) => {
        const existingCat = prev[cIdx];
        const catId = existingCat?.id ?? `cat-${cIdx}`;
        const catName =
          existingCat?.name ?? DEFAULT_CATEGORY_NAMES[cIdx] ?? `Categoría ${cIdx + 1}`;

        const items = Array.from({ length: itemCount }, (_, iIdx) => {
          const existingItem = existingCat?.items[iIdx];
          return {
            id: existingItem?.id ?? `${catId}-item-${iIdx}`,
            name:
              existingItem?.name ??
              DEFAULT_ITEM_NAMES[cIdx]?.[iIdx] ??
              `Ítem ${iIdx + 1}`,
          };
        });

        return { id: catId, name: catName, items };
      });
    });
  }, [catCount, itemCount]);

  // Step 3: Solution tuples
  // Map anchor item (cat 0 item i) -> { [otherCatId]: otherItemId }
  const [solutionTuples, setSolutionTuples] = useState<SolutionTuple[]>([]);

  // Keep solutionTuples aligned with categories
  useEffect(() => {
    if (categories.length < 2) return;
    const anchorCat = categories[0];
    setSolutionTuples((prev) => {
      return anchorCat.items.map((anchorItem, iIdx) => {
        const existing = prev.find((t) => t[anchorCat.id] === anchorItem.id);
        const tuple: SolutionTuple = { [anchorCat.id]: anchorItem.id };

        for (let c = 1; c < categories.length; c += 1) {
          const otherCat = categories[c];
          const chosenItemId =
            existing?.[otherCat.id] &&
            otherCat.items.some((it) => it.id === existing[otherCat.id])
              ? existing[otherCat.id]
              : (otherCat.items[iIdx]?.id ?? otherCat.items[0]?.id);
          tuple[otherCat.id] = chosenItemId;
        }

        return tuple;
      });
    });
  }, [categories]);

  // Step 4: Structured clues
  const [clues, setClues] = useState<Clue[]>([]);

  // Clue builder state
  const [clueCatAId, setClueCatAId] = useState<string>('');
  const [clueItemAId, setClueItemAId] = useState<string>('');
  const [clueRelationType, setClueRelationType] = useState<ClueRelationType>('is');
  const [clueCatBId, setClueCatBId] = useState<string>('');
  const [clueItemBId, setClueItemBId] = useState<string>('');
  const [customClueText, setCustomClueText] = useState<string>('');
  const [editingClueId, setEditingClueId] = useState<string | null>(null);
  const [editingClueText, setEditingClueText] = useState<string>('');

  // Set default clue selections
  useEffect(() => {
    if (categories.length >= 2) {
      const catA = categories[0];
      const catB = categories[1];
      setClueCatAId(catA.id);
      setClueItemAId(catA.items[0]?.id ?? '');
      setClueCatBId(catB.id);
      setClueItemBId(catB.items[0]?.id ?? '');
    }
  }, [categories]);

  // Step 5: Solver validation
  const solverResult: SolverResult = useMemo(() => {
    return solvePuzzle({ categories, clues, solutionTuples });
  }, [categories, clues, solutionTuples]);

  const handleUpdateCategoryName = (cIdx: number, newName: string) => {
    setCategories((prev) =>
      prev.map((c, idx) => (idx === cIdx ? { ...c, name: newName } : c)),
    );
  };

  const handleUpdateItemName = (cIdx: number, iIdx: number, newName: string) => {
    setCategories((prev) =>
      prev.map((c, catI) => {
        if (catI !== cIdx) return c;
        return {
          ...c,
          items: c.items.map((it, itemI) =>
            itemI === iIdx ? { ...it, name: newName } : it,
          ),
        };
      }),
    );
  };

  const handleUpdateSolutionPair = (
    anchorItemId: string,
    targetCatId: string,
    selectedItemId: string,
  ) => {
    setSolutionTuples((prev) =>
      prev.map((t) => {
        const anchorCat = categories[0];
        if (t[anchorCat.id] === anchorItemId) {
          return { ...t, [targetCatId]: selectedItemId };
        }
        return t;
      }),
    );
  };

  const handleResetDefaultSolution = () => {
    const anchorCat = categories[0];
    const defaultTuples = anchorCat.items.map((anchorItem, iIdx) => {
      const tuple: SolutionTuple = { [anchorCat.id]: anchorItem.id };
      for (let c = 1; c < categories.length; c += 1) {
        tuple[categories[c].id] = categories[c].items[iIdx]?.id;
      }
      return tuple;
    });
    setSolutionTuples(defaultTuples);
  };

  const suggestedClueText = useMemo(() => {
    if (!clueCatAId || !clueItemAId || !clueCatBId || !clueItemBId) return '';
    const catA = categories.find((c) => c.id === clueCatAId);
    const itemA = catA?.items.find((i) => i.id === clueItemAId);
    const catB = categories.find((c) => c.id === clueCatBId);
    const itemB = catB?.items.find((i) => i.id === clueItemBId);
    if (!itemA || !itemB) return '';
    return clueRelationType === 'is'
      ? `${itemA.name} se relaciona con ${itemB.name}.`
      : `${itemA.name} NO se relaciona con ${itemB.name}.`;
  }, [categories, clueCatAId, clueItemAId, clueRelationType, clueCatBId, clueItemBId]);

  const handleAddClue = () => {
    if (!clueCatAId || !clueItemAId || !clueCatBId || !clueItemBId) return;
    if (clueCatAId === clueCatBId) return;

    const catA = categories.find((c) => c.id === clueCatAId);
    const itemA = catA?.items.find((i) => i.id === clueItemAId);
    const catB = categories.find((c) => c.id === clueCatBId);
    const itemB = catB?.items.find((i) => i.id === clueItemBId);

    if (!itemA || !itemB) return;

    const relationText =
      customClueText.trim() ||
      (clueRelationType === 'is'
        ? `${itemA.name} se relaciona con ${itemB.name}.`
        : `${itemA.name} NO se relaciona con ${itemB.name}.`);

    const newClue: Clue = {
      id: `clue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: relationText,
      relation: {
        type: clueRelationType,
        catAId: clueCatAId,
        itemAId: clueItemAId,
        catBId: clueCatBId,
        itemBId: clueItemBId,
      },
    };

    setClues((prev) => [...prev, newClue]);
    setCustomClueText('');
    setClueItemBId('');
  };

  const handleStartEditClue = (clue: Clue) => {
    setEditingClueId(clue.id);
    setEditingClueText(clue.text);
  };

  const handleSaveEditedClue = (clueId: string) => {
    const trimmed = editingClueText.trim();
    if (trimmed) {
      setClues((prev) =>
        prev.map((c) => (c.id === clueId ? { ...c, text: trimmed } : c)),
      );
    }
    setEditingClueId(null);
    setEditingClueText('');
  };

  const handleCancelEditClue = () => {
    setEditingClueId(null);
    setEditingClueText('');
  };

  const handleRemoveClue = (clueId: string) => {
    setClues((prev) => prev.filter((c) => c.id !== clueId));
  };

  const handleSavePuzzle = async () => {
    if (solverResult.status !== 'valid') return;

    const newPuzzle = {
      id: `puzzle-custom-${Date.now()}`,
      title: title.trim() || 'Puzzle Personalizado',
      difficulty,
      story: story.trim() || undefined,
      author: 'user' as const,
      categories,
      clues,
      solutionTuples,
    };

    await savePuzzle(newPuzzle);
    show({
      payload: lang.creator.savedSuccess,
      duration: 3000,
    });
    navigate('gameSelect');
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Steps Navigation Bar */}
      <View style={styles.stepsBar}>
        {[1, 2, 3, 4, 5].map((step) => {
          const isActive = activeStep === step;
          return (
            <Pressable
              key={step}
              onPress={() => setActiveStep(step)}
              style={[
                styles.stepTab,
                {
                  backgroundColor: isActive ? theme.primarySoft : theme.surface,
                  borderColor: isActive ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.stepTabText,
                  {
                    color: isActive ? theme.primary : theme.muted,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {step}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* STEP 1: Info & Dimensions */}
      {activeStep === 1 && (
        <View style={[styles.stepCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.stepHeading, { color: theme.color }]}>
            {lang.creator.step1}
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.muted }]}>
              {lang.creator.puzzleTitle}
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={lang.creator.puzzleTitlePlaceholder}
              placeholderTextColor={theme.muted}
              style={[
                styles.input,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                  color: theme.color,
                },
              ]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.muted }]}>
              {lang.creator.puzzleStory}
            </Text>
            <TextInput
              value={story}
              onChangeText={setStory}
              placeholder={lang.creator.puzzleStoryPlaceholder}
              placeholderTextColor={theme.muted}
              multiline
              numberOfLines={3}
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.border,
                  color: theme.color,
                },
              ]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.muted }]}>
              {lang.home.selectDifficulty}
            </Text>
            <View style={styles.segmentedRow}>
              {(['easy', 'medium', 'hard'] as const).map((diff) => {
                const isSelected = difficulty === diff;
                return (
                  <Pressable
                    key={diff}
                    onPress={() => setDifficulty(diff)}
                    style={[
                      styles.segmentBtn,
                      {
                        backgroundColor: isSelected ? theme.primarySoft : theme.surfaceAlt,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        {
                          color: isSelected ? theme.primary : theme.color,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {diff}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.muted }]}>
              {lang.creator.categoriesCount} (3 - 4)
            </Text>
            <View style={styles.segmentedRow}>
              {[3, 4].map((count) => {
                const isSelected = catCount === count;
                return (
                  <Pressable
                    key={count}
                    onPress={() => setCatCount(count as 3 | 4)}
                    style={[
                      styles.segmentBtn,
                      {
                        backgroundColor: isSelected ? theme.primarySoft : theme.surfaceAlt,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        {
                          color: isSelected ? theme.primary : theme.color,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {count} {lang.creator.categoriesCount}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.muted }]}>
              {lang.creator.itemsCount} (3 - 4)
            </Text>
            <View style={styles.segmentedRow}>
              {[3, 4].map((count) => {
                const isSelected = itemCount === count;
                return (
                  <Pressable
                    key={count}
                    onPress={() => setItemCount(count as 3 | 4)}
                    style={[
                      styles.segmentBtn,
                      {
                        backgroundColor: isSelected ? theme.primarySoft : theme.surfaceAlt,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        {
                          color: isSelected ? theme.primary : theme.color,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {count} {lang.creator.itemsCount}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <AppButton onPress={() => setActiveStep(2)}>
            <View style={styles.buttonWithIcon}>
              <Text style={{ color: theme.primary, fontWeight: '700' }}>
                Siguiente: Categorías
              </Text>
              <AlambreIcons.Arrow
                color={theme.primary}
                lineWidth={2.5}
                style={{ width: 14, height: 14 }}
                drawIt={true}
              />
            </View>
          </AppButton>
        </View>
      )}

      {/* STEP 2: Categories & Items */}
      {activeStep === 2 && (
        <View style={[styles.stepCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.stepHeading, { color: theme.color }]}>
            {lang.creator.step2}
          </Text>

          {categories.map((cat, cIdx) => (
            <View
              key={cat.id}
              style={[
                styles.categoryBox,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.categoryHeader, { color: theme.primary }]}>
                {lang.creator.categoryName} #{cIdx + 1}
              </Text>
              <TextInput
                value={cat.name}
                onChangeText={(val) => handleUpdateCategoryName(cIdx, val)}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.color,
                  },
                ]}
              />

              <Text style={[styles.label, { color: theme.muted, marginTop: 4 }]}>
                {lang.creator.itemName}s:
              </Text>

              {cat.items.map((it, iIdx) => (
                <TextInput
                  key={it.id}
                  value={it.name}
                  onChangeText={(val) => handleUpdateItemName(cIdx, iIdx, val)}
                  style={[
                    styles.inputSmall,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.color,
                    },
                  ]}
                />
              ))}
            </View>
          ))}

          <View style={styles.navRow}>
            <AppButton style={{ flex: 1 }} onPress={() => setActiveStep(1)}>
              <View style={styles.buttonWithIcon}>
                <AlambreIcons.Arrow
                  color={theme.muted}
                  lineWidth={2.5}
                  rotation={180}
                  style={{ width: 14, height: 14 }}
                  drawIt={true}
                />
                <Text style={{ color: theme.muted, fontWeight: '600' }}>
                  Anterior
                </Text>
              </View>
            </AppButton>
            <AppButton style={{ flex: 1 }} onPress={() => setActiveStep(3)}>
              <View style={styles.buttonWithIcon}>
                <Text style={{ color: theme.primary, fontWeight: '700' }}>
                  Siguiente
                </Text>
                <AlambreIcons.Arrow
                  color={theme.primary}
                  lineWidth={2.5}
                  style={{ width: 14, height: 14 }}
                  drawIt={true}
                />
              </View>
            </AppButton>
          </View>
        </View>
      )}

      {/* STEP 3: Correct Solution */}
      {activeStep === 3 && (
        <View style={[styles.stepCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.stepTitleRow}>
            <Text style={[styles.stepHeading, { color: theme.color }]}>
              {lang.creator.step3}
            </Text>
            <Pressable onPress={handleResetDefaultSolution}>
              <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>
                {lang.creator.autoPair}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.instructionText, { color: theme.muted }]}>
            {lang.creator.solutionDesc}
          </Text>

          {categories.length >= 2 &&
            categories[0].items.map((anchorItem) => {
              const currentTuple = solutionTuples.find(
                (t) => t[categories[0].id] === anchorItem.id,
              );

              return (
                <View
                  key={anchorItem.id}
                  style={[
                    styles.tupleCard,
                    { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.anchorTitle, { color: theme.primary }]}>
                    {anchorItem.name} ({categories[0].name})
                  </Text>

                  {categories.slice(1).map((otherCat) => {
                    const selectedItemId = currentTuple?.[otherCat.id];
                    return (
                      <View key={otherCat.id} style={styles.pairPickerRow}>
                        <Text style={[styles.pairPickerLabel, { color: theme.muted }]}>
                          {otherCat.name}:
                        </Text>
                        <View style={styles.pairOptions}>
                          {otherCat.items.map((it) => {
                            const isSelected = selectedItemId === it.id;
                            return (
                              <Pressable
                                key={it.id}
                                onPress={() =>
                                  handleUpdateSolutionPair(
                                    anchorItem.id,
                                    otherCat.id,
                                    it.id,
                                  )
                                }
                                style={[
                                  styles.pairChip,
                                  {
                                    backgroundColor: isSelected
                                      ? theme.primarySoft
                                      : theme.surface,
                                    borderColor: isSelected
                                      ? theme.primary
                                      : theme.border,
                                  },
                                ]}
                              >
                                <Text
                                  style={{
                                    color: isSelected ? theme.primary : theme.color,
                                    fontSize: 11,
                                    fontWeight: isSelected ? '700' : '500',
                                  }}
                                >
                                  {it.name}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}

          <View style={styles.navRow}>
            <AppButton style={{ flex: 1 }} onPress={() => setActiveStep(2)}>
              <View style={styles.buttonWithIcon}>
                <AlambreIcons.Arrow
                  color={theme.muted}
                  lineWidth={2.5}
                  rotation={180}
                  style={{ width: 14, height: 14 }}
                  drawIt={true}
                />
                <Text style={{ color: theme.muted, fontWeight: '600' }}>
                  Anterior
                </Text>
              </View>
            </AppButton>
            <AppButton style={{ flex: 1 }} onPress={() => setActiveStep(4)}>
              <View style={styles.buttonWithIcon}>
                <Text style={{ color: theme.primary, fontWeight: '700' }}>
                  Siguiente
                </Text>
                <AlambreIcons.Arrow
                  color={theme.primary}
                  lineWidth={2.5}
                  style={{ width: 14, height: 14 }}
                  drawIt={true}
                />
              </View>
            </AppButton>
          </View>
        </View>
      )}

      {/* STEP 4: Structured Clues */}
      {activeStep === 4 && (
        <View style={[styles.stepCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.stepHeading, { color: theme.color }]}>
            {lang.creator.step4}
          </Text>

          {/* Clue Creator Tool */}
          <View style={[styles.clueBuilderBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.color, fontWeight: '700' }]}>
              {lang.creator.addClue}
            </Text>

            {/* Item A */}
            <View style={styles.builderRow}>
              <Text style={[styles.builderLabel, { color: theme.muted }]}>
                {lang.creator.clueItemA}:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.builderScroll}>
                {categories.map((c) =>
                  c.items.map((it) => {
                    const isSelected = clueItemAId === it.id;
                    return (
                      <Pressable
                        key={it.id}
                        onPress={() => {
                          setClueCatAId(c.id);
                          setClueItemAId(it.id);
                          // Auto pick different category for B if needed
                          if (clueCatBId === c.id) {
                            const other = categories.find((cat) => cat.id !== c.id);
                            if (other) {
                              setClueCatBId(other.id);
                              setClueItemBId(other.items[0]?.id ?? '');
                            }
                          }
                        }}
                        style={[
                          styles.builderChip,
                          {
                            backgroundColor: isSelected ? theme.primarySoft : theme.surface,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text style={{ color: isSelected ? theme.primary : theme.color, fontSize: 11 }}>
                          {it.name} ({c.name})
                        </Text>
                      </Pressable>
                    );
                  }),
                )}
              </ScrollView>
            </View>

            {/* Relation */}
            <View style={styles.builderRow}>
              <Text style={[styles.builderLabel, { color: theme.muted }]}>
                {lang.creator.clueRelation}:
              </Text>
              <View style={styles.relationToggleRow}>
                {(['is', 'isNot'] as const).map((rel) => {
                  const isSelected = clueRelationType === rel;
                  const label = rel === 'is' ? lang.creator.relationIs : lang.creator.relationIsNot;
                  return (
                    <Pressable
                      key={rel}
                      onPress={() => setClueRelationType(rel)}
                      style={[
                        styles.relationBtn,
                        {
                          backgroundColor: isSelected
                            ? rel === 'is'
                              ? theme.primarySoft
                              : theme.primarySoft
                            : theme.surface,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: isSelected ? theme.primary : theme.color,
                          fontWeight: isSelected ? '700' : '500',
                          fontSize: 12,
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Item B */}
            <View style={styles.builderRow}>
              <Text style={[styles.builderLabel, { color: theme.muted }]}>
                {lang.creator.clueItemB}:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.builderScroll}>
                {categories
                  .filter((c) => c.id !== clueCatAId)
                  .map((c) =>
                    c.items.map((it) => {
                      const isSelected = clueItemBId === it.id;
                      return (
                        <Pressable
                          key={it.id}
                          onPress={() => {
                            setClueCatBId(c.id);
                            setClueItemBId(it.id);
                          }}
                          style={[
                            styles.builderChip,
                            {
                              backgroundColor: isSelected ? theme.primarySoft : theme.surface,
                              borderColor: isSelected ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text style={{ color: isSelected ? theme.primary : theme.color, fontSize: 11 }}>
                            {it.name} ({c.name})
                          </Text>
                        </Pressable>
                      );
                    }),
                  )}
              </ScrollView>
            </View>

            {/* Customizable Clue Description */}
            <View style={styles.builderRow}>
              <Text style={[styles.builderLabel, { color: theme.muted }]}>
                {lang.creator.clueTextLabel}:
              </Text>
              <TextInput
                value={customClueText}
                onChangeText={setCustomClueText}
                placeholder={suggestedClueText || lang.creator.clueTextPlaceholder}
                placeholderTextColor={theme.muted}
                style={[
                  styles.input,
                  {
                    color: theme.color,
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                    fontSize: 13,
                    paddingVertical: 8,
                  },
                ]}
              />
              <Text style={{ color: theme.muted, fontSize: 10, fontStyle: 'italic' }}>
                {lang.creator.clueTextHint}
              </Text>
            </View>

            <AppButton onPress={handleAddClue}>
              <Text style={{ color: theme.primary, fontWeight: '700' }}>
                + {lang.creator.addClue}
              </Text>
            </AppButton>
          </View>

          {/* Clues List */}
          <View style={styles.cluesListContainer}>
            <Text style={[styles.label, { color: theme.color, fontWeight: '700' }]}>
              {lang.creator.cluesList} ({clues.length})
            </Text>

            {clues.length === 0 ? (
              <Text style={[styles.instructionText, { color: theme.muted }]}>
                {lang.creator.noClues}
              </Text>
            ) : (
              clues.map((clue, index) => (
                <View
                  key={clue.id}
                  style={[
                    styles.clueCard,
                    { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                  ]}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.clueIndex, { color: theme.primary }]}>
                      Pista #{index + 1}
                    </Text>

                    {editingClueId === clue.id ? (
                      <View style={{ gap: 6 }}>
                        <TextInput
                          value={editingClueText}
                          onChangeText={setEditingClueText}
                          style={[
                            styles.input,
                            {
                              color: theme.color,
                              borderColor: theme.primary,
                              backgroundColor: theme.surface,
                              fontSize: 13,
                              paddingVertical: 6,
                            },
                          ]}
                          autoFocus
                        />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Pressable
                            onPress={() => handleSaveEditedClue(clue.id)}
                            style={[styles.smallBtn, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
                          >
                            <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '700' }}>
                              {lang.creator.saveClue}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={handleCancelEditClue}
                            style={[styles.smallBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                          >
                            <Text style={{ color: theme.muted, fontSize: 11, fontWeight: '600' }}>
                              {lang.creator.cancelClue}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <Text style={[styles.clueText, { color: theme.color }]}>
                        {clue.text}
                      </Text>
                    )}
                  </View>

                  {editingClueId !== clue.id && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Pressable
                        onPress={() => handleStartEditClue(clue)}
                        style={styles.clueActionBtn}
                        accessibilityRole="button"
                        accessibilityLabel={lang.creator.editClue}
                      >
                        <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '600' }}>
                          {lang.creator.editClue}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleRemoveClue(clue.id)}
                        style={styles.clueDeleteBtn}
                        accessibilityRole="button"
                        accessibilityLabel="Eliminar pista"
                      >
                        <AlambreIcons.Cross
                          color={theme.danger}
                          lineWidth={2.5}
                          style={{ width: 14, height: 14 }}
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.navRow}>
            <AppButton style={{ flex: 1 }} onPress={() => setActiveStep(3)}>
              <View style={styles.buttonWithIcon}>
                <AlambreIcons.Arrow
                  color={theme.muted}
                  lineWidth={2.5}
                  rotation={180}
                  style={{ width: 14, height: 14 }}
                  drawIt={true}
                />
                <Text style={{ color: theme.muted, fontWeight: '600' }}>
                  Anterior
                </Text>
              </View>
            </AppButton>
            <AppButton style={{ flex: 1 }} onPress={() => setActiveStep(5)}>
              <View style={styles.buttonWithIcon}>
                <Text style={{ color: theme.primary, fontWeight: '700' }}>
                  Validar
                </Text>
                <AlambreIcons.Arrow
                  color={theme.primary}
                  lineWidth={2.5}
                  style={{ width: 14, height: 14 }}
                  drawIt={true}
                />
              </View>
            </AppButton>
          </View>
        </View>
      )}

      {/* STEP 5: Validation & Save */}
      {activeStep === 5 && (
        <View style={[styles.stepCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.stepHeading, { color: theme.color }]}>
            {lang.creator.step5}
          </Text>

          {/* Validation Status Banner */}
          <View
            style={[
              styles.statusBanner,
              {
                borderColor:
                  solverResult.status === 'valid'
                    ? theme.success
                    : solverResult.status === 'ambiguous'
                      ? theme.warning
                      : theme.danger,
                backgroundColor:
                  solverResult.status === 'valid'
                    ? theme.primarySoft
                    : solverResult.status === 'ambiguous'
                      ? theme.primarySoft
                      : theme.surfaceAlt,
              },
            ]}
          >
            <View style={styles.statusIconContainer}>
              {solverResult.status === 'valid' && (
                <AlambreIcons.CircleCheck
                  color={theme.success}
                  lineWidth={2.5}
                  style={{ width: 28, height: 28 }}
                  drawIt={true}
                />
              )}
              {solverResult.status === 'ambiguous' && (
                <AlambreIcons.TriangleAlert
                  color={theme.warning}
                  lineWidth={2.5}
                  style={{ width: 28, height: 28 }}
                  drawIt={true}
                />
              )}
              {solverResult.status === 'invalid' && (
                <AlambreIcons.CircleX
                  color={theme.danger}
                  lineWidth={2.5}
                  style={{ width: 28, height: 28 }}
                  drawIt={true}
                />
              )}
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={[
                  styles.statusTitle,
                  {
                    color:
                      solverResult.status === 'valid'
                        ? theme.success
                        : solverResult.status === 'ambiguous'
                          ? theme.warning
                          : theme.danger,
                  },
                ]}
              >
                {solverResult.status === 'valid'
                  ? 'Acertijo Válido'
                  : solverResult.status === 'ambiguous'
                    ? 'Acertijo Incompleto'
                    : 'Acertijo Inválido'}
              </Text>
              <Text style={[styles.statusDesc, { color: theme.color }]}>
                {solverResult.message}
              </Text>
              <Text style={[styles.statusMeta, { color: theme.muted }]}>
                Soluciones encontradas: {solverResult.solutionsCount}
              </Text>
            </View>
          </View>

          {/* Save Button */}
          {solverResult.status === 'valid' ? (
            <AppButton onPress={handleSavePuzzle}>
              <View style={styles.buttonWithIcon}>
                <AlambreIcons.Tick
                  color={theme.success}
                  lineWidth={3}
                  style={{ width: 18, height: 18 }}
                  drawIt={true}
                />
                <Text style={{ color: theme.success, fontWeight: '800', fontSize: 16 }}>
                  {lang.creator.savePuzzle}
                </Text>
              </View>
            </AppButton>
          ) : (
            <Text style={[styles.disabledWarning, { color: theme.muted }]}>
              Para poder guardar el puzzle, debe resolverse con solución única.
            </Text>
          )}

          <View style={styles.navRow}>
            <AppButton style={{ flex: 1 }} onPress={() => setActiveStep(4)}>
              <View style={styles.buttonWithIcon}>
                <AlambreIcons.Arrow
                  color={theme.muted}
                  lineWidth={2.5}
                  rotation={180}
                  style={{ width: 14, height: 14 }}
                  drawIt={true}
                />
                <Text style={{ color: theme.muted, fontWeight: '600' }}>
                  Modificar Pistas
                </Text>
              </View>
            </AppButton>
          </View>
        </View>
      )}
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
    paddingBottom: 40,
  },
  stepsBar: {
    flexDirection: 'row',
    gap: 8,
  },
  stepTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTabText: {
    fontSize: 14,
  },
  stepCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  stepHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  inputSmall: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnText: {
    fontSize: 12,
  },
  categoryBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  categoryHeader: {
    fontSize: 13,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  instructionText: {
    fontSize: 12,
    lineHeight: 16,
  },
  tupleCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  anchorTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pairPickerRow: {
    gap: 4,
  },
  pairPickerLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  pairOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pairChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  clueBuilderBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  builderRow: {
    gap: 4,
  },
  builderLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  builderScroll: {
    flexDirection: 'row',
  },
  builderChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  relationToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  relationBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cluesListContainer: {
    gap: 8,
  },
  clueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  clueIndex: {
    fontSize: 10,
    fontWeight: '700',
  },
  clueText: {
    fontSize: 13,
  },
  clueDeleteBtn: {
    padding: 6,
  },
  clueActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  smallBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 0.5,
    alignSelf: 'flex-start',
  },
  statusBanner: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  statusIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  statusDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusMeta: {
    fontSize: 11,
  },
  disabledWarning: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
