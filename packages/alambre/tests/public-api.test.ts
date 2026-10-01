import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as Alambre from '../src/index';

vi.mock('react-native-reanimated', () => {
  const key = '__alambreIconSharedValues__';
  return {
    default: {
      createAnimatedComponent: (Component: unknown) => Component,
    },
    useSharedValue: (value: number) => {
      const box = { value };
      const g = globalThis as unknown as Record<string, { value: number }[]>;
      if (!g[key]) g[key] = [];
      g[key].push(box);
      return box;
    },
    withTiming: (toValue: number) => toValue,
    useAnimatedProps: (factory: () => unknown) => factory(),
    useReducedMotion: () => false,
  };
});

vi.mock('react-native-svg', async () => {
  const React = await import('react');
  const { View } = await import('react-native');
  const host = (props: Record<string, unknown>) => React.createElement(View, props);
  return { default: host, Svg: host, Circle: host, Line: host, Path: host };
});

describe('public API — value surface', () => {
  it('exposes the intentional value contracts', () => {
    expect(typeof Alambre.Button).toBe('function');
    expect(typeof Alambre.Stepper).toBe('function');
    expect(typeof Alambre.useStepper).toBe('function');
    expect(typeof Alambre.Slider).toBe('function');
    expect(typeof Alambre.useSlider).toBe('function');
    expect(typeof Alambre.SegmentedControl).toBe('function');
    expect(typeof Alambre.useSelect).toBe('function');
    expect(typeof Alambre.Input).toBe('function');
    expect(typeof Alambre.createConfigProvider).toBe('function');
    expect(typeof Alambre.createLangProvider).toBe('function');
    expect(typeof Alambre.createLightDarkProvider).toBe('function');
    expect(typeof Alambre.createCollectionProvider).toBe('function');
    expect(typeof Alambre.createApiProvider).toBe('function');
    expect(typeof Alambre.NavigatorProvider).toBe('function');
    expect(typeof Alambre.useNavigator).toBe('function');
    expect(typeof Alambre.initNavigator).toBe('function');
    expect(typeof Alambre.ToastProvider).toBe('function');
    expect(typeof Alambre.useToast).toBe('function');
    expect(typeof Alambre.ConfirmProvider).toBe('function');
    expect(typeof Alambre.useConfirm).toBe('function');
    expect(typeof Alambre.createStorage).toBe('function');
    expect(typeof Alambre.getJson).toBe('function');
    expect(typeof Alambre.setJson).toBe('function');
    expect(typeof Alambre.removeJson).toBe('function');
    expect(typeof Alambre.readCollection).toBe('function');
    expect(typeof Alambre.writeCollection).toBe('function');
    expect(typeof Alambre.useHistoryState).toBe('function');
    expect(typeof Alambre.createHistory).toBe('function');
    expect(typeof Alambre.pushHistory).toBe('function');
    expect(typeof Alambre.undoHistory).toBe('function');
    expect(typeof Alambre.redoHistory).toBe('function');
    expect(typeof Alambre.canUndo).toBe('function');
    expect(typeof Alambre.canRedo).toBe('function');
    expect(typeof Alambre.useStopwatch).toBe('function');
    expect(typeof Alambre.formatStopwatchTime).toBe('function');
    expect(typeof Alambre.useStagger).toBe('function');
    expect(typeof Alambre.calculateStaggerDelay).toBe('function');
    expect(typeof Alambre.StaggerProvider).toBe('function');
    expect(typeof Alambre.useStaggerItem).toBe('function');
    expect(typeof Alambre.useCollapsible).toBe('function');
    expect(typeof Alambre.DndProvider).toBe('function');
    expect(typeof Alambre.useDnd).toBe('function');
    expect(typeof Alambre.useDraggable).toBe('function');
    expect(typeof Alambre.useDroppable).toBe('function');
    expect(typeof Alambre.Draggable).toBe('function');
    expect(typeof Alambre.Droppable).toBe('function');
    expect(typeof Alambre.SortableRow).toBe('function');
    expect(typeof Alambre.useCarousel).toBe('function');
    expect(typeof Alambre.calculateSnapInterval).toBe('function');
    expect(typeof Alambre.calculateActiveIndex).toBe('function');
    expect(typeof Alambre.getScrollTargetForIndex).toBe('function');
    expect(typeof Alambre.useDeck).toBe('function');
    expect(typeof Alambre.useWheelPicker).toBe('function');
    expect(typeof Alambre.AlambreIcons).toBe('object');
  });

  it('exposes the icon family alongside its low-level primitives', () => {
    const { AlambreIcons } = Alambre;
    expect(typeof AlambreIcons.Arrow).toBe('function');
    expect(typeof AlambreIcons.Cross).toBe('function');
    expect(typeof AlambreIcons.Tick).toBe('function');
    expect(typeof AlambreIcons.Sun).toBe('function');
    expect(typeof AlambreIcons.Moon).toBe('function');
    expect(typeof AlambreIcons.Circle).toBe('function');
    expect(typeof AlambreIcons.Line).toBe('function');
    expect(typeof AlambreIcons.Path).toBe('function');
    for (const name of [
      'Heart', 'Undo', 'Redo', 'Refresh', 'Trophy', 'Play', 'Gear', 'Zap', 'Leaf',
      'Keys', 'Wallet', 'Phone', 'Documents', 'Umbrella', 'Water', 'Meds',
      'Plug', 'Charger', 'Backpack', 'Laptop', 'Headphones', 'Glasses', 'Book',
      'ShoppingBag', 'Coffee', 'Watch', 'Gift', 'CreditCard',
      'CircleCheck', 'CircleX', 'TriangleAlert',
    ] as const) {
      expect(typeof AlambreIcons[name]).toBe('function');
    }
  });
});

