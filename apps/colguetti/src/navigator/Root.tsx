import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import {
  Easing,
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
} from 'react-native-reanimated';
import { useNavigator } from 'alambre';
import type { NavigatorTypes } from 'alambre';
import { useLightDark } from '../providers/theme';
import { useLang } from '../providers/lang';
import { useRouteIntent } from './RouteIntent';
import { pages, type AppPage, type PageTitle } from './navigator';
import AppNavigatorBody from './AppNavigatorBody';
import { NotificationsWatcher } from '../notifications/NotificationsWatcher';

const resolvePageTitle = (
  page: NavigatorTypes.Page,
  editing: boolean,
): PageTitle | undefined => {
  const appPages = pages as unknown as Record<string, AppPage>;

  for (const entry of Object.values(appPages)) {
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
        headerStyle={{ backgroundColor: theme.overlayBar }}
        titleColor={theme.color}
        headerTitle={headerTitle}
        animations={{
          go: {
            pageEntering: FadeInRight.duration(240).easing(Easing.out(Easing.cubic)),
            pageExiting: FadeOutLeft.duration(180).easing(Easing.in(Easing.cubic)),
          },
          return: {
            pageEntering: FadeInLeft.duration(240).easing(Easing.out(Easing.cubic)),
            pageExiting: FadeOutRight.duration(180).easing(Easing.in(Easing.cubic)),
          },
        }}
        useNavigator={useNavigator}
      />
      <NotificationsWatcher />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
