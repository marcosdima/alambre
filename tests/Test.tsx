import { SafeAreaView } from '@base';
import { StyleSheet } from 'react-native';
import { NavigatorBody } from '@providers';

export default () => {
  //const { theme, toggleTheme } = useLightDark();
  //const [val,setVal] = useState(0);
  return (
    <SafeAreaView style={styles.container}>
      <NavigatorBody
        style={styles.container}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(95, 95, 74, 0.13)',
  },
  toggle: {
    width: 210,
    height: 70,
  },
});
