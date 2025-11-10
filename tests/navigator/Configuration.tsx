import { Title } from '@base';
import { StyleSheet } from 'react-native';

export default () => {
  return (
    <Title style={styles.container}>Config</Title>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});
