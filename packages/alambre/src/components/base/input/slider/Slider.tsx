import type { ReactNode } from 'react';
import { createContext, useContext, useRef, useState } from 'react';
import type {
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { kinetics } from '../../../../core/kinetics';
import { useSlider } from './use-slider';
import type { SliderOptions, SliderState } from './use-slider';

const SliderContext = createContext<SliderState | null>(null);

function useSliderContext() {
  const context = useContext(SliderContext);
  if (!context) {
    throw new Error('Slider compound components cannot be rendered outside the Slider.Root component');
  }
  return context;
}

export type SliderRootProps = Omit<ViewProps, 'style' | 'children'> &
  SliderOptions & {
    style?: StyleProp<ViewStyle> | ((state: SliderState) => StyleProp<ViewStyle>);
    children?: ReactNode | ((state: SliderState) => ReactNode);
  };

const Root = ({
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
}: SliderRootProps) => {
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

  const handleResponderGrant = (evt: GestureResponderEvent) => {
    sliderState.setIsPressed(true);
    handleTouch(evt.nativeEvent.locationX);
  };

  const handleResponderMove = (evt: GestureResponderEvent) => {
    handleTouch(evt.nativeEvent.locationX);
  };

  const handleResponderRelease = (evt: GestureResponderEvent) => {
    sliderState.setIsPressed(false);
    handleTouch(evt.nativeEvent.locationX);
  };

  const handleResponderTerminate = () => {
    sliderState.setIsPressed(false);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0) {
      trackWidthRef.current = width;
      setTrackWidth(width);
    }
  };

  return (
    <SliderContext.Provider value={sliderState}>
      <View
        {...props}
        collapsable={false}
        onStartShouldSetResponder={() => !disabledRef.current}
        onMoveShouldSetResponder={() => !disabledRef.current}
        onResponderTerminationRequest={() => false}
        onResponderGrant={handleResponderGrant}
        onResponderMove={handleResponderMove}
        onResponderRelease={handleResponderRelease}
        onResponderTerminate={handleResponderTerminate}
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
    </SliderContext.Provider>
  );
};

export type SliderComponentProps = Omit<ViewProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: SliderState) => StyleProp<ViewStyle>);
};

const Track = ({ style, ...props }: SliderComponentProps) => {
  const state = useSliderContext();
  return <View {...props} style={typeof style === 'function' ? style(state) : style} />;
};

const Range = ({ style, ...props }: SliderComponentProps) => {
  const state = useSliderContext();
  return <View {...props} style={typeof style === 'function' ? style(state) : style} />;
};

const Thumb = ({ style, ...props }: SliderComponentProps) => {
  const state = useSliderContext();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(state.isPressed ? 1.2 : 1.0, kinetics.spring.snappy),
        },
      ],
    };
  }, [state.isPressed]);

  return (
    <Animated.View
      {...props}
      style={[
        typeof style === 'function' ? style(state) : style,
        animatedStyle,
      ]}
    />
  );
};

export const Slider = Object.assign(Root, { Root, Track, Range, Thumb });
export default Slider;
