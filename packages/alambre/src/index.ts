// Base inputs.
export {
  Button,
  Stepper,
  useStepper,
  Slider,
  useSlider,
  SegmentedControl,
  useSelect,
  Input,
} from './components/base/input';
export type {
  ButtonProps,
  ButtonState,
  StepperProps,
  StepperOptions,
  StepperState,
  SliderProps,
  SliderOptions,
  SliderState,
  SegmentedControlProps,
  SelectOption,
  SelectOptions,
  SelectState,
  InputProps,
  InputState,
} from './components/base/input';

// Types.
export type { NavigatorTypes } from './types';

export type { Storage } from './types/actions';
export type { IconAnimationConfig } from './types/hooks';
export type { IconProps } from './types/icons';
export type { UseCollectionType } from './capabilities/collection';

export type {
  ToastComponentProps,
  ToastTone,
  ToastPosition,
  ToastAction,
  StandardToastPayload,
  ToastPayload,
  RegisterToast,
  Toast,
  UseToastType,
} from './behaviors';
export type { ConfirmComponentProps } from './behaviors';

// Capabilities.
export {
  createCollectionProvider,
  createConfigProvider,
  createLangProvider,
  createLightDarkProvider,
} from './capabilities';

// Behaviors.
export {
  createApiProvider,
  ConfirmProvider,
  NavigatorProvider,
  useConfirm,
  useNavigator,
  ToastProvider,
  useToast,
  parseToastPayload,
} from './behaviors';

// Hooks & state utilities.
export {
  useHistoryState,
  createHistory,
  pushHistory,
  undoHistory,
  redoHistory,
  canUndo,
  canRedo,
  useStopwatch,
  formatStopwatchTime,
  useStagger,
  calculateStaggerDelay,
  StaggerProvider,
  useStaggerItem,
  useCollapsible,
} from './hooks';
export type {
  HistoryState,
  UseHistoryStateOptions,
  UseHistoryStateReturn,
  UseStopwatchOptions,
  UseStopwatchReturn,
  StaggerOptions,
  StaggerContextValue,
  StaggerProviderProps,
  CollapsibleTransitionType,
  CollapsibleSpringConfig,
  UseCollapsibleOptions,
  UseCollapsibleReturn,
} from './hooks';

// Icons.
import * as AlambreIcons from './components/icons';
export { AlambreIcons };

// Input components.
export { TimePicker } from './components/time';
export type { TimePickerProps } from './components/time';

// Storage.
export { createStorage } from './storage';
export type { RawStorage } from './storage';
export {
  getJson,
  setJson,
  removeJson,
  readCollection,
  writeCollection,
} from './storage';
