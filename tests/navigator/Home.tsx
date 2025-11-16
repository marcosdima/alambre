import { Title } from 'src/components/base';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigator } from 'src/providers';
import { useLightDark } from 'tests/theme/theme';
import { ToggleLightDark } from 'src';
import BorderButton from 'src/components/base/input/button/BorderButton';
import AnimadoView from 'src/components/animations/animado/AnimadoView';
import { withTiming } from 'react-native-reanimated';

export default () => {
  const { navigate } = useNavigator();
  const { toggleTheme, theme: { color, background }, currThemeName } = useLightDark();
  return (
    <AnimadoView
      animation={(v: number) => withTiming(v, { duration: 2000 })}
      style={[styles.container, { backgroundColor: background }]}
    >
      <Title style={styles.title}>Home</Title>
      <Pressable style={styles.press} onPress={() => navigate('play')} />
      <ToggleLightDark
        toggle={toggleTheme}
        style={{ height: 100, aspectRatio: 3 }}
        setLeft={currThemeName === 'light'}
      />
      <BorderButton
        style={{ width: 100  }}
        label='Button'
        textStyle={{
          borderRadius: 15,
          borderWidth: 2,
          borderColor: color,
          padding: '5%',
          textAlign: 'center',
          color,
        }}
      />
    </AnimadoView>
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
