import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import {
  Nunito_400Regular,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';
import { Kranky_400Regular } from '@expo-google-fonts/kranky';
import { ConfigProvider } from './src/providers/config';
import { LightDarkProvider } from './src/providers/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LangProvider } from './src/providers/lang';
import Root from './src/navigator/Root';
import { ToastProvider, initNavigator } from 'alambre';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import navigator from './src/navigator/navigator';
import { TemplateToast } from './src/providers/toast';

// Explicitly configure Reanimated logger; strict mode enforces best practices against .value reads in render
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: true,
});

initNavigator(navigator);

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter: Inter_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
    Nunito: Nunito_400Regular,
    Nunito_400Regular,
    Nunito_700Bold,
    PlayfairDisplay: PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    SpaceMono: SpaceMono_400Regular,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
    Kranky: Kranky_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ConfigProvider>
        <LightDarkProvider>
          <LangProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <ToastProvider ToastComponent={TemplateToast}>
                <Root />
              </ToastProvider>
            </GestureHandlerRootView>
          </LangProvider>
        </LightDarkProvider>
      </ConfigProvider>
    </SafeAreaProvider>
  );
}
