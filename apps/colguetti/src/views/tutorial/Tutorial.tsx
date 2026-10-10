import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import AppText from '../../components/AppText';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import SwipeableItemRow from '../../components/SwipeableItemRow';
import { ItemIcon } from '../../items/icon-catalog';
import type { ItemIconKey } from '../../items/item-types';
import { useLightDark } from '../../providers/theme';
import { useNavigator, AlambreIcons, Typewriter, StepFlow, useStepFlow } from 'alambre';
import { useLang } from '../../providers/lang';
import DropInTitle from '../../components/DropInTitle';
import SkiaFrame from '../../components/SkiaFrame';

import { AlarmGlyph, ItemsGlyph } from '../../components/illustrations/SkiaArt';
import { useConfig } from '../../providers/config';

type ThemeType = Record<string, string>;


const AnimatedAlarmForm = ({ theme, onComplete }: { theme: ThemeType; onComplete: () => void }) => {
  const { lang } = useLang();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (phase === 0) {
      timeoutId = setTimeout(() => setPhase(1), 400); // show time
    } else if (phase === 1) {
      timeoutId = setTimeout(() => setPhase(2), 400); // select days
    } else if (phase === 2) {
      timeoutId = setTimeout(() => {
        setPhase(3);
      }, 400); // done
    }
    return () => clearTimeout(timeoutId);
  }, [phase]);

  return (
    <View style={{ gap: 16, width: '100%' }}>
      <View style={{ alignItems: 'center' }}>
        <AppText style={{ fontSize: 48, color: theme.color, fontWeight: '700' }}>
          {phase >= 1 ? lang.tutorial.mockAlarmTime : '00:00'}
        </AppText>
      </View>

      <View>
        <AppText style={{ fontSize: 14, color: theme.color, opacity: 0.6, marginBottom: 8, marginLeft: 16 }}>{lang.alarms.weekdaysLabel}</AppText>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {lang.alarms.weekdays.map((d, i) => {
            const selected = phase >= 2 && i > 0 && i < 6;
            return (
              <View key={i} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: selected ? theme.primarySoft : theme.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: selected ? theme.primary : 'transparent' }}>
                <AppText style={{ color: selected ? theme.primary : theme.color, fontWeight: selected ? '700' : '400' }}>{d}</AppText>
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ height: 56, width: '100%' }}>
        {phase >= 3 && (
          <Animated.View entering={FadeIn}>
            <AppButton variant="solid" tone="primary" label={lang.common.save} onPress={onComplete} fullWidth />
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const AnimatedItemForm = ({ theme, onComplete }: { theme: ThemeType; onComplete: () => void }) => {
  const { lang } = useLang();
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (phase === 0) {
      timeoutId = setTimeout(() => setPhase(1), 300);
    } else if (phase === 1) {
      const textToType = lang.tutorial.mockItemName;
      if (typedText.length < textToType.length) {
        timeoutId = setTimeout(() => {
          setTypedText(textToType.slice(0, typedText.length + 1));
        }, 30);
      } else {
        timeoutId = setTimeout(() => setPhase(2), 300);
      }
    } else if (phase === 2) {
      timeoutId = setTimeout(() => setPhase(3), 400);
    } else if (phase === 3) {
      timeoutId = setTimeout(() => {
        setPhase(4);
      }, 800);
    }
    return () => clearTimeout(timeoutId);
  }, [phase, typedText, lang.tutorial.mockItemName]);

  return (
    <View style={{ gap: 16, width: '100%' }}>
      <View>
        <AppText style={{ fontSize: 14, color: theme.color, opacity: 0.6, marginBottom: 8, marginLeft: 16 }}>{lang.items.nameLabel}</AppText>
        <AppCard variant="soft" padding="none" style={{ borderRadius: 24, overflow: 'hidden' }}>
          <View style={{ paddingHorizontal: 16, height: 56, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppText style={{ fontSize: 16, color: typedText ? theme.color : theme.muted }}>
                {typedText || lang.items.namePlaceholder}
              </AppText>
              <Animated.View style={{ width: 2, height: 16, backgroundColor: theme.primary, marginLeft: 2, opacity: phase === 1 ? 1 : 0 }} />
            </View>
          </View>
        </AppCard>
      </View>

      <View style={{ flexDirection: 'row', gap: 24 }}>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontSize: 14, color: theme.color, opacity: 0.6, marginBottom: 8, marginLeft: 16 }}>{lang.items.iconLabel}</AppText>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {['keys', 'laptop'].map((ic, i) => (
              <View key={ic} style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: phase >= 2 && i === 0 ? theme.primarySoft : theme.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: phase >= 2 && i === 0 ? theme.primary : 'transparent' }}>
                <ItemIcon icon={ic as ItemIconKey} color={phase >= 2 && i === 0 ? theme.primary : theme.color} lineWidth={2} />
              </View>
            ))}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <AppText style={{ fontSize: 14, color: theme.color, opacity: 0.6, marginBottom: 8, marginLeft: 16 }}>{lang.items.colorLabel}</AppText>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {['#ff4b4b', '#4b7bff'].map((c, i) => (
              <View key={c} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c, opacity: phase >= 3 && i === 0 ? 1 : 0.3, borderWidth: 3, borderColor: phase >= 3 && i === 0 ? theme.color : 'transparent' }} />
            ))}
          </View>
        </View>
      </View>

      <View style={{ height: 56, width: '100%' }}>
        {phase >= 4 && (
          <Animated.View entering={FadeIn}>
            <AppButton variant="solid" tone="primary" label={lang.common.save} onPress={onComplete} fullWidth />
          </Animated.View>
        )}
      </View>
    </View>
  );
};


