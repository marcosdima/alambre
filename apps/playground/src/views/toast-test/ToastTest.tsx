import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInRight, Easing } from 'react-native-reanimated';
import { useToast, useNavigator } from 'alambre';
import { useLightDark } from '../../providers/theme';
import AppButton from '../../components/AppButton';
import AppSlider from '../../components/AppSlider';

export default function ToastTest() {
  const { theme } = useLightDark();
  const { show, clear, dismiss, queueLength } = useToast();
  const { navigate } = useNavigator();

  const [duration, setDuration] = useState(3000);
  const [toastCount, setToastCount] = useState(1);

  const handleShowToast = () => {
    show({
      payload: `Toast #${toastCount}: Prueba interactiva (${duration}ms)`,
      duration,
    });
    setToastCount((c) => c + 1);
  };

  const handleShowMultiple = () => {
    for (let i = 1; i <= 3; i++) {
      show({
        payload: `Mensaje en cola ${i}/3 (duración: ${duration}ms)`,
        duration,
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Configuration Card */}
      <Animated.View
        entering={FadeInLeft.duration(280).easing(Easing.out(Easing.cubic))}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Text style={[styles.cardTitle, { color: theme.color }]}>
          Configuración de Toast
        </Text>
        <Text style={[styles.cardDesc, { color: theme.muted }]}>
          Ajusta los parámetros y experimenta con la cola y el comportamiento del Toast.
        </Text>

        <AppSlider
          label="Duración en Pantalla"
          unit="ms"
          value={duration}
          min={1000}
          max={8000}
          step={500}
          onChange={setDuration}
        />

        <View style={styles.buttonRow}>
          <AppButton onPress={handleShowToast}>
            <Text style={{ color: theme.primary, fontWeight: '700' }}>
              Lanzar Toast
            </Text>
          </AppButton>

          <AppButton onPress={handleShowMultiple}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>
              Encolar 3 Toasts
            </Text>
          </AppButton>
        </View>
      </Animated.View>

      {/* Queue & Control Card */}
      <Animated.View
        entering={FadeInRight.duration(280).delay(80).easing(Easing.out(Easing.cubic))}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={styles.queueHeader}>
          <Text style={[styles.cardTitle, { color: theme.color }]}>
            Estado de la Cola
          </Text>
          <View style={[styles.badge, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
            <Text style={[styles.badgeText, { color: theme.primary }]}>
              {queueLength} pendientes
            </Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <AppButton onPress={() => dismiss()}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>
              Cerrar actual (dismiss)
            </Text>
          </AppButton>

          <AppButton onPress={() => clear()}>
            <Text style={{ color: '#ef4444', fontWeight: '600' }}>
              Limpiar cola (clear)
            </Text>
          </AppButton>
        </View>
      </Animated.View>

      {/* Navigation Gliding Test Card */}
      <Animated.View
        entering={FadeInDown.duration(280).delay(160).easing(Easing.out(Easing.cubic))}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Text style={[styles.cardTitle, { color: theme.color }]}>
          Prueba de Gliding en Navegación
        </Text>
        <Text style={[styles.cardDesc, { color: theme.muted }]}>
          Lanza un toast con duración alta y navega inmediatamente a otra vista para observar cómo el toast flota suavemente entre las alturas de header y home.
        </Text>

        <View style={styles.buttonRow}>
          <AppButton
            onPress={() => {
              show({ payload: 'Observa cómo me deslizo al navegar a Ajustes...', duration: 6000 });
              navigate('settings');
            }}
          >
            <Text style={{ color: theme.primary, fontWeight: '700' }}>
              Toast + Ir a Ajustes
            </Text>
          </AppButton>

          <AppButton
            onPress={() => {
              show({ payload: 'Observa la posición debajo del header de subpágina', duration: 6000 });
              navigate('home', { subpage: 'details' });
            }}
          >
            <Text style={{ color: theme.primary, fontWeight: '600' }}>
              Toast + Ir a Subpágina
            </Text>
          </AppButton>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  buttonRow: {
    gap: 10,
  },
});
