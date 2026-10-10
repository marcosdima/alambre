import { createContext, useContext } from 'react';

export type StepFlowDirection = 'forward' | 'backward' | 'none';

export type StepFlowContextType = {
  currentStepIndex: number;
  direction: StepFlowDirection;
  totalSteps: number;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  isGated: boolean;
  setGated: (gated: boolean) => void;
  isComplete: boolean;
};

export const StepFlowContext = createContext<StepFlowContextType | null>(null);

export function useStepFlowContext() {
  const ctx = useContext(StepFlowContext);
  if (!ctx) {
    throw new Error('StepFlow components must be used within a StepFlow.Root');
  }
  return ctx;
}