const TutorialHomeMenu = ({ theme, highlight, onItemsPress, onAlarmsPress }: { theme: ThemeType; highlight: 'items' | 'alarms'; onItemsPress?: () => void; onAlarmsPress?: () => void; }) => {
  const { lang } = useLang();
  return (
    <View style={{ flexDirection: 'row', gap: 16, width: '100%' }}>
      <View style={{ flex: 1 }}>
        <AppCard
          variant="soft"
          padding="lg"
          onPress={onAlarmsPress}
          style={{ width: '100%', opacity: highlight === 'alarms' ? 1 : 0.6 }}
          contentStyle={{ backgroundColor: highlight === 'alarms' ? theme.primarySoft : theme.surfaceAlt }}
        >
          <View style={{ flexDirection: 'column', alignItems: 'center', gap: 16, paddingVertical: 12 }}>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <AppText style={{ fontSize: 22, color: theme.color, textAlign: 'center' }}>{lang.alarms.title}</AppText>
              <AppText style={{ color: theme.color, opacity: 0.6, textAlign: 'center' }}>{lang.home.manageAlarms}</AppText>
            </View>
            <AlarmGlyph line={theme.color} size={70} ringing={highlight === 'alarms'} rippleWaves={3} />
          </View>
        </AppCard>
        {highlight === 'alarms' && <SkiaFrame color={theme.primary} inset={16} cornerGap={12} strokeWidth={2} cornerShape="square" />}
      </View>

      <View style={{ flex: 1 }}>
        <AppCard
          variant="soft"
          padding="lg"
          onPress={onItemsPress}
          style={{ width: '100%', opacity: highlight === 'items' ? 1 : 0.6 }}
          contentStyle={{ backgroundColor: highlight === 'items' ? theme.dangerSoft : theme.surfaceAlt }}
        >
          <View style={{ flexDirection: 'column', alignItems: 'center', gap: 16, paddingVertical: 12 }}>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <AppText style={{ fontSize: 22, color: theme.color, textAlign: 'center' }}>{lang.items.title}</AppText>
              <AppText style={{ color: theme.color, opacity: 0.6, textAlign: 'center' }}>{lang.tutorial.collection}</AppText>
            </View>
            <ItemsGlyph line={theme.color} size={70} />
          </View>
        </AppCard>
        {highlight === 'items' && <SkiaFrame color={theme.danger} inset={16} cornerGap={12} strokeWidth={2} cornerShape="triangle" rotateCorners />}
      </View>
    </View>
  );
};