describe('public API — type surface', () => {
  it('promotes Storage, IconAnimationConfig and IconProps as first-class contracts', () => {
    const storage: Alambre.Storage = {
      get: async () => null,
      set: async () => undefined,
      remove: async () => undefined,
    };
    const iconAnimation: Alambre.IconAnimationConfig = {
      drawAnimation: (value) => value,
      resetAnimation: (value) => value,
      fillOpacity: 1,
      strokeDasharray: 100,
    };
    const iconProps: Alambre.IconProps = {
      drawIt: true,
      rotation: 90,
      strokeOffset: 10,
      iconAnimation,
    };

    const circle: ComponentProps<typeof Alambre.AlambreIcons.Circle> = {
      circle: { cx: 50, cy: 50, r: 35 },
      drawIt: true,
      iconAnimation,
    };
    const line: ComponentProps<typeof Alambre.AlambreIcons.Line> = {
      line: { x1: 0, y1: 0, x2: 10, y2: 10 },
      iconAnimation,
    };

    expect(storage).toBeDefined();
    expect(iconAnimation).toBeDefined();
    expect(iconProps).toBeDefined();
    expect(circle).toBeDefined();
    expect(line).toBeDefined();
  });

  it('keeps the existing consumer-facing type contracts', () => {
    const buttonProps: Alambre.ButtonProps = { onPress: () => undefined };
    const buttonState: Alambre.ButtonState = {
      pressed: false,
      disabled: false,
      loading: false,
    };
    const stepperProps: Alambre.StepperProps = { value: 0 };
    const stepperState: Alambre.StepperState = {
      value: 0,
      canIncrement: true,
      canDecrement: false,
      increment: () => undefined,
      decrement: () => undefined,
      setValue: () => undefined,
      disabled: false,
    };
    const inputProps: Alambre.InputProps = { hasValue: true, children: null };
    const inputState: Alambre.InputState = {
      focused: false,
      disabled: false,
      hasValue: true,
      error: false,
    };
    const sliderProps: Alambre.SliderProps = { value: 50 };
    const sliderState: Alambre.SliderState = {
      value: 50,
      min: 0,
      max: 100,
      step: 1,
      ratio: 0.5,
      percentage: 50,
      disabled: false,
      setValueFromRatio: () => undefined,
      setValue: () => undefined,
      increment: () => undefined,
      decrement: () => undefined,
    };
    const segmentedProps: Alambre.SegmentedControlProps = {
      value: 'a',
      options: [{ value: 'a', label: 'A' }],
    };
    const selectState: Alambre.SelectState = {
      value: 'a',
      options: [{ value: 'a', label: 'A' }],
      disabled: false,
      selectedIndex: 0,
      isSelected: () => true,
      select: () => undefined,
      selectIndex: () => undefined,
    };
    const toastComponentProps: Alambre.ToastComponentProps = {
      toast: { data: { id: 'toast', duration: 1000 }, startedAt: new Date() },
      dismiss: () => undefined,
      clear: () => undefined,
      next: () => undefined,
      queueLength: 0,
    };
    const confirmComponentProps: Alambre.ConfirmComponentProps = {
      confirm: { title: 'Sure?', confirmLabel: 'Delete' },
      onConfirm: () => undefined,
      onCancel: () => undefined,
    };
    const page: Alambre.Page = { component: null };
    const navObj: Alambre.NavigatorObject = { home: page };
    const navReturn: Alambre.NavigatorReturn = {
      currentPage: page,
      pageKey: 'home',
      noPreviousPages: true,
      scrollTop: 0,
      navigate: () => undefined,
      previous: () => undefined,
      setScrollTop: () => undefined,
    };
    const navSettings: Alambre.NavigationSettings = { subpage: 'detail' };
    const configState: Alambre.ConfigState<{ key: string }> = { config: { key: 'val' }, loading: false };
    const useConfigType: Alambre.UseConfigType<{ key: string }> = {
      config: { key: 'val' },
      loading: false,
      saveField: async () => undefined,
    };
    const historyState: Alambre.HistoryState<number> = { past: [], present: 1, future: [] };
    const stopwatchOptions: Alambre.UseStopwatchOptions = { autoStart: true, initialSeconds: 10 };
    const staggerOptions: Alambre.StaggerOptions = { initialDelay: 50, staggerMs: 30, maxDelay: 400 };
    const staggerContext: Alambre.StaggerContextValue = { getDelay: () => 50, isReducedMotion: false };
    const staggerProps: Alambre.StaggerProviderProps = { children: null, initialDelay: 50 };
    const layoutBounds: Alambre.LayoutBounds = { x: 0, y: 0, width: 100, height: 100 };
    const droppableRegistration: Alambre.DroppableRegistration = { id: 'zone-1', bounds: layoutBounds };
    const activeDragState: Alambre.ActiveDragState = { id: 'drag-1', touchX: 10, touchY: 10, originBounds: null, hoveredZoneId: null };
    const dropEvent: Alambre.DropEvent = { draggableId: 'drag-1', droppableId: 'zone-1' };
    const kinetics: Alambre.DraggableKineticsConfig = { activeScale: 1.05, maxVelocityTiltDeg: 10 };
    const sortableItem: Alambre.SortableItem = { id: 'item-1' };
    const dropMode: Alambre.DropAnimationMode = 'seamless';
    const neighborMode: Alambre.NeighborShiftMode = 'glide';
    const carouselConfig: Alambre.UseCarouselConfig = {
      cardWidth: 300,
      cardGap: 16,
      totalItems: 5,
    };
    const deckConfig: Alambre.UseDeckConfig<string> = {
      initialCards: ['a', 'b'],
    };
    const wheelOptions: Alambre.UseWheelPickerOptions = {
      itemCount: 24,
      selected: 0,
      onSelect: () => undefined,
      rowHeight: 44,
    };

    expect(buttonProps).toBeDefined();
    expect(buttonState).toBeDefined();
    expect(stepperProps).toBeDefined();
    expect(stepperState).toBeDefined();
    expect(sliderProps).toBeDefined();
    expect(sliderState).toBeDefined();
    expect(segmentedProps).toBeDefined();
    expect(selectState).toBeDefined();
    expect(inputProps).toBeDefined();
    expect(inputState).toBeDefined();
    expect(toastComponentProps).toBeDefined();
    expect(confirmComponentProps).toBeDefined();
    expect(page).toBeDefined();
    expect(historyState).toBeDefined();
    expect(stopwatchOptions).toBeDefined();
    expect(staggerOptions).toBeDefined();
    expect(staggerContext).toBeDefined();
    expect(staggerProps).toBeDefined();
    expect(layoutBounds).toBeDefined();
    expect(droppableRegistration).toBeDefined();
    expect(activeDragState).toBeDefined();
    expect(dropEvent).toBeDefined();
    expect(kinetics).toBeDefined();
    expect(sortableItem).toBeDefined();
    expect(dropMode).toBeDefined();
    expect(neighborMode).toBeDefined();
    expect(carouselConfig).toBeDefined();
    expect(deckConfig).toBeDefined();
    expect(wheelOptions).toBeDefined();
    expect(navObj).toBeDefined();
    expect(navReturn).toBeDefined();
    expect(navSettings).toBeDefined();
    expect(configState).toBeDefined();
    expect(useConfigType).toBeDefined();
  });

  it('does not expose internal/plumbing namespaces', () => {
    // @ts-expect-error DefaultReact must not be public API.
    void Alambre.DefaultReact;
    // @ts-expect-error ActionTypes must not be public API.
    void Alambre.ActionTypes;
    // @ts-expect-error HooksTypes must not be public API.
    void Alambre.HooksTypes;
    // @ts-expect-error IconstTypes must not be public API.
    void Alambre.IconstTypes;
    // @ts-expect-error AnimadoTypes must not be public API (moved to the application).
    void Alambre.AnimadoTypes;
    // @ts-expect-error AnimadoView must not be public API (moved to the application).
    void Alambre.AnimadoView;
    // @ts-expect-error BaseModule must not be public API (internal core).
    void Alambre.BaseModule;
    // @ts-expect-error createModuleProvider must not be public API (internal core).
    void Alambre.createModuleProvider;
    // @ts-expect-error NavigatorTypes must not be public API (dismantled into top-level types).
    void Alambre.NavigatorTypes;
  });
});
