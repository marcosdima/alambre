import { StyleSheet, Text, View, Pressable } from 'react-native';
import { AlambreIcons, useNavigator } from 'alambre';
import { useGame } from '../../session/game-context';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import LetterReveal from '../../components/LetterReveal';
import AppButton from '../../components/AppButton';
import StaggeredGroup from '../../components/StaggeredGroup';

export default function Home() {
  const { theme } = useLightDark();
  const { lang, currentLang } = useLang();
  const { navigate } = useNavigator();
  const { activePuzzle, isCompleted, isDefeated } = useGame();

  const hasActiveGame = Boolean(activePuzzle && !isCompleted && !isDefeated);

  const menuItems = [
    {
      key: 'play',
      title: lang.home.newGame,
      icon: AlambreIcons.Play,
      onPress: () => navigate('gameSelect'),
      primary: true,
    },
    {
      key: 'history',
      title: lang.home.history,
      icon: AlambreIcons.Trophy,
      onPress: () => navigate('history'),
      primary: false,
    },
    {
      key: 'creator',
      title: lang.home.creator,
      icon: AlambreIcons.Documents,
      onPress: () => navigate('creator'),
      primary: false,
    },
    {
      key: 'howToPlay',
      title: lang.home.howToPlay,
      icon: AlambreIcons.Book,
      onPress: () => navigate('howToPlay'),
      primary: false,
    },
    {
      key: 'settings',
      title: lang.home.settings,
      icon: AlambreIcons.Gear,
      onPress: () => navigate('settings'),
      primary: false,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Banner */}
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <LetterReveal
          key={`${currentLang}_${lang.home.title}`}
          text={lang.home.title}
          style={{ color: theme.color, fontSize: 28 }}
        />
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          {lang.home.subtitle}
        </Text>
      </View>

      {/* Resume Card if game in progress */}
      {hasActiveGame && (
        <View style={[styles.resumeCard, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.resumeTitle, { color: theme.primary }]}>
              {lang.home.activeGame}
            </Text>
            <Text style={[styles.resumeSubtitle, { color: theme.color }]} numberOfLines={1}>
              {activePuzzle?.title}
            </Text>
          </View>
          <AppButton onPress={() => navigate('game')}>
            <View style={styles.buttonInnerRow}>
              <Text style={{ color: theme.primary, fontWeight: '700' }}>
                {lang.home.resumeGame}
              </Text>
              <AlambreIcons.Play
                color={theme.primary}
                lineWidth={2}
                style={{ width: 14, height: 14 }}
              />
            </View>
          </AppButton>
        </View>
      )}

      {/* Main Menu Items */}
      <StaggeredGroup
        style={styles.menuContainer}
        staggerMs={70}
        initialDelay={120}
        duration={340}
        direction="from-bottom"
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.menuItem,
                {
                  backgroundColor: item.primary ? theme.primarySoft : theme.surface,
                  borderColor: item.primary ? theme.primary : theme.border,
                },
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: item.primary ? theme.primary : theme.surfaceAlt,
                    },
                  ]}
                >
                  <Icon
                    color={item.primary ? theme.surface : theme.color}
                    lineWidth={2}
                    style={{ width: 18, height: 18 }}
                  />
                </View>
                <Text
                  style={[
                    styles.menuItemText,
                    {
                      color: item.primary ? theme.primary : theme.color,
                      fontWeight: item.primary ? '700' : '600',
                    },
                  ]}
                >
                  {item.title}
                </Text>
              </View>

              <AlambreIcons.Arrow
                color={item.primary ? theme.primary : theme.muted}
                lineWidth={2}
                style={{ width: 14, height: 14 }}
              />
            </Pressable>
          );
        })}
      </StaggeredGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    gap: 14,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  resumeTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  resumeSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuContainer: {
    gap: 10,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 15,
  },
});