const TutorialAlarm = ({ theme }: { theme: ThemeType }) => {
  const { lang } = useLang();
  return (
    <AppCard variant="soft" padding="lg" style={{ width: '100%', borderWidth: 1.5, borderRadius: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText style={{ fontSize: 22, color: theme.color }}>{lang.tutorial.mockAlarmName}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppText style={{ fontSize: 18, color: theme.color, lineHeight: 22 }}>{lang.tutorial.mockAlarmTime}</AppText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 }}>
        {lang.alarms.weekdays.filter((_, i) => i > 0 && i < 6).map((d, i) => (
          <View key={i} style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: theme.primary, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <AppText style={{ fontSize: 12, color: theme.primary }}>{d}</AppText>
          </View>
        ))}
      </View>
    </AppCard>
  );
};

import { Pressable } from 'react-native';


const Play = AlambreIcons.Play;

const TutorialActiveAlarm = ({ theme, onPlay }: { theme: ThemeType; onPlay: () => void }) => {
  const { lang } = useLang();
  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <AppCard variant="soft" padding="lg" style={{ width: '100%' }} contentStyle={{ backgroundColor: theme.surfaceAlt }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50 }}>
          <AppText style={{ color: theme.color, fontSize: 22, flex: 1 }}>{lang.tutorial.mockAlarmName}</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
            <AppText style={{ fontSize: 18, lineHeight: 22, color: theme.color }}>{lang.tutorial.mockAlarmTime}</AppText>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
          {lang.alarms.weekdays.map((d, i) => {
            const isMarked = i > 0 && i < 6;
            return (
              <View key={i} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMarked ? theme.primarySoft : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                <AppText style={{ color: isMarked ? theme.primary : theme.color }}>{d}</AppText>
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: 24, alignItems: 'center' }}>
          <Pressable onPress={onPlay} style={({ pressed }) => [{ backgroundColor: 'transparent', opacity: pressed ? 0.7 : 1, width: '100%', height: 56, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }]}>
            <SkiaFrame color={theme.primary} inset={6} cornerGap={8} strokeWidth={2} cornerShape="dot" dashed />
            <Play color={theme.primary} style={{ width: 28, height: 28, marginLeft: 4 }} />
          </Pressable>
        </View>
      </AppCard>
      <SkiaFrame color={theme.border} inset={16} cornerGap={12} strokeWidth={2} cornerShape="dot" />
    </View>
  );
};

