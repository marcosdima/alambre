import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

export interface StaggerOptions {
  /**
   * Base delay before the first item starts animating (in ms).
   * @default 60
   */
  initialDelay?: number;
  /**
   * Delay interval between consecutive items (in ms).
   * @default 50
   */
  staggerMs?: number;
  /**
   * Optional maximum delay to prevent excessively long waits in long lists (in ms).
   * @default 500
   */
  maxDelay?: number;
  /**
   * Optional batch size to group items and pace concurrent animations.
   */
  batchSize?: number;
  /**
   * Optional interval between batches (in ms).
   */
  batchIntervalMs?: number;
}

export interface StaggerContextValue {
  getDelay: (index: number) => number;
  isReducedMotion: boolean;
}

const StaggerContext = createContext<StaggerContextValue | null>(null);

/**
 * Pure calculation for stagger delay.
 * Returns 0 if reduced motion is enabled to prevent unnatural staggered stalls.
 */
export function calculateStaggerDelay(
  index: number,
  options: StaggerOptions = {},
  isReducedMotion = false,
): number {
  if (isReducedMotion) return 0;
  const { initialDelay = 60, staggerMs = 50, maxDelay = 500 } = options;
  return Math.min(maxDelay, Math.max(0, initialDelay + index * staggerMs));
}

/**
 * Calculates a frame-budgeted stagger delay that paces concurrent animations into
 * bounded waves, preventing thread overload when many items mount simultaneously.
 */
export function calculateBudgetedStaggerDelay(
  index: number,
  options: StaggerOptions = {},
  isReducedMotion = false,
): number {
  if (isReducedMotion) return 0;
  const {
    initialDelay = 60,
    staggerMs = 45,
    maxDelay = 600,
    batchSize = 4,
    batchIntervalMs,
  } = options;

  if (batchSize > 0) {
    const batchIndex = Math.floor(index / batchSize);
    const inBatchIndex = index % batchSize;
    const interval = batchIntervalMs ?? Math.max(120, batchSize * staggerMs * 0.8);
    const delay = initialDelay + batchIndex * interval + inBatchIndex * (staggerMs * 0.4);
    return Math.min(maxDelay, Math.max(0, Math.round(delay)));
  }

  return calculateStaggerDelay(index, options, isReducedMotion);
}


/**
 * Headless hook that provides stagger delay calculations for a group of elements.
 * Automatically accounts for user reduced-motion preferences.
 */
export function useStagger(options: StaggerOptions = {}): StaggerContextValue {
  const isReducedMotion = useReducedMotion();

  const initialDelay = options.initialDelay ?? 60;
  const staggerMs = options.staggerMs ?? 50;
  const maxDelay = options.maxDelay ?? 500;

  const getDelay = useCallback(
    (index: number) => calculateStaggerDelay(index, { initialDelay, staggerMs, maxDelay }, isReducedMotion),
    [initialDelay, staggerMs, maxDelay, isReducedMotion],
  );

  return useMemo(
    () => ({ getDelay, isReducedMotion }),
    [getDelay, isReducedMotion],
  );
}

export interface StaggerProviderProps extends StaggerOptions {
  children: ReactNode;
}

/**
 * Optional Context Provider to propagate stagger timing down a deep component tree.
 */
export function StaggerProvider({ children, ...options }: StaggerProviderProps) {
  const value = useStagger(options);
  return <StaggerContext.Provider value={value}>{children}</StaggerContext.Provider>;
}

/**
 * Hook to consume stagger delay from an ancestor StaggerProvider.
 * Falls back to a local calculation if no provider is present.
 */
export function useStaggerItem(index: number, localOptions?: StaggerOptions): number {
  const context = useContext(StaggerContext);
  const local = useStagger(localOptions);

  const active = context ?? local;
  return active.getDelay(index);
}
