import type { DefaultReact } from 'alambre';
import type { TextStyle } from 'react-native';
import { Pressable } from 'react-native';
import { View } from '../../../base';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import AnimadoText from 'src/components/animations/animado/AnimadoText';

type BorderButtonProps = DefaultReact.ViewProps & {
  label: string,
  textStyle: TextStyle,
};

export default ({ label, textStyle, ...props }: BorderButtonProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View {...props}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.75); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <AnimadoText text={label} style={[textStyle, animatedStyle]} />
      </Pressable>
    </View>
  );
};