const TutorialChecklist = ({ theme, onComplete }: { theme: ThemeType; onComplete: () => void }) => {
  const { lang } = useLang();
  const [checked, setChecked] = useState(false);
  return (
    <View style={{ width: '100%', alignItems: 'center', gap: 24 }}>
      <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
        <Pressable onPress={() => setChecked(!checked)} style={{ width: 120, height: 110, borderRadius: 20, backgroundColor: checked ? theme.primarySoft : theme.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <AlambreIcons.Tick color={checked ? theme.primary : theme.border} lineWidth={3} style={{ width: 24, height: 24 }} drawIt={checked} />
          <AppText style={{ color: checked ? theme.primary : theme.color }}>{lang.tutorial.mockItemName}</AppText>
          <SkiaFrame color={checked ? theme.primary : theme.border} inset={6} cornerGap={10} strokeWidth={2} cornerShape="dot" />
        </Pressable>
      </View>
      <View style={{ height: 56, width: '100%' }}>
        {checked && (
          <Animated.View entering={FadeIn}>
            <AppButton variant="solid" tone="primary" label={lang.tutorial.continue} onPress={onComplete} fullWidth />
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const TutorialDeleteAlarm = ({ theme, onDelete }: { theme: ThemeType; onDelete: () => void }) => {
  const { lang } = useLang();
  const [deleted, setDeleted] = useState(false);
  return (
    <View style={{ width: '100%', alignItems: 'center', gap: 24 }}>
      <View style={{ width: '100%', minHeight: 80, justifyContent: 'center' }}>
        {deleted ? (
          <Animated.View entering={FadeIn} style={{ alignItems: 'center' }}>
            <AppText style={{ fontSize: 24, color: theme.danger }}>{lang.tutorial.deleted}</AppText>
          </Animated.View>
        ) : (
          <SwipeableItemRow onDelete={() => setDeleted(true)} peekIndex={0}>
            <TutorialAlarm theme={theme} />
          </SwipeableItemRow>
        )}
      </View>
      <View style={{ height: 56, width: '100%' }}>
        {deleted && (
          <Animated.View entering={FadeIn}>
            <AppButton variant="solid" tone="primary" label={lang.tutorial.finish} onPress={onDelete} fullWidth />
          </Animated.View>
        )}
      </View>
    </View>
  );
};

type StepDefinition = {
  title: string;
  description: string;
  component: (next: () => void) => React.ReactNode;
};

function TutorialFlowContent({ steps, theme }: { steps: StepDefinition[], theme: ThemeType }) {
  const { currentStepIndex, next } = useStepFlow();
  const step = steps[currentStepIndex];

  return (
    <StepFlow.Stage style={{ width: '100%' }} contentStyle={styles.stepContainer}>
      <AppText style={[styles.stepTitle, { color: theme.primary }]}>{step.title}</AppText>
      <Typewriter
        text={step.description}
        textStyle={[styles.stepDesc, { color: theme.color }]}
        speed={15}
        cursor={false}
      />
      <View style={styles.componentBox}>
        {step.component(next)}
      </View>
    </StepFlow.Stage>
  );
}

export default function Tutorial() {
  const { theme } = useLightDark();
  const { previous } = useNavigator();
  const { lang } = useLang();
  const { saveField } = useConfig();

  const finishTutorial = () => {
    saveField('tutorialCompleted', 'true');
    previous();
  };

  const STEPS = [
    {
      title: lang.tutorial.step1Title,
      description: lang.tutorial.step1Desc,
      component: (next: () => void) => <TutorialHomeMenu theme={theme} highlight="items" onItemsPress={next} />,
    },
    {
      title: lang.tutorial.step2Title,
      description: lang.tutorial.step2Desc,
      component: (next: () => void) => <AnimatedItemForm theme={theme} onComplete={next} />,
    },
    {
      title: lang.tutorial.step3Title,
      description: lang.tutorial.step3Desc,
      component: (next: () => void) => <TutorialHomeMenu theme={theme} highlight="alarms" onAlarmsPress={next} />,
    },
    {
      title: lang.tutorial.step4Title,
      description: lang.tutorial.step4Desc,
      component: (next: () => void) => <AnimatedAlarmForm theme={theme} onComplete={next} />,
    },
    {
      title: lang.tutorial.step4bTitle,
      description: lang.tutorial.step4bDesc,
      component: (next: () => void) => <TutorialActiveAlarm theme={theme} onPlay={next} />,
    },
    {
      title: lang.tutorial.step5Title,
      description: lang.tutorial.step5Desc,
      component: (next: () => void) => <TutorialChecklist theme={theme} onComplete={next} />,
    },
    {
      title: lang.tutorial.step6Title,
      description: lang.tutorial.step6Desc,
      component: (next: () => void) => <TutorialDeleteAlarm theme={theme} onDelete={next} />,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Pressable onPress={finishTutorial} style={{ padding: 8 }}>
            <AppText style={{ color: theme.muted, fontSize: 16 }}>{lang.tutorial.skip}</AppText>
          </Pressable>
        </View>
        <DropInTitle text={lang.settings.tutorialTitle} textStyle={[styles.title, { color: theme.color }]} />

        <StepFlow.Root totalSteps={STEPS.length} onComplete={finishTutorial} style={{ width: '100%' }}>
          <TutorialFlowContent steps={STEPS} theme={theme} />
        </StepFlow.Root>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingTop: 24,
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
    minHeight: 48,
    opacity: 0.8,
  },
  componentBox: {
    width: '100%',
    marginTop: 24,
    minHeight: 120,
    justifyContent: 'center',
  },
});
