import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useLightDark } from '../../providers/theme';
import { useLang } from '../../providers/lang';
import AppTitle from '../../components/AppTitle';

export default function HowToPlay() {
  const { theme } = useLightDark();
  const { lang } = useLang();

  const steps = [
    { title: lang.howToPlay.step1Title, text: lang.howToPlay.step1Text },
    { title: lang.howToPlay.step2Title, text: lang.howToPlay.step2Text },
    { title: lang.howToPlay.step3Title, text: lang.howToPlay.step3Text },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <AppTitle style={{ color: theme.color }}>{lang.howToPlay.title}</AppTitle>

      <View style={[styles.introCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <Text style={[styles.introText, { color: theme.color }]}>
          {lang.howToPlay.intro}
        </Text>
      </View>

      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View
            key={index}
            style={[
              styles.stepCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.stepTitle, { color: theme.primary }]}>
              {step.title}
            </Text>
            <Text style={[styles.stepText, { color: theme.color }]}>
              {step.text}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  introCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
  },
  stepsContainer: {
    gap: 12,
  },
  stepCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
