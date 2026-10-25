import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import {
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { useNavigator } from 'alambre';
import type { Page } from 'alambre';
import { ThemeProvider } from 'alambre/ui';
import { useLightDark } from '../providers/theme';
import { useLang } from '../providers/lang';
import { useConfig } from '../providers/config';
import { pages, type PageTitle } from './navigator';
import AppNavigatorBody from './AppNavigatorBody';

const resolvePageTitle = (
  page: Page,
): PageTitle | undefined => {
  for (const entry of Object.values(pages)) {
    if (entry === page) return entry.title;
    if (entry.subpages) {
      for (const sub of Object.values(entry.subpages)) {
        if (sub === page) return sub.title;
      }
    }
  }
  return undefined;
};

export default () => {
  const { theme } = useLightDark();
  const { currentLang } = useLang();
  const { config } = useConfig();
  const { currentPage } = useNavigator();

  const title = resolvePageTitle(currentPage);
  const headerTitle = title?.[currentLang as 'es' | 'en'];

  return (
    <ThemeProvider theme={{ ...theme, fontFamily: config.fontFamily }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <AppNavigatorBody
          style={styles.container}
          arrowColor={theme.primary}
          arrowBackgroundColor={theme.surfaceAlt}
          arrowBorderColor={theme.border}
          headerStyle={{ backgroundColor: theme.surfaceAlt }}
          titleColor={theme.color}
          fontFamily={config.fontFamily}
          headerTitle={headerTitle}
          animations={{
            go: {
              pageEntering: FadeIn.duration(200).easing(Easing.out(Easing.cubic)),
            },
            return: {
              pageEntering: FadeIn.duration(200).easing(Easing.out(Easing.cubic)),
            },
          }}
          useNavigator={useNavigator}
        />
      </SafeAreaView>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
