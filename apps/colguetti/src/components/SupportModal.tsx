import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../providers/theme';
import AppButton from './AppButton';

type SupportModalProps = {
  visible: boolean;
  onClose: () => void;
};

const GITHUB_URL = 'https://github.com/marcosdima/alambre';
const CAFECITO_URL = 'https://cafecito.app';

export default function SupportModal({ visible, onClose }: SupportModalProps) {
  const { theme } = useLightDark();

  const handleOpenLink = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
              <AlambreIcons.Heart color={theme.primary} lineWidth={2.5} style={styles.heartIcon} />
            </View>
            <Text style={[styles.title, { color: theme.color }]}>¡Apoyá a Colguetti!</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Colguetti es un proyecto libre y artesanal para que nunca más te olvides nada al salir de casa.
            </Text>
          </View>

          <View style={styles.actions}>
            <AppButton
              variant="solid"
              tone="primary"
              size="md"
              fullWidth
              label="☕ Invitar un Cafecito / Donar"
              onPress={() => handleOpenLink(CAFECITO_URL)}
            />
            <AppButton
              variant="outline"
              tone="neutral"
              size="md"
              fullWidth
              label="⭐ Ver en GitHub"
              onPress={() => handleOpenLink(GITHUB_URL)}
            />
          </View>

          <View style={styles.footer}>
            <AppButton
              testID="support-close-button"
              variant="ghost"
              tone="neutral"
              size="sm"
              label="Cerrar"
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 24,
    gap: 18,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heartIcon: {
    width: 28,
    height: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  footer: {
    marginTop: 4,
  },
});
