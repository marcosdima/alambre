import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import {
  Easing,
  FadeInLeft,
  FadeInRight,
} from 'react-native-reanimated';
import { useNavigator } from 'alambre';
import type { NavigatorTypes } from 'alambre';
import { useLightDark } from '../providers/theme';
import { useLang } from '../providers/lang';
import { useGame } from '../session/game-context';
import { pages, type PageTitle } from './navigator';
import AppNavigatorBody from './AppNavigatorBody';

const resolvePageTitle = (
  page: NavigatorTypes.Page,
): PageTitle | undefined => {
  for (const entry of Object.values(pages)) {
    if (entry === page) return entry.title;
  }
  return undefined;
};

export default () => {
  const { theme } = useLightDark();
  const { currentLang } = useLang();
  const { currentPage } = useNavigator();
  const { activePuzzle } = useGame();

  const title = resolvePageTitle(currentPage);
  const headerTitle =
    currentPage === pages.game && activePuzzle
      ? activePuzzle.title
      : title?.[currentLang as 'es' | 'en'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <AppNavigatorBody
        style={styles.container}
        arrowColor={theme.primary}
        arrowBackgroundColor={theme.surfaceAlt}
        arrowBorderColor={theme.border}
        headerStyle={{ backgroundColor: theme.surfaceAlt }}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
