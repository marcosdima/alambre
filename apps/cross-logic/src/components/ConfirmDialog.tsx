import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ConfirmComponentProps } from 'alambre';
import { useLightDark } from '../providers/theme';
import { useLang } from '../providers/lang';

export default function ConfirmDialog({
  confirm,
  onConfirm,
  onCancel,
}: ConfirmComponentProps) {
  const { theme } = useLightDark();
  const { lang } = useLang();
  const danger = confirm.tone === 'danger';
  const cancelLabel = confirm.cancelLabel ?? lang.common.cancel;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onCancel}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.overlay }]} onPress={onCancel}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => undefined}
        >
          <Text style={[styles.title, { color: theme.color }]}>{confirm.title}</Text>
          {confirm.message ? (
            <Text style={[styles.message, { color: theme.muted }]}>{confirm.message}</Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.ghost,
                { borderColor: theme.border },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={{ color: theme.color, fontWeight: '700' }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: danger ? theme.danger : theme.primary },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={{ color: theme.onPrimary, fontWeight: '700' }}>{confirm.confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
