import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInRight, Easing } from 'react-native-reanimated';
import { useToast, useNavigator } from 'alambre';
import { useLightDark } from '../../providers/theme';
import AppButton from '../../components/AppButton';
import AppSlider from '../../components/AppSlider';
import AppSegmentedControl from '../../components/AppSegmentedControl';
import type { ToastTone, ToastPosition } from '../../providers/toast';

export default function ToastTest() {
  const { theme } = useLightDark();
  const { show, clear, dismiss, queueLength } = useToast();
  const { navigate } = useNavigator();

  const [duration, setDuration] = useState(3500);
  const [position, setPosition] = useState<ToastPosition>('top');
  const [tone, setTone] = useState<ToastTone>('info');
  const [withAction, setWithAction] = useState(false);
  const [actionLog, setActionLog] = useState<string | null>(null);
  const [toastCount, setToastCount] = useState(1);

  const handleShowCustomToast = () => {
    const id = `toast-${toastCount}`;
    const titles: Record<ToastTone, string> = {
      info: 'Información',
      success: 'Operación Exitosa',
      warning: 'Atención Requerida',
      danger: 'Error del Sistema',
    };

    show({
      id,
      duration,
      payload: {
        title: `${titles[tone]} #${toastCount}`,
        content: `Toast en posición ${position.toUpperCase()} con tono ${tone} (${duration}ms). ¡Prueba a deslizarlo para descartar!`,
        tone,
        position,
      },
      actions: withAction
        ? [
          {
            label: 'Deshacer',
            tone: tone === 'danger' ? 'danger' : 'primary',
            onPress: () => {
              setActionLog(`Acción "Deshacer" ejecutada en Toast #${toastCount}`);
            },
          },
        ]
        : undefined,
    });
    setToastCount((c) => c + 1);
  };

  const handleShowBurst = () => {
    const burstTones: ToastTone[] = ['info', 'success', 'warning', 'danger'];
    const burstMsgs: Record<ToastTone, string> = {
      info: 'Sincronizando datos con el servidor...',
      success: '¡Guardado correctamente en la nube!',
      warning: 'Conexión inestable detectada.',
      danger: 'No se pudo conectar con el endpoint.',
    };

    burstTones.forEach((t, i) => {
      show({
        duration: 3000,
        payload: {
          title: `Ráfaga (${i + 1}/4): ${t.toUpperCase()}`,
          content: burstMsgs[t],
          tone: t,
          position,
        },
      });
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 1. Configuration Card */}
      <Animated.View
        entering={FadeInLeft.duration(280).easing(Easing.out(Easing.cubic))}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Text style={[styles.cardTitle, { color: theme.color }]}>
          Configurador de Toasts
        </Text>
        <Text style={[styles.cardDesc, { color: theme.muted }]}>
          Prueba las nuevas capacidades: gestos swipe-to-dismiss, variantes semánticas, barra de tiempo y acciones.
        </Text>

        {/* Position Selector */}
        <AppSegmentedControl<ToastPosition>
          label="Posición en Pantalla"
          value={position}
          onChange={setPosition}
          options={[
            { label: 'Arriba (Top)', value: 'top' },
            { label: 'Abajo (Bottom)', value: 'bottom' },
          ]}
        />

        {/* Tone Selector */}
        <AppSegmentedControl<ToastTone>
          label="Tono Semántico"
          value={tone}
          onChange={setTone}
          options={[
            { label: 'Info', value: 'info' },
            { label: 'Éxito', value: 'success' },
            { label: 'Alerta', value: 'warning' },
            { label: 'Error', value: 'danger' },
          ]}
        />

        {/* Duration Slider */}
        <AppSlider
          label="Duración del Toast"
          unit="ms"
          value={duration}
          min={1500}
          max={8000}
          step={500}
          onChange={setDuration}
        />

        {/* Action Toggle */}
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, { color: theme.color }]}>
            Incluir botón de acción interactivo
          </Text>
          <Pressable
            onPress={() => setWithAction((v) => !v)}
            style={[
              styles.chipToggle,
              {
                backgroundColor: withAction ? theme.primarySoft : theme.surfaceAlt,
                borderColor: withAction ? theme.primary : theme.border,
              },
            ]}
            accessibilityRole="button"
          >
            <Text
              style={{
                color: withAction ? theme.primary : theme.muted,
                fontWeight: '700',
                fontSize: 12,
              }}
            >
              {withAction ? 'CON ACCIÓN' : 'SIN ACCIÓN'}
            </Text>
          </Pressable>
        </View>

        {actionLog ? (
          <View style={[styles.logBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Text style={[styles.logText, { color: theme.primary }]}>{actionLog}</Text>
          </View>
        ) : null}

        {/* Launch Actions */}
        <View style={styles.buttonRow}>
          <AppButton onPress={handleShowCustomToast}>
            <Text style={{ color: theme.primary, fontWeight: '700' }}>
              Lanzar Toast Configurado
            </Text>
          </AppButton>

          <AppButton onPress={handleShowBurst}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>
              Lanzar Ráfaga (4 tonos en cola)
            </Text>
          </AppButton>
        </View>
      </Animated.View>

      {/* 2. Gestures & Queue State Card */}
      <Animated.View
        entering={FadeInRight.duration(280).delay(80).easing(Easing.out(Easing.cubic))}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={styles.queueHeader}>
          <Text style={[styles.cardTitle, { color: theme.color }]}>
            Estado de Cola & Gestos
          </Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: queueLength > 0 ? theme.primarySoft : theme.surfaceAlt,
                borderColor: queueLength > 0 ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: queueLength > 0 ? theme.primary : theme.muted },
              ]}
            >
              {queueLength} pendientes
            </Text>
          </View>
        </View>

        <Text style={[styles.cardDesc, { color: theme.muted }]}>
          💡 <Text style={{ fontWeight: '700' }}>Gestos soportados:</Text> Desliza hacia arriba (o hacia abajo si está en Bottom) para expulsar el toast rápidamente, o desliza horizontalmente a izquierda/derecha.
        </Text>

        <View style={styles.buttonRow}>
          <AppButton onPress={() => dismiss()}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>
              Descartar actual (dismiss)
            </Text>
          </AppButton>

          <AppButton onPress={() => clear()}>
            <Text style={{ color: '#ef4444', fontWeight: '600' }}>
              Vaciar toda la cola (clear)
            </Text>
          </AppButton>
        </View>
      </Animated.View>

      {/* 3. Navigation Gliding Card */}
      <Animated.View
        entering={FadeInDown.duration(280).delay(160).easing(Easing.out(Easing.cubic))}
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Text style={[styles.cardTitle, { color: theme.color }]}>
          Verificación de Gliding en Navegación
        </Text>
        <Text style={[styles.cardDesc, { color: theme.muted }]}>
          Lanza un toast y cambia de vista mientras está activo para verificar la animación fluida entre el header y home.
        </Text>

        <View style={styles.buttonRow}>
          <AppButton
            onPress={() => {
              show({
                duration: 6000,
                payload: {
                  title: 'Gliding a Ajustes',
                  content: 'Observa cómo me deslizo suavemente bajo el header de Ajustes...',
                  tone: 'info',
                  position: 'top',
                },
              });
              navigate('settings');
            }}
          >
            <Text style={{ color: theme.primary, fontWeight: '700' }}>
              Toast + Ir a Ajustes
            </Text>
          </AppButton>

          <AppButton
            onPress={() => {
              show({
                duration: 6000,
                payload: {
                  title: 'Gliding a Subpágina',
                  content: 'Alineado limpiamente bajo la barra de navegación de 56px.',
                  tone: 'success',
                  position: 'top',
                },
              });
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  chipToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  logBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  logText: {
    fontSize: 12,
    fontWeight: '600',
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
