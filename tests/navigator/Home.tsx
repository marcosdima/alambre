import { Title, View } from 'src/components/base';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigator } from 'src/providers';
import { useLightDark } from 'tests/theme/theme';
import { ToggleLightDark } from 'src';

export default () => {
  const { navigate } = useNavigator();
  const { toggleTheme } = useLightDark();
  return (
    <View style={styles.container}>
      <Title style={styles.title}>Home</Title>
      <Pressable style={styles.press} onPress={() => navigate('play')} />
      <ToggleLightDark toggle={toggleTheme} style={{ height: 100, aspectRatio: 3 }}/>
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
