import { Text, View, StyleSheet } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useNavigator, useStagger } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import { useConfig } from '../../providers/config';
import AppTitle from '../../components/AppTitle';
import AppButton from '../../components/AppButton';

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { config } = useConfig();
  const { navigate } = useNavigator();
  const { getDelay } = useStagger({ initialDelay: 80, staggerMs: 60 });

  const navItems = [
    {
      key: 'containers',
      label: 'Contenedores Interactivos (Carruseles, Decks, Tabs, Rows, Split)',
      onPress: () => navigate('containers'),
    },
    {
      key: 'dnd',
      label: 'Drag & Drop (Sortable Hand, Drop Zones & Physics)',
      onPress: () => navigate('dnd'),
    },
    {
      key: 'components',
      label: 'Catálogo de Componentes UI (Design System)',
      onPress: () => navigate('components'),
    },
    {
      key: 'textAnimations',
      label: 'Animaciones de Texto (Ticker, Typewriter, Wave)',
      onPress: () => navigate('textAnimations'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        entering={FadeInDown.duration(300).delay(getDelay(0)).easing(Easing.out(Easing.cubic))}
      >
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppTitle style={{ color: theme.color }}>{lang.home.title}</AppTitle>
          <Text style={[styles.subtitle, { color: theme.muted }]}>{lang.home.subtitle}</Text>
          <Text style={{ color: theme.primary }}>{config.greeting}</Text>
        </View>
      </Animated.View>

      {navItems.map((item, index) => (
        <Animated.View
          key={item.key}
          entering={FadeInDown.duration(280).delay(getDelay(index + 1)).easing(Easing.out(Easing.cubic))}
        >
          <AppButton onPress={item.onPress}>
            <Text style={{ color: theme.primary }}>{item.label}</Text>
          </AppButton>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 18,
    gap: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
});
