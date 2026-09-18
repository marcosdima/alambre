import type { Clue, ClueRelation, PuzzleDefinition, SolutionTuple } from './types';

export type SolverStatus = 'valid' | 'ambiguous' | 'invalid';

export interface SolverResult {
  status: SolverStatus;
  solutionsCount: number;
  solutions: SolutionTuple[][];
  matchesDeclaredSolution: boolean;
  message: string;
}

export const permutations = <T>(arr: T[]): T[][] => {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += 1) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const subPerms = permutations(remaining);
    for (const p of subPerms) {
      result.push([current, ...p]);
    }
  }
  return result;
};

export const compareSolutionTuples = (
  solA: SolutionTuple[],
  solB: SolutionTuple[],
): boolean => {
  if (solA.length !== solB.length) return false;

  return solA.every((tupleA) =>
    solB.some((tupleB) => {
      const keysA = Object.keys(tupleA);
      const keysB = Object.keys(tupleB);
      if (keysA.length !== keysB.length) return false;
      return keysA.every((k) => tupleA[k] === tupleB[k]);
    }),
  );
};

const isClueSatisfied = (
  relation: ClueRelation,
  tuples: SolutionTuple[],
): boolean => {
  const { type, catAId, itemAId, catBId, itemBId } = relation;

  // If both categories are not yet assigned in the tuples, cannot violate yet
  if (!(catAId in tuples[0]) || !(catBId in tuples[0])) {
    return true;
  }

  // Find tuple containing itemAId in catA
  const tupleWithA = tuples.find((t) => t[catAId] === itemAId);
  if (tupleWithA) {
    if (type === 'is' && tupleWithA[catBId] !== itemBId) return false;
    if (type === 'isNot' && tupleWithA[catBId] === itemBId) return false;
  }

  // Find tuple containing itemBId in catB
  const tupleWithB = tuples.find((t) => t[catBId] === itemBId);
  if (tupleWithB) {
    if (type === 'is' && tupleWithB[catAId] !== itemAId) return false;
    if (type === 'isNot' && tupleWithB[catAId] === itemAId) return false;
  }

  return true;
};

export const solvePuzzle = (
  puzzle: Pick<PuzzleDefinition, 'categories' | 'clues'> & {
    solutionTuples?: SolutionTuple[];
  },
  maxSolutions = 2,
): SolverResult => {
  const { categories, clues, solutionTuples } = puzzle;

  if (categories.length < 2) {
    return {
      status: 'invalid',
      solutionsCount: 0,
      solutions: [],
      matchesDeclaredSolution: false,
      message: 'Se requieren al menos 2 categorías.',
    };
  }

  const itemsCount = categories[0]?.items.length ?? 0;
  if (itemsCount < 2) {
    return {
      status: 'invalid',
      solutionsCount: 0,
      solutions: [],
      matchesDeclaredSolution: false,
      message: 'Cada categoría debe tener al menos 2 elementos.',
    };
  }

  const hasUnequalCategories = categories.some((c) => c.items.length !== itemsCount);
  if (hasUnequalCategories) {
    return {
      status: 'invalid',
      solutionsCount: 0,
      solutions: [],
      matchesDeclaredSolution: false,
      message: 'Todas las categorías deben tener la misma cantidad de elementos.',
    };
  }

  const structuredClues = clues.filter(
    (c): c is Clue & { relation: ClueRelation } => Boolean(c.relation),
  );

  const anchorCat = categories[0];
  const initialTuples: SolutionTuple[] = anchorCat.items.map((item) => ({
    [anchorCat.id]: item.id,
  }));

  const foundSolutions: SolutionTuple[][] = [];

  const search = (catIndex: number, currentTuples: SolutionTuple[]) => {
    if (foundSolutions.length >= maxSolutions) return;

    if (catIndex === categories.length) {
      // Check all clues
      const allPassed = structuredClues.every((c) =>
        isClueSatisfied(c.relation, currentTuples),
      );
      if (allPassed) {
        foundSolutions.push(currentTuples.map((t) => ({ ...t })));
      }
      return;
    }

    const currentCat = categories[catIndex];
    const perms = permutations(currentCat.items.map((it) => it.id));

    for (const perm of perms) {
      const nextTuples = currentTuples.map((t, idx) => ({
        ...t,
        [currentCat.id]: perm[idx],
      }));

      // Early pruning: check clues relevant to already assigned categories
      const canPrune = !structuredClues.every((c) =>
        isClueSatisfied(c.relation, nextTuples),
      );

      if (!canPrune) {
        search(catIndex + 1, nextTuples);
        if (foundSolutions.length >= maxSolutions) return;
      }
    }
  };

  search(1, initialTuples);

  const solutionsCount = foundSolutions.length;

  if (solutionsCount === 0) {
    return {
      status: 'invalid',
      solutionsCount: 0,
      solutions: [],
      matchesDeclaredSolution: false,
      message: 'No existe ninguna solución válida (las pistas son contradictorias).',
    };
  }

  if (solutionsCount > 1) {
    return {
      status: 'ambiguous',
      solutionsCount,
      solutions: foundSolutions,
      matchesDeclaredSolution: false,
      message: 'Existen múltiples soluciones posibles (faltan pistas para determinar una solución única).',
    };
  }

  // Exactly 1 solution found
  const uniqueSolution = foundSolutions[0];
  const matchesDeclared = solutionTuples && solutionTuples.length > 0
    ? compareSolutionTuples(uniqueSolution, solutionTuples)
    : true;

  if (solutionTuples && solutionTuples.length > 0 && !matchesDeclared) {
    return {
      status: 'invalid',
      solutionsCount: 1,
      solutions: foundSolutions,
      matchesDeclaredSolution: false,
      message: 'La solución única deducida no coincide con la solución declarada.',
    };
  }

  return {
    status: 'valid',
    solutionsCount: 1,
    solutions: foundSolutions,
    matchesDeclaredSolution: true,
    message: '¡El acertijo tiene solución única y coincide con la solución declarada!',
  };
};
