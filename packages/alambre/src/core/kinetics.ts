import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

export function rubberBandFriction(overscroll: number, constant: number = 0.55): number {
  'worklet';
  return overscroll * constant;
}

export const kinetics = {
  spring: {
    snappy: { damping: 20, mass: 1, stiffness: 250 } as WithSpringConfig,
    bouncy: { damping: 14, mass: 1, stiffness: 150 } as WithSpringConfig,
    gentle: { damping: 25, mass: 1, stiffness: 100 } as WithSpringConfig,
    stiff: { damping: 20, mass: 1, stiffness: 300 } as WithSpringConfig,
  },
  timing: {
    fast: { duration: 150 } as WithTimingConfig,
    base: { duration: 250 } as WithTimingConfig,
    slow: { duration: 350 } as WithTimingConfig,
  },
  friction: {
    rubberBand: rubberBandFriction,
  },
};
