import { describe, it, expect } from "vitest";
import React from 'react';
import { View, Text } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { StepFlow, useStepFlow } from '../../src/components/spatial/step-flow';

describe('StepFlow', () => {
  const FlowConsumer = ({ testId }: { testId: string }) => {
    const { next, prev, goTo, currentStepIndex, isComplete, totalSteps } = useStepFlow();
    return (
      <View testID={testId}>
        <Text testID={`${testId}-current`}>{currentStepIndex}</Text>
        <Text testID={`${testId}-total`}>{totalSteps}</Text>
        <Text testID={`${testId}-complete`}>{String(isComplete)}</Text>
        <Text testID={`${testId}-next`} onPress={next}>Next</Text>
        <Text testID={`${testId}-prev`} onPress={prev}>Prev</Text>
        <Text testID={`${testId}-goto`} onPress={() => goTo(2)}>Go To 2</Text>
      </View>
    );
  };

  it('renders initial step and allows progression forward and backward', async () => {
    const { getByTestId } = await render(
      <StepFlow.Root totalSteps={4}>
        <StepFlow.Stage>
          <FlowConsumer testId="flow" />
        </StepFlow.Stage>
      </StepFlow.Root>
    );
    
    expect(getByTestId('flow-current').props.children).toBe(0);
    expect(getByTestId('flow-total').props.children).toBe(4);
    expect(getByTestId('flow-complete').props.children).toBe('false');

    await act(async () => { fireEvent.press(getByTestId('flow-next')); });
    expect(getByTestId('flow-current').props.children).toBe(1);

    await act(async () => { fireEvent.press(getByTestId('flow-next')); });
    expect(getByTestId('flow-current').props.children).toBe(2);

    await act(async () => { fireEvent.press(getByTestId('flow-prev')); });
    expect(getByTestId('flow-current').props.children).toBe(1);
    
    await act(async () => { fireEvent.press(getByTestId('flow-goto')); });
    expect(getByTestId('flow-current').props.children).toBe(2);
  });
});
