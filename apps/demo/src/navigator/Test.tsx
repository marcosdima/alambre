import { SafeAreaView } from 'alambre';
import { StyleSheet } from 'react-native';
import {
  BounceInLeft,
  BounceInRight,
  BounceOutLeft,
  BounceOutRight,
  Easing,
} from 'react-native-reanimated';
import { NavigatorBody } from 'alambre';
import { useNavigator } from 'alambre';
import { useLightDark } from '../providers/theme';

export default () => {
  const { theme } = useLightDark();
  //const [val,setVal] = useState(0);
  return (
    <SafeAreaView style={styles.container}>
      <NavigatorBody
        style={styles.container}
        arrowColor={theme.primary}
        animations={{
          go: {
            pageEntering: BounceInRight.duration(800).delay(400).easing(Easing.ease),
            pageExiting: BounceOutLeft.duration(600).easing(Easing.ease),
          },
          return: {
            pageEntering: BounceInLeft.duration(800).delay(400).easing(Easing.ease),
            pageExiting: BounceOutRight.duration(800).easing(Easing.ease),
          },
        }}
        useNavigator={useNavigator}
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
