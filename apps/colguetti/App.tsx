import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Root from './src/navigator/Root';
import { ConfirmProvider, NavigatorProvider, ToastProvider } from 'alambre';
import navigator from './src/navigator/navigator';
import { ColguettiToast } from './src/providers/toast';
import ConfirmDialog from './src/components/ConfirmDialog';
import AppSplash from './src/components/AppSplash';
import { ItemsProvider } from './src/items/items-context';
import { AlarmsProvider } from './src/alarms/alarms-context';
import { ConfirmationsProvider } from './src/checklist/confirmations-context';
import { ActivationProvider } from './src/checklist/activation-context';
import { NotificationPermissionProvider } from './src/notifications/notification-permission-context';
import { useFonts } from 'expo-font';
import { Kranky_400Regular } from '@expo-google-fonts/kranky';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';
import { Nunito_400Regular } from '@expo-google-fonts/nunito';

export default function App() {
  const [fontsLoaded] = useFonts({
    Kranky: Kranky_400Regular,
    Inter: Inter_400Regular,
    SpaceMono: SpaceMono_400Regular,
    PlayfairDisplay: PlayfairDisplay_400Regular,
    Nunito: Nunito_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ItemsProvider>
          <AlarmsProvider>
            <ConfirmationsProvider>
              <ActivationProvider>
                <NotificationPermissionProvider>
                  <NavigatorProvider pages={navigator}>
                    <ConfirmProvider ConfirmComponent={ConfirmDialog}>
                      <ToastProvider ToastComponent={ColguettiToast}>
                        <Root />
                        <AppSplash />
                      </ToastProvider>
                    </ConfirmProvider>
                  </NavigatorProvider>
                </NotificationPermissionProvider>
              </ActivationProvider>
            </ConfirmationsProvider>
          </AlarmsProvider>
        </ItemsProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
