import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import type {
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { View } from 'react-native';
import { useSlider } from './use-slider';
import type { SliderOptions, SliderState } from './use-slider';

export type SliderProps = Omit<ViewProps, 'style' | 'children'> &
  SliderOptions & {
    style?: StyleProp<ViewStyle> | ((state: SliderState) => StyleProp<ViewStyle>);
    children?: ReactNode | ((state: SliderState) => ReactNode);
  };

export default function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  onChange,
  style,
  children,
  accessibilityRole = 'adjustable',
  accessibilityValue,
  accessibilityState,
  accessibilityActions,
  onAccessibilityAction,
  ...props
}: SliderProps) {
  const sliderState = useSlider({ value, min, max, step, disabled, onChange });
  const [_trackWidth, setTrackWidth] = useState(0);

  const trackWidthRef = useRef(0);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const sliderStateRef = useRef(sliderState);
  sliderStateRef.current = sliderState;

  const handleTouch = (locationX: number) => {
    const width = trackWidthRef.current;
    if (disabledRef.current || width <= 0) {
      return;
    }
    const ratio = Math.max(0, Math.min(1, locationX / width));
    sliderStateRef.current.setValueFromRatio(ratio);
  };

  const handleTouchEvent = (evt: GestureResponderEvent) => {
    handleTouch(evt.nativeEvent.locationX);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0) {
      trackWidthRef.current = width;
      setTrackWidth(width);
    }
  };

  return (
    <View
      {...props}
      collapsable={false}
      onTouchStart={handleTouchEvent}
      onTouchMove={handleTouchEvent}
      onTouchEnd={handleTouchEvent}
      onStartShouldSetResponder={() => !disabledRef.current}
      onMoveShouldSetResponder={() => !disabledRef.current}
      onResponderTerminationRequest={() => false}
      onResponderGrant={handleTouchEvent}
      onResponderMove={handleTouchEvent}
      onResponderRelease={handleTouchEvent}
      onLayout={handleLayout}
      accessibilityRole={accessibilityRole}
      accessibilityValue={{
        min,
        max,
        now: value,
        ...accessibilityValue,
      }}
      accessibilityState={{
        disabled,
        ...accessibilityState,
      }}
      accessibilityActions={
        accessibilityActions || [{ name: 'increment' }, { name: 'decrement' }]
      }
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') {
          sliderState.increment();
        } else if (e.nativeEvent.actionName === 'decrement') {
          sliderState.decrement();
        }
        onAccessibilityAction?.(e);
      }}
      style={[
        { backgroundColor: 'transparent' },
        typeof style === 'function' ? style(sliderState) : style,
      ]}
    >
      {typeof children === 'function' ? children(sliderState) : children}
    </View>
  );
}
