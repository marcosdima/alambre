export {
  Button,
  Stepper,
  useStepper,
  Slider,
  useSlider,
  SegmentedControl,
  useSelect,
  Input,
  HorizontalPicker,
  Switch,
} from './components/base/input';
export { AnimatedCounter } from './components/base/display';
export type {
  ButtonProps,
  ButtonState,
  StepperRootProps as StepperProps,
  StepperRootProps,
  StepperButtonProps,
  StepperValueProps,
  StepperOptions,
  StepperState,
  SliderRootProps as SliderProps,
  SliderRootProps,
  SliderComponentProps,
  SliderOptions,
  SliderState,
  SegmentedControlProps,
  SelectOption,
  SelectOptions,
  SelectState,
  InputRootProps as InputProps,
  InputRootProps,
  InputFieldProps,
  InputState,
  InputContextValue,
  SwitchProps,
  SwitchSize,
} from './components/base/input';
export type { AnimatedCounterProps } from './components/base/display';

// Navigator types.
export type {
  Page,
  NavigatorObject,
  NavigatorReturn,
  NavigatorProviderProps,
  NavigationSettings,
  AnimationDefault,
} from './types/navigator';

// Capability types.
export type { ConfigState, UseConfigType } from './capabilities/config';
export type { LangDictionary, Langs, LangState, UseLangType, CreateLangReturn } from './capabilities/lang';
export type { UseCollectionType } from './capabilities/collection';
export type {
  SensoryCuesState,
  SensoryCuePayload,
  CreateSensoryCuesOptions,
  SensoryCuesActions,
  UseSensoryCuesReturn,
} from './capabilities/sensory';


export type { Storage } from './types/actions';
export type { IconAnimationConfig } from './types/hooks';
export type { IconProps } from './types/icons';

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
  createCollection,
  createCollectionProvider,
  createConfig,
  createConfigProvider,
  createLang,
  createLangProvider,
  createLightDark,
  createLightDarkProvider,
  createSensoryCues,
  createSensoryCuesProvider,
} from './capabilities';

// Behaviors.
export {
  createApi,
  createApiProvider,
  ConfirmProvider,
  ConfirmHost,
  useConfirm,
  confirm,
  dismissConfirm,
  NavigatorProvider,
  useNavigator,
  initNavigator,
  ToastProvider,
  ToastHost,
  useToast,
  toast,
  parseToastPayload,
  useCarousel,
  calculateSnapInterval,
  calculateActiveIndex,
  getScrollTargetForIndex,
  useDeck,
  useWheelPicker,
  useBottomSheet,
  useDialog,
  CountUp,
  Typewriter,
  Scramble,
  Marquee,
  WavyText,
  SlideInText,
  DropInTitle,
  HangingTitle,
  NavigatorHost,
} from './behaviors';
export type { NavigatorHostProps } from './behaviors';
export type { UseCarouselConfig, UseDeckConfig, UseWheelPickerOptions, UseWheelPickerResult, UseBottomSheetOptions, BottomSheetSpringConfig, UseDialogOptions, CountUpProps, TypewriterProps, ScrambleProps, MarqueeProps, WavyTextProps, SlideInTextProps, DropInTitleProps, HangingTitleProps } from './behaviors';

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
  calculateBudgetedStaggerDelay,
  StaggerProvider,

  useStaggerItem,
  useCollapsible,
  useSwipeableRow,
  useContinuousPress,
  useLoopClock,

  wrapPhase,
  useHarmonicMotion,
  harmonicValue,
  useRipplePulse,
  rippleSample,
  useWavefront,
  useKineticOrchestrator,
  WavefrontProvider,
  useWavefrontItem,
  KineticOrchestratorProvider,
  useKineticOrchestratorItem,
  usePressKinetics,
  useSpatialFlip,
  useFlightTrajectory,
  useKineticSwipe,
  useKineticCarousel,
  useKineticCarouselItem,
  KineticCarouselContext,
  KineticCarouselProvider,
  useKineticPipeline,
  useKineticChoreography,
  useSpatialToss,
  useCardToss,
  useCascadeFlight,
  useDealCascade,
  useCascadeFlightItem,
  reorderHandItems,
  resolveHandReorderIndex,
  useInteractiveHand,
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
  UseSwipeableRowConfig,
  UseSwipeableRowReturn,
  SwipeDirection,
  LoopClock,
  LoopClockOptions,
  HarmonicProfile,
  HarmonicMotionOptions,
  RipplePulseOptions,
  RippleWave,
  UseRipplePulseReturn,
  WavefrontCurve,
  WavefrontPreset,
  WavefrontItemPreset,
  WavefrontStyleWorklet,
  WavefrontProviderProps,
  UseWavefrontOptions,
  UseWavefrontReturn,
  UseWavefrontItemOptions,
  UseWavefrontItemReturn,
  UseKineticOrchestratorOptions,
  UseKineticOrchestratorReturn,
  KineticOrchestratorProviderProps,
  UseKineticOrchestratorItemOptions,
  UseKineticOrchestratorItemReturn,
  KineticPreset,
  KineticItemPreset,
  UsePressKineticsOptions,
  UsePressKineticsReturn,
  UseSpatialFlipOptions,
  UseSpatialFlipReturn,
  Point2D,
  FlightStartOverrides,
  UseFlightTrajectoryOptions,
  UseFlightTrajectoryReturn,
  KineticSwipeDirection,
  UseKineticSwipeOptions,
  UseKineticSwipeReturn,
  UseKineticCarouselOptions,
  UseKineticCarouselReturn,
  UseKineticCarouselItemOptions,
  UseKineticCarouselItemReturn,
  KineticCarouselProviderProps,
  KineticPipelineStage,
  KineticPipelinePoint2D,
  KineticVelocity2D,
  KineticPipelineTransitionOptions,
  KineticPipelineQueueItem,
  UseKineticPipelineOptions,
  UseKineticPipelineReturn,
  KineticTrackValues,
  KineticStepTrajectory,
  KineticStepOptions,
  UseKineticChoreographyOptions,
  KineticChainBuilder,
  UseKineticChoreographyReturn,
  UseSpatialTossOptions,
  UseSpatialTossReturn,
  UseCardTossOptions,
  UseCardTossReturn,
  UseCascadeFlightOptions,
  UseCascadeFlightReturn,
  UseDealCascadeOptions,
  UseDealCascadeReturn,
  UseCascadeFlightItemOptions,
  UseCascadeFlightItemReturn,
  UseInteractiveHandOptions,
  UseInteractiveHandReturn,
} from './hooks';




