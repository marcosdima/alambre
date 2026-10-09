import AppText from './AppText';
import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet,  View } from 'react-native';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../providers/theme';
import { useLang } from '../providers/lang';
import AppButton from './AppButton';

type SupportModalProps = {
  visible: boolean;
  onClose: () => void;
};

const GITHUB_URL = 'https://github.com/marcosdima';
const CAFECITO_URL = 'https://cafecito.app/marcosdima';

const SUPPORT_QUOTES = [
  {
    es: 'Yo soy Rudolph Giuliani... debes apoyar a Colguetti... cero tolerancia...',
    en: 'I am Rudolph Giuliani... you must support Colguetti... zero tolerance...',
  },
  {
    es: 'Colguetti es un proyecto libre y artesanal, como el dulce de leche ¿)',
    en: 'Colguetti is open-source and handcrafted, just like dulce de leche (I dare you to try to pronounce it gringitou)',
  },
  {
    es: 'Colguetti fue hecho con amor... amor al dinero ¿)',
    en: 'Colguetti was made with love... love for money ¿)',
  },
  {
    es: 'Apoyar a Colguetti es como comer una naranja.',
    en: 'Supporting Colguetti is like eating an orange.',
  },
  {
    es: '¿No podés donar porque te olvidaste tu billetera? Si tan solo hubiera una forma de que no te olvidaras...',
    en: 'Can\'t donate because you forgot your wallet? If only there were a way so you wouldn\'t forget...',
  },
];

export default function SupportModal({ visible, onClose }: SupportModalProps) {
  const { theme } = useLightDark();
  const { currentLang } = useLang();
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      const randomIndex = Math.floor(Math.random() * SUPPORT_QUOTES.length);
      setQuoteIndex(randomIndex);
    }
  }, [visible]);

  const handleOpenLink = (url: string) => {
    void Linking.openURL(url);
  };

  const activeQuote = SUPPORT_QUOTES[quoteIndex];
  const quoteText = (activeQuote && activeQuote[currentLang as 'es' | 'en']) || activeQuote.es;

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
            <AppText style={[styles.title, { color: theme.color }]}>
              {currentLang === 'en' ? 'Support Colguetti!' : '¡Apoyá a Colguetti!'}
            </AppText>
            <AppText style={[styles.subtitle, { color: theme.muted }]}>
              {quoteText}
            </AppText>
          </View>

          <View style={styles.actions}>
            <AppButton
              variant="solid"
              tone="primary"
              size="md"
              fullWidth
              label={currentLang === 'en' ? 'Buy me a coffee' : 'Invitame un cafecito'}
              rightIcon={<AlambreIcons.Coffee color={theme.onPrimary} lineWidth={2.2} style={styles.btnIcon} />}
              onPress={() => handleOpenLink(CAFECITO_URL)}
            />
            <AppButton
              variant="outline"
              tone="neutral"
              size="md"
              fullWidth
              label={currentLang === 'en' ? 'View on GitHub' : 'Ver en GitHub'}
              rightIcon={<AlambreIcons.Arrow drawIt color={theme.color} lineWidth={16} style={styles.arrowIcon} />}
              onPress={() => handleOpenLink(GITHUB_URL)}
            />
          </View>

          <View style={styles.footer}>
            <AppButton
              testID="support-close-button"
              variant="ghost"
              tone="neutral"
              size="sm"
              label={currentLang === 'en' ? 'Close' : 'Cerrar'}
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
