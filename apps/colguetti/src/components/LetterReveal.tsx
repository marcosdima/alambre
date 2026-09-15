import type { StyleProp, TextStyle } from 'react-native';
import { Text } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

export default function LetterReveal({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  return (
    <Animated.View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
      {text.split('').map((char, index) => (
        <AnimatedText
          key={`${index}-${char}`}
          entering={FadeInDown.duration(280)
            .delay(index * 16)
            .easing(Easing.out(Easing.exp))}
          style={[{ fontSize: 24, fontWeight: 'bold' }, style]}
        >
          {char === ' ' ? '\u00A0' : char}
        </AnimatedText>
      ))}
    </Animated.View>
  );
}