// Icons.
import * as AlambreIcons from './components/icons';
export { AlambreIcons };

// Input components.

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

// Drag and drop primitives.
export {
  DndProvider,
  useDnd,
  useDraggable,
  useDroppable,
  Draggable,
  Droppable,
  SortableRow,
} from './components/dnd';
export type {
  LayoutBounds,
  DroppableRegistration,
  ActiveDragState,
  DropEvent,
  DndContextValue,
  DndProviderProps,
  DraggableKineticsConfig,
  UseDraggableOptions,
  UseDraggableReturn,
  UseDroppableOptions,
  UseDroppableReturn,
  DraggableRenderProps,
  DraggableProps,
  DroppableRenderProps,
  DroppableProps,
  SortableItem,
  DropAnimationMode,
  NeighborShiftMode,
  SortableRowProps,
} from './types/dnd';
// Core state & kinetics.
export {
  createStore,
  useExternalStore,
  kinetics,
  rubberBandFriction,
  criticallyDampedCurve,
  bouncyCurve,
  cubicEaseOutCurve,
  polynomialOvershootCurve,
  calculateWavefrontPhase,
  parabolicAltitudeCurve,
  calculateHandFan,
  calculateResponsiveHandFan,
  calculateCarouselTransform,
  calculateSwipeTilt,
  pointInBounds,
  findTargetDropZone,
  getZoneCenter,
  generateStackJitter,
  projectTossLanding,
  resolveTossDynamics,
  computeSpatialCascadePlan,
  computeDealCascadePlan,
  sampleFlightTrajectory,
  linearTrajectory,
  parabolicTrajectory,
  arcTrajectory,
  quadraticBezier,
  cubicBezier,
  transferVelocity,
  projectEndpoint,
  blendScalar,
  calculateCriticalDamping,
  calculateDampingRatio,
  makeCriticallyDampedConfig,
} from './core';
export type {
  Store,
  StoreListener,
  WavefrontPhaseOptions,
  HandFanOptions,
  HandFanItemTransform,
  ResponsiveHandFanOptions,
  HandFanSlot,
  ResponsiveHandFanResult,
  SpatialRect,
  SpatialDropZone,
  StackJitter,
  ResolveTossOptions,
  TossResolution,
  SpatialCascadeOptions,
  SpatialFlightSpec,
  SpatialCascadePlan,
  FlightInterpolationState,
  CarouselPreset,
  CarouselItemTransform,
  Point3D,
  TransferVelocityOptions,
} from './core';



// Spatial components.
export {
  AccordionItem,
  InteractiveCard,
  StepFlow,
  useStepFlow,
  StepFlowControls,
  SpatialSpace,
  useSpatialSpace,
  useSpatialTarget,
  useSpatialVector,
} from './components/spatial';
export type {
  AccordionItemProps,
  InteractiveCardProps,
  StepFlowDirection,
  StepFlowContextType,
  StepFlowControlsProps,
  SpatialTargetMeasurement,
  SpatialVector,
  SpatialSpaceContextValue,
  SpatialSpaceProps,
  UseSpatialTargetOptions,
  UseSpatialTargetReturn,
} from './components/spatial';

// Animated Icons & Helpers.
export { createAnimatedIcon, MorphIcon } from './components/icons/base';
export type { AnimatedIconConfig, AnimatedIconProps, MorphIconProps } from './components/icons/base';
export { HomeIcon, SettingsIcon } from './components/icons/generated';


