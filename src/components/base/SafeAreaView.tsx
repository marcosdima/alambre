import type { DefaultReact } from '@types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default ({ children, ...props }: DefaultReact.SafeAreaViewProps) => {
  return (
    <SafeAreaView
      {...props}
    >
      {children}
    </SafeAreaView>
  );
};
