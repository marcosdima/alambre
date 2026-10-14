import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import {
  Easing,
  FadeInLeft,
  FadeInRight,
} from 'react-native-reanimated';
import { useNavigator, NavigatorHost } from 'alambre';
import { useConfig } from '../providers/config';
import { useEffect } from 'react';
import { useLightDark } from '../providers/theme';
import { NotificationsWatcher } from '../notifications/NotificationsWatcher';
import ActivationOverlay from '../checklist/ActivationOverlay';

export default () => {
  const { theme } = useLightDark();
  const { navigate } = useNavigator();
  const { config: { tutorialCompleted }, loading } = useConfig();

  useEffect(() => {
    if (!loading && tutorialCompleted === 'false') {
      navigate('tutorial');
    }
  }, [loading, tutorialCompleted, navigate]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigatorHost
        style={styles.container}
        arrowColor={theme.primary}
        arrowBackgroundColor={theme.overlayBar}
        arrowBorderColor={theme.border}
        headerStyle={{ backgroundColor: theme.overlayBar }}
        titleColor={theme.color}
        headerTitle={undefined}
        animations={{
          go: {
            pageEntering: FadeInRight.duration(280).delay(40).easing(Easing.out(Easing.cubic)),
          },
          return: {
            pageEntering: FadeInLeft.duration(280).delay(40).easing(Easing.out(Easing.cubic)),
          },
        }}
        useNavigator={useNavigator}
      />
      <NotificationsWatcher />
      <ActivationOverlay />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
