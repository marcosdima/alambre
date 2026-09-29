import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../providers/theme';
import { useLang } from '../providers/lang';
import AppButton from './AppButton';

export type SupportModalProps = {
  visible: boolean;
  onClose: () => void;
  cafecitoUrl?: string;
  githubUrl?: string;
};

const DEFAULT_GITHUB_URL = 'https://github.com/marcosdima';
const DEFAULT_CAFECITO_URL = 'https://cafecito.app/marcosdima';

export default function SupportModal({
  visible,
  onClose,
  cafecitoUrl = DEFAULT_CAFECITO_URL,
  githubUrl = DEFAULT_GITHUB_URL,
}: SupportModalProps) {
  const { theme } = useLightDark();
  const { lang } = useLang();

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
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={lang.support.close}
        />
        <View
          style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.primarySoft, borderColor: theme.primary },
              ]}
            >
              <AlambreIcons.Heart color={theme.primary} lineWidth={2.5} style={styles.heartIcon} />
            </View>
            <Text style={[styles.title, { color: theme.color }]}>
              {lang.support.title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              {lang.support.subtitle}
            </Text>
          </View>

          <View style={styles.actions}>
            <AppButton
              variant="solid"
              tone="primary"
              size="md"
              fullWidth
              label={lang.support.buyCoffee}
              rightIcon={<AlambreIcons.Coffee color={theme.onPrimary} lineWidth={2.2} style={styles.btnIcon} />}
              onPress={() => handleOpenLink(cafecitoUrl)}
            />
            <AppButton
              variant="outline"
              tone="neutral"
              size="md"
              fullWidth
              label={lang.support.viewGithub}
              rightIcon={<AlambreIcons.Arrow drawIt color={theme.color} lineWidth={16} style={styles.arrowIcon} />}
              onPress={() => handleOpenLink(githubUrl)}
            />
          </View>

          <View style={styles.footer}>
            <AppButton
              testID="support-close-button"
              variant="ghost"
              tone="neutral"
              size="sm"
              label={lang.support.close}
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
  btnIcon: {
    width: 18,
    height: 18,
  },
  arrowIcon: {
    width: 22,
    height: 16,
  },
  footer: {
    marginTop: 4,
  },
});
