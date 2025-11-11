import { Title, View } from '@base';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigator } from '@providers';

export default () => {
  const { navigate } = useNavigator();
  return (
    <View style={styles.container}>
      <Title style={styles.title}>Advance</Title>
      <Pressable style={styles.press} onPress={() => navigate('play', { subpage: 'configuratison' })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  title: {
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  press: {
    backgroundColor: 'blue',
    height: 200,
    aspectRatio: 2,
  },
});
