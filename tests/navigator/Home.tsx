import { Title, View } from '@base';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigator } from '@providers';
import Arrow from 'src/components/icons/Arrow';

export default () => {
  const { navigate } = useNavigator();
  return (
    <View style={styles.container}>
      <Title style={styles.title}>Home</Title>
      <Pressable style={styles.press} onPress={() => navigate('play')} />
      <Arrow color='red' lineWidth={10} rotate={180} style={{
        width: 100,
        height: 100,
      }}/>
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
