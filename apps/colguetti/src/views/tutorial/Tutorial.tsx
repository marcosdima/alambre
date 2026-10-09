import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import AppText from '../../components/AppText';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import SwipeableItemRow from '../../components/SwipeableItemRow';
import { ItemIcon } from '../../items/icon-catalog';
import type { ItemIconKey } from '../../items/item-types';
import { useLightDark } from '../../providers/theme';
import { useNavigator, AlambreIcons, Typewriter } from 'alambre';
import DropInTitle from '../../components/DropInTitle';
import SkiaFrame from '../../components/SkiaFrame';

type ThemeType = Record<string, string>;

const TutorialItem = ({ theme, name, icon, color, onDelete }: { theme: ThemeType; name: string; icon: ItemIconKey; color: string; onDelete: () => void }) => (
  <SwipeableItemRow onDelete={onDelete} peekIndex={0}>
    <AppCard variant="soft" padding="sm" style={{ borderWidth: 1.5, borderRadius: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 28 }}>
          <ItemIcon icon={icon} color={color} lineWidth={2} />
        </View>
        <AppText style={{ flex: 1, fontSize: 16, color: theme.color }}>{name}</AppText>
      </View>
    </AppCard>
  </SwipeableItemRow>
);

const TutorialAlarm = ({ theme }: { theme: ThemeType }) => (
  <AppCard variant="soft" padding="lg" style={{ width: '100%', borderWidth: 1.5, borderRadius: 24 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <AppText style={{ fontSize: 22, color: theme.color }}>Trabajo</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AppText style={{ fontSize: 18, color: theme.color, lineHeight: 22 }}>08:30</AppText>
      </View>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 }}>
      {['L', 'M', 'M', 'J', 'V'].map((d, i) => (
        <View key={i} style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: theme.primary, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <AppText style={{ fontSize: 12, color: theme.primary }}>{d}</AppText>
        </View>
      ))}
    </View>
  </AppCard>
);

export default function Tutorial() {
  const { theme } = useLightDark();
  const { navigate } = useNavigator();
  const [step, setStep] = useState(0);
  const [itemDeleted, setItemDeleted] = useState(false);

  const STEPS = [
    {
      title: 'Welcome to Colguetti',
      description: 'This app helps you remember everything you need before leaving home. Let\'s see how it works.',
      component: null,
    },
    {
      title: '1. Your Items',
      description: 'First, you add the items you don\'t want to forget (like keys, wallet, etc.). Try swiping the item below to delete it!',
      component: itemDeleted ? (
        <Animated.View entering={FadeIn}>
          <AppText style={{ color: theme.success, fontSize: 16, textAlign: 'center' }}>Great! You deleted it.</AppText>
        </Animated.View>
      ) : (
        <TutorialItem
          theme={theme}
          name="Keys"
          icon="keys"
          color={theme.primary}
          onDelete={() => setItemDeleted(true)}
        />
      ),
    },
    {
      title: '2. Your Routines',
      description: 'Then, you create a Routine (an alarm) and link it to your items. We will remind you to check them when it\'s time to leave.',
      component: <TutorialAlarm theme={theme} />,
    },
    {
      title: '3. Check it off',
      description: 'When the time comes, a checklist will appear. Tap your items to confirm you have them. Never forget anything again!',
      component: (
        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
          <View style={{ width: 120, height: 110, borderRadius: 20, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <AlambreIcons.Tick color={theme.onPrimary} lineWidth={3} style={{ width: 24, height: 24 }} />
            <AppText style={{ color: theme.onPrimary }}>Keys</AppText>
            <SkiaFrame color={theme.onPrimary} inset={6} cornerGap={10} strokeWidth={2} cornerShape="dot" />
          </View>
        </View>
      ),
    },
  ];

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      navigate('home');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <DropInTitle text="Tutorial" textStyle={[styles.title, { color: theme.color }]} />

        <Animated.View
          key={step}
          entering={SlideInRight.springify().damping(20).stiffness(90)}
          style={styles.stepContainer}
        >
          <AppText style={[styles.stepTitle, { color: theme.primary }]}>{STEPS[step].title}</AppText>
          <Typewriter
            text={STEPS[step].description}
            style={[styles.stepDesc, { color: theme.color }]}
            speed={2}
          />

          <View style={styles.componentBox}>
            {STEPS[step].component}
          </View>
        </Animated.View>

      </ScrollView>
      <View style={styles.footer}>
        <AppButton
          variant="solid"
          tone="primary"
          label={step === STEPS.length - 1 ? 'Let\'s go!' : 'Next'}
          onPress={handleNext}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    marginBottom: 40,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  stepTitle: {
    fontSize: 24,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  componentBox: {
    width: '100%',
    marginTop: 32,
    minHeight: 120,
    justifyContent: 'center',
  },
  footer: {
    padding: 24,
  },
});
