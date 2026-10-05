import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import {
  Easing,
  FadeInLeft,
  FadeInRight,
} from 'react-native-reanimated';
import { useNavigator } from 'alambre';
import type { Page } from 'alambre';
import { useLightDark } from '../providers/theme';
import { useLang } from '../providers/lang';
import { useRouteIntent } from './RouteIntent';
import { pages, type PageTitle } from './navigator';
import AppNavigatorBody from './AppNavigatorBody';
import { NotificationsWatcher } from '../notifications/NotificationsWatcher';
import ActivationOverlay from '../checklist/ActivationOverlay';

const resolvePageTitle = (
  page: Page,
  editing: boolean,
): PageTitle | undefined => {
  for (const entry of Object.values(pages)) {
    if (entry === page) return entry.title;
    if (entry.subpages) {
      for (const sub of Object.values(entry.subpages)) {
        if (sub === page) {
          if (sub.title) return sub.title;
          if (sub.titles) return editing ? sub.titles.edit : sub.titles.add;
        }
      }
    }
  }

  return undefined;
};

export default () => {
  const { theme } = useLightDark();
  const { currentLang } = useLang();
  const { currentPage } = useNavigator();
  const { intent } = useRouteIntent();

  const title = resolvePageTitle(currentPage, intent.alarmId !== undefined || intent.itemId !== undefined);
  const headerTitle = title?.[currentLang];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <AppNavigatorBody
        style={styles.container}
        arrowColor={theme.primary}
        arrowBackgroundColor={theme.overlayBar}
        arrowBorderColor={theme.border}
        headerStyle={{ backgroundColor: theme.overlayBar }}
        titleColor={theme.color}
        headerTitle={headerTitle}
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
