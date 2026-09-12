import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { useNavigator, useToast } from 'alambre';
import { useLang } from '../../providers/lang';
import AppTitle from '../../components/AppTitle';

type DemoTone = 'info' | 'success' | 'warning' | 'error';

type DemoToastPayload = {
  title: string;
  content: string;
  tone: DemoTone;
};

const parseDemoPayload = (payload?: unknown): DemoToastPayload | undefined => {
  if (!payload || typeof payload !== 'object') return undefined;
  const value = payload as Record<string, unknown>;
  if (
    typeof value.title !== 'string'
    || typeof value.content !== 'string'
    || (value.tone !== 'info' && value.tone !== 'success' && value.tone !== 'warning' && value.tone !== 'error')
  ) {
    return undefined;
  }

  return {
    title: value.title,
    content: value.content,
    tone: value.tone,
  };
};

const makeToast = (
  show: ReturnType<typeof useToast>['show'],
  tone: DemoTone,
  labels: Record<'info' | 'success' | 'warning' | 'error', string>,
) => {
  show({
    payload: {
      title: `Toast ${tone}`,
      content: `${labels[tone]} (${new Date().toLocaleTimeString()})`,
      tone,
    },
    duration: 4500,
  });
};

const runSoftPreset = (
  show: ReturnType<typeof useToast>['show'],
  messages: {
    softStartTitle: string;
    softStartContent: string;
    softProfileTitle: string;
    softProfileContent: string;
    softReminderTitle: string;
    softReminderContent: string;
  },
) => {
  show({
    payload: {
      title: messages.softStartTitle,
      content: messages.softStartContent,
      tone: 'info',
    },
    duration: 2600,
  });

  show({
    payload: {
      title: messages.softProfileTitle,
      content: messages.softProfileContent,
      tone: 'success',
    },
    duration: 2600,
  });

  show({
    payload: {
      title: messages.softReminderTitle,
      content: messages.softReminderContent,
      tone: 'warning',
    },
    duration: 3000,
  });
};


const runAlertPreset = (
  show: ReturnType<typeof useToast>['show'],
  clear: ReturnType<typeof useToast>['clear'],
  messages: {
    alertErrorTitle: string;
    alertErrorContent: string;
    alertRetryTitle: string;
    alertRetryContent: string;
  },
) => {
  clear();

  show({
    payload: {
      title: messages.alertErrorTitle,
      content: messages.alertErrorContent,
      tone: 'error',
    },
    duration: 4500,
  });

  show({
    payload: {
      title: messages.alertRetryTitle,
      content: messages.alertRetryContent,
      tone: 'warning',
    },
    duration: 3500,
  });
};


const runPersistentPreset = (
  show: ReturnType<typeof useToast>['show'],
  messages: {
    persistentTitle: string;
    persistentContent: string;
  },
) => {
  show({
    payload: {
      title: messages.persistentTitle,
      content: messages.persistentContent,
      tone: 'info',
    },
    persistent: true,
  });
};

export default () => {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const { show, clear, dismiss, queueLength, toast } = useToast();
  const { navigate } = useNavigator();

  const toastLabels = lang.toast.labels;
  const toastMessages = lang.toast.messages;
  const activePayload = parseDemoPayload(toast?.data.payload);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle style={[styles.title, { color: theme.color }]}>{lang.toast.title}</AppTitle>
        <Text style={[styles.subtitle, { color: theme.muted }]}>{lang.toast.subtitle}</Text>

        <View style={styles.grid}>
          <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => makeToast(show, 'info', toastLabels)}>
            <Text style={[styles.buttonLabel, { color: theme.onPrimary }]}>{lang.toast.info}</Text>
          </Pressable>
          <Pressable style={[styles.button, { backgroundColor: theme.success }]} onPress={() => makeToast(show, 'success', toastLabels)}>
            <Text style={[styles.buttonLabel, { color: theme.onPrimary }]}>{lang.toast.success}</Text>
          </Pressable>
          <Pressable style={[styles.button, { backgroundColor: theme.warning }]} onPress={() => makeToast(show, 'warning', toastLabels)}>
            <Text style={[styles.buttonLabel, { color: theme.onPrimary }]}>{lang.toast.warning}</Text>
          </Pressable>
          <Pressable style={[styles.button, { backgroundColor: theme.danger }]} onPress={() => makeToast(show, 'error', toastLabels)}>
            <Text style={[styles.buttonLabel, { color: theme.onPrimary }]}>{lang.toast.error}</Text>
          </Pressable>
        </View>

        <View style={[styles.infoBox, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
          <Text style={[styles.infoText, { color: theme.color }]}>{lang.toast.queue}: {queueLength}</Text>
          <Text style={[styles.infoText, { color: theme.muted }]}>{lang.toast.active}: {activePayload?.tone ?? lang.toast.none}</Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={() => dismiss()}>
            <Text style={[styles.secondaryLabel, { color: theme.color }]}>{lang.toast.closeCurrent}</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={() => clear()}>
            <Text style={[styles.secondaryLabel, { color: theme.color }]}>{lang.toast.clearQueue}</Text>
          </Pressable>
        </View>

        <Text style={[styles.presetTitle, { color: theme.color }]}>{lang.toast.presets}</Text>

        <View style={styles.presetRow}>
          <Pressable style={[styles.presetButton, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]} onPress={() => runSoftPreset(show, toastMessages)}>
            <Text style={[styles.secondaryLabel, { color: theme.color }]}>{lang.toast.softFlow}</Text>
          </Pressable>
          <Pressable style={[styles.presetButton, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]} onPress={() => runAlertPreset(show, clear, toastMessages)}>
            <Text style={[styles.secondaryLabel, { color: theme.color }]}>{lang.toast.alertFlow}</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.presetButton, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]} onPress={() => runPersistentPreset(show, toastMessages)}>
          <Text style={[styles.secondaryLabel, { color: theme.color }]}>{lang.toast.persistentToast}</Text>
        </Pressable>

        <Pressable style={[styles.backButton, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]} onPress={() => navigate('home')}>
          <Text style={[styles.secondaryLabel, { color: theme.color }]}>{lang.toast.backHome}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  title: {
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    flexBasis: '48%',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonLabel: {
    fontWeight: '700',
    fontSize: 14,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  infoText: {
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryLabel: {
    fontWeight: '700',
    fontSize: 13,
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
