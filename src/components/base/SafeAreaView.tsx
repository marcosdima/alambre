import type { DefaultReact } from '../../types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default ({ children, style, ...props }: DefaultReact.SafeAreaViewProps) => {
  return (
    <SafeAreaView
      style={[{ flex: 1 }, style]}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
};
