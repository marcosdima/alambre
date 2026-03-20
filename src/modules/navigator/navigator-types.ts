import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import type { DefaultReact } from '../../types';
import type { NavigatorTypes } from '../../types';
import type { EntryOrExitLayoutType } from 'react-native-reanimated';

export type NavigatorAnimations = {
  pageEntering?: EntryOrExitLayoutType;
  pageExiting?: EntryOrExitLayoutType;
};

export type NavigatorBodyProps = DefaultReact.ViewProps & {
  arrowColor?: ColorValue;
  arrowBackgroundColor?: ColorValue;
  width?: number;
  pressStyle?: StyleProp<ViewStyle>;
  animations?: {
    go?: NavigatorAnimations;
    return?: NavigatorAnimations;
  };
  useNavigator: () => NavigatorTypes.NavigatorReturn;
};
