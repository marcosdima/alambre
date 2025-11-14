import { Title, View } from 'src/components/base';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigator } from 'src/providers';
import { useLightDark } from 'tests/theme/theme';
import { ToggleLightDark } from 'src';
import AnimadoText from 'src/components/animations/animado/AnimadoText';
import { withTiming } from 'react-native-reanimated';

export default () => {
  const { navigate } = useNavigator();
  const { toggleTheme, theme: { color, background }, currThemeName } = useLightDark();
  return (
    <View style={styles.container}>
      <Title style={styles.title}>Home</Title>
      <Pressable style={styles.press} onPress={() => navigate('play')} />
      <ToggleLightDark
        toggle={toggleTheme}
        style={{ height: 100, aspectRatio: 3 }}
        setLeft={currThemeName === 'light'}
      />
      <AnimadoText
        text='Casa de reina'
        animation={(v: number) => withTiming(v, { duration: 200 })}
        style={{
          backgroundColor: background,
          borderColor: color,
          color: color === 'black' ? 'red' : 'blue',
          borderWidth: 3,
          width: 100,
          aspectRatio: 1,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  title: {
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  press: {
    backgroundColor: 'blue',
    height: '20%',
    aspectRatio: 2,
  },
});
