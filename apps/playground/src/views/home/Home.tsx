import { Text, View, StyleSheet, ScrollView } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useNavigator, useStagger } from 'alambre';
import { useLightDark } from '../../providers/theme';
import AppTitle from '../../components/AppTitle';
import AppButton from '../../components/AppButton';

export default () => {
  const { theme } = useLightDark();
  const { navigate } = useNavigator();
  const { getDelay } = useStagger({ initialDelay: 80, staggerMs: 60 });

  const navItems = [
    {
      key: 'animatedIcons',
      label: 'Animated Icons Testbed',
      onPress: () => navigate('animatedIcons'),
    },
    {
      key: 'colguetti',
      label: 'Colguetti Menu',
      onPress: () => navigate('colguetti'),
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        entering={FadeInDown.duration(300).delay(getDelay(0)).easing(Easing.out(Easing.cubic))}
      >
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppTitle style={{ color: theme.color }}>Alambre Showcase</AppTitle>
          <Text style={[styles.subtitle, { color: theme.muted }]}>Visual Testbed</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
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
