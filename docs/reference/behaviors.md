---
title: Behaviors Reference
summary: Application interaction patterns decoupled from presentation: NavigatorProvider, ConfirmHost & confirm, ToastHost & toast, createApi, useCarousel, useDeck, useWheelPicker, and useContinuousPress.
---

# Behaviors Reference

Behaviors provide common application interaction patterns decoupled from visual presentation. The framework provides the state machine and contracts; the application provides the concrete visual component.

---

## 1. `NavigatorProvider` & `useNavigator`

Provides hierarchical page and subpage navigation without native navigation dependencies.

### Signature
```typescript
import { NavigatorProvider, useNavigator } from 'alambre';

<NavigatorProvider pages={pagesConfig}>
  <AppNavigatorBody useNavigator={useNavigator} />
</NavigatorProvider>
```

### Configuration Schema
```typescript
const pages = {
  home: {
    component: <HomeScreen />,
    subpages: {
      details: { component: <DetailsScreen /> },
    },
  },
  settings: {
    component: <SettingsScreen />,
  },
};
```

### Hook Return
```typescript
const {
  navigate,
  previous,
  currentPage,
  pageKey,
  noPreviousPages,
  scrollTop,
  setScrollTop,
} = useNavigator<TRoute, TSubpage>();
```
* `navigate(target: TRoute, settings?: NavigationSettings<TSubpage>)`: Navigates to a top-level page or a subpage with strict compile-time route validation.
* `previous()`: Returns to the previous page in history.
* `noPreviousPages: boolean`: True when at the root of navigation history.
* `currentPage: Page`: Object containing the current React element in `.component`.
* `pageKey`: Unique identifier string of the current route (useful as an animation key for Reanimated).
* `scrollTop`: Current scroll Y offset of the page container.
* `setScrollTop(y: number): void`: Updates stored scroll offset for the current page.

### Canonical Production Example: `AppNavigatorBody`
```typescript
import { useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, BackHandler, StyleSheet } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { useNavigator, AlambreIcons } from 'alambre';

export function AppNavigatorBody() {
  const {
    currentPage,
    pageKey,
    previous,
    noPreviousPages,
    scrollTop,
    setScrollTop,
  } = useNavigator();

  const scrollRef = useRef<ScrollView>(null);

  // Restore scroll offset when route transitions settle
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: scrollTop, animated: false });
  }, [pageKey, scrollTop]);

  // Android hardware back button integration
  useEffect(() => {
    const onBackPress = () => {
      if (!noPreviousPages) {
        previous();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [noPreviousPages, previous]);

  return (
    <View style={styles.container}>
      {/* Header bar with back button when in subpage history */}
      <View style={styles.header}>
        {!noPreviousPages && (
          <Pressable onPress={previous} style={styles.backButton} accessibilityLabel="Go back">
            <AlambreIcons.Arrow rotation={180} color="#111827" lineWidth={3} />
          </Pressable>
        )}
        <Text style={styles.headerTitle}>{pageKey.toUpperCase()}</Text>
      </View>

      {/* Animated content viewport with scroll offset tracking */}
      <ScrollView
        ref={scrollRef}
        onScroll={(e) => setScrollTop(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          key={pageKey}
          entering={noPreviousPages ? FadeInRight.duration(200) : FadeInLeft.duration(200)}
          style={styles.pageWrapper}
        >
          {currentPage.component}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  backButton: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollContent: { flexGrow: 1 },
  pageWrapper: { flex: 1 },
});
```

---


## 2. `ConfirmHost`, `confirm`, and `useConfirm`

Provides blocking confirmation dialogs resolved via Promises. The underlying store is external (`core/use-external-store.ts`), meaning confirmations can be triggered **imperatively from anywhere** (inside components, service modules, or background tasks) without needing a React context.

The application mounts `ConfirmHost` (alias `ConfirmProvider`) once near the root of the UI tree to render its custom `ConfirmComponent`.

### Host Setup
```typescript
import { ConfirmHost, type ConfirmComponentProps } from 'alambre';

export function ConfirmDialog({ confirm, onConfirm, onCancel }: ConfirmComponentProps) {
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{confirm.title}</Text>
          {confirm.message && <Text style={styles.message}>{confirm.message}</Text>}
          <Button onPress={onCancel} title={confirm.cancelLabel ?? 'Cancel'} />
          <Button onPress={onConfirm} title={confirm.confirmLabel ?? 'Confirm'} />
        </View>
      </View>
    </Modal>
  );
}

// In your root layout or screen overlay container:
export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ConfirmHost ConfirmComponent={ConfirmDialog} />
    </>
  );
}
```

### Imperative Usage (Anywhere)
```typescript
import { confirm } from 'alambre';

const handleDelete = async () => {
  // Returns Promise<boolean>: resolves to true if confirmed, false if cancelled
  const confirmed = await confirm({
    title: 'Are you sure?',
    message: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    tone: 'danger', // 'primary' | 'danger'
  });

  if (confirmed) {
    await performDelete();
  }
};
```

> **Note:** `dismissConfirm()` is also exported top-level to cancel any pending confirmation dialog programmatically.

### Reactive Hook Usage (`useConfirm`)
If a component needs reactive access to the pending confirmation state or wants component-bound actions:
```typescript
import { useConfirm } from 'alambre';

const { current, confirm, dismiss, settle } = useConfirm();
```

### Props Contract (`ConfirmComponentProps`)
When `ConfirmHost` mounts your custom `ConfirmComponent`:
* **`confirm`**: The active configuration payload `{ title, message, confirmLabel, cancelLabel, tone }`.
* **`onConfirm()`**: Settles the pending Promise with `true` and closes the modal.
* **`onCancel()`**: Settles the pending Promise with `false` and closes the modal.

---

## 3. `ToastHost`, `toast`, and `useToast`

Provides non-blocking, queued transient notification toasts. Toast state runs on a decoupled external store (`createToastStore`), enabling **direct imperative calls (`toast.show()`) from anywhere** in your application without requiring a React component tree or context provider.

The application mounts `ToastHost` (alias `ToastProvider`) once near the root of the screen hierarchy to render the visual `ToastComponent`.

### Types & Contracts
```typescript
import type {
  ToastTone,
  ToastPosition,
  ToastAction,
  StandardToastPayload,
  ToastPayload,
  RegisterToast,
  Toast,
  ToastComponentProps,
  UseToastType,
} from 'alambre';
```

- **`ToastTone`**: `'info' | 'success' | 'warning' | 'danger'` — semantic tone for styling and iconography.
- **`ToastPosition`**: `'top' | 'bottom'` — vertical placement on the screen.
- **`ToastAction`**: `{ label: string; onPress: () => void; tone?: 'primary' | 'danger' | ToastTone }` — interactive secondary actions rendered inside the notification.
- **`StandardToastPayload`**: `{ content: string; title?: string; tone?: ToastTone; position?: ToastPosition }`.
- **`ToastPayload`**: `string | StandardToastPayload` — backward-compatible payload accepting plain text or structured properties.
- **`parseToastPayload(raw: unknown): StandardToastPayload`** — utility helper that normalizes strings and partial objects into a valid structured payload with defaults (`tone: 'info'`, `position: 'top'`).

### Host Setup
```typescript
import { ToastHost, type ToastComponentProps } from 'alambre';
import { TemplateToast } from './src/providers/toast';

// Mount once in your root layout:
export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastHost ToastComponent={TemplateToast} />
    </>
  );
}
```

### Imperative Usage (`toast.show()`) — Anywhere
You can import `toast` directly into services, network clients, background tasks, or component event handlers:

```typescript
import { toast } from 'alambre';

// 1. Simple Quick Toast
toast.show({
  payload: 'Preferences saved successfully.',
  duration: 3000,
});

// 2. Structured Semantic Toast (Top or Bottom)
toast.show({
  duration: 4000,
  payload: {
    title: 'Sync Complete',
    content: 'All records have been synchronized with the cloud.',
    tone: 'success',        // 'info' | 'success' | 'warning' | 'danger'
    position: 'bottom',     // 'top' (default) | 'bottom'
  },
});

// 3. Actionable Interactive Toast
toast.show({
  payload: {
    title: 'Item Deleted',
    content: 'The item was removed from your collection.',
    tone: 'danger',
    position: 'top',
  },
  actions: [
    {
      label: 'Undo',
      tone: 'primary',
      onPress: () => restoreItem(item.id),
    },
  ],
});
```

### Reactive Hook Usage (`useToast`)
If a component needs reactive state to render its own toast counter or dismiss controls:
```typescript
import { useToast } from 'alambre';

const { toast: currentToast, queueLength, show, dismiss, clear, next } = useToast();
```
### Lifecycle & Queue Semantics
- **Auto-Dismiss**: Standard toasts automatically dismiss after `duration ?? defaultDuration` milliseconds.
- **Actionable & Persistent Toasts**: Toasts with `persistent: true` or active `actions` **never auto-dismiss** prematurely. They remain visible until the user interacts with an action button, clicks the close button (✕), or swipes them away.
- **Queue Modes**:
  - `'queue'` (default): Consecutive notifications are appended to FIFO queue. The current toast renders with `+{queueLength}` badge.
  - `'replace'`: A new notification immediately supersedes the active one.
- **Programmatic Dismissal**:
  - `dismiss()`: Dismisses the active toast and advances the queue.
  - `dismiss(id)`: Removes a specific toast by ID (from active slot or pending queue).
  - `clear()`: Immediately dismisses the active toast and purges the entire pending queue.

### Swipe-to-Dismiss Architecture & Reanimated Decoupling
To support swipe gestures (`Gesture.Pan`) without visual glitches or teleportation on unmount, visual components must separate layout transitions from gesture transformations into two distinct layers:

1. **Outer Layout Wrapper (`cardWrapper`)**:
   Owns Reanimated layout animations: `entering={FadeInDown / FadeInUp}` and `exiting={isGestureDismissed ? undefined : exitAnimation}`.
2. **Inner Interactive Card (`card`)**:
   Owns gesture styles from `useAnimatedStyle` (`translateX`, `translateY`, clamped `opacity` via `Extrapolation.CLAMP`).
3. **Dynamic `exiting` Suppression**:
   When a swipe gesture dismisses the toast, set `isGestureDismissed = true` before calling `dismiss()`. This prevents Reanimated's layout animation from resetting the view to `(0, 0)` upon unmount.

The reference production component implementing this pattern is exported in [`apps/base-template/src/providers/toast.tsx`](../../apps/base-template/src/providers/toast.tsx).

---

## 4. `createApi` (alias `createApiProvider`)

Integrates TanStack React Query (`QueryClientProvider`) into an application and generates typed route/query/mutation hooks around a `fetch`-based request function without creating any internal Alambre React Context.

### Signature
```typescript
import { createApi } from 'alambre';

const api = createApi({
  baseUrl: 'https://api.example.com',
  getHeaders: async () => ({ Authorization: `Bearer ${token}` }), // optional
  createQueryClient: () => new QueryClient(),                     // optional
});

const {
  ApiProvider,
  createRoute,
  createRoutes,
  createQueryHook,
  createQueryHookFromRoute,
  createMutationHook,
  createMutationHookFromRoute,
  request,
} = api;
```

### Options (`CreateApiProviderOptions`)
* `baseUrl: string`: Base URL prepended to every request path.
* `getHeaders?(): Promise<RequestHeaders | undefined> | RequestHeaders | undefined`: Per-request headers (typically auth).
* `createQueryClient?(): QueryClient`: Custom `QueryClient` factory; defaults to `new QueryClient()`.

### Return
* `ApiProvider`: Wraps children in TanStack's `<QueryClientProvider>`.
* `request`: Typed `fetch` helper for direct requests.
* `createRoute` / `createRoutes`: Type helpers to declare an endpoint or catalog (`ApiEndpoint`).
* `createQueryHook(endpoint)`: Builds a React Query query hook from an `ApiEndpoint`.
* `createQueryHookFromRoute(route)`: Same, from a typed route.
* `createMutationHook(endpoint, settings?)`: Builds a mutation hook; `settings.invalidateKeys` automatically invalidates queries on success.
* `createMutationHookFromRoute(route, settings?)`: Same, from a typed route.

### Endpoint shape (`ApiEndpoint`)
```typescript
{
  key: QueryKey | ((variables) => QueryKey),
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', // GET/POST default per hook
  path: string | ((variables) => string),
  query?: (variables) => QueryParams | undefined,
  body?: (variables) => unknown,
  headers?: (variables) => RequestHeaders | undefined,
  transform?: (raw: unknown) => TResponse,
}
```

### Complete Production Example: Defining and Consuming API Routes

#### 1. Setup API Provider and Typed Routes (`services/api.ts`)
```typescript
import { createApiProvider } from 'alambre';

export const {
  ApiProvider,
  createRoutes,
  createQueryHook,
  createMutationHook,
} = createApiProvider({
  baseUrl: 'https://api.example.com/v1',
  getHeaders: async () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sample-token',
  }),
});

export type Task = { id: string; title: string; completed: boolean };

export const routes = createRoutes({
  getTasks: {
    key: ['tasks'],
    method: 'GET',
    path: '/tasks',
    transform: (raw) => raw as Task[],
  },
  createTask: {
    key: ['tasks', 'create'],
    method: 'POST',
    path: '/tasks',
    body: (variables: { title: string }) => variables,
  },
});

export const useTasks = createQueryHook(routes.getTasks);
export const useCreateTask = createMutationHook(routes.createTask, {
  invalidateKeys: [['tasks']], // Automatically refetches task list on success
});
```

#### 2. Consuming in a React Component (`views/TaskList.tsx`)
```typescript
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useTasks, useCreateTask } from '../services/api';

export function TaskList() {
  const { data: tasks, isLoading, error } = useTasks();
  const { mutate: addTask, isPending } = useCreateTask();

  if (isLoading) return <Text>Loading tasks...</Text>;
  if (error) return <Text>Failed to load tasks</Text>;

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskRow}>
            <Text style={styles.taskTitle}>{item.title}</Text>
          </View>
        )}
      />

      <Pressable
        disabled={isPending}
        onPress={() => addTask({ title: 'New Task' })}
        style={[styles.addButton, isPending && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>{isPending ? 'Adding...' : 'Add Task'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  taskRow: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  taskTitle: { fontSize: 16, color: '#111827' },
  addButton: { marginTop: 16, padding: 14, borderRadius: 8, backgroundColor: '#2563eb', alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});
```

---

## 5. `useCarousel` & Math Kinematics

Provides a headless content carousel interaction driver for horizontal card carousels with continuous Reanimated scroll tracking, discrete snap interval calculations, active index synchronization, and auto-play capabilities.

### Math Helpers
`alambre` exports pure mathematical calculations decoupled from React:
* `calculateSnapInterval(cardWidth: number, cardGap: number): number`: Computes total stride length for snapping (`Math.round(cardWidth + cardGap)`).
* `calculateActiveIndex(scrollX: number, snapInterval: number, totalItems: number): number`: Clamps and calculates the closest active card index from scroll position.
* `getScrollTargetForIndex(index: number, snapInterval: number, totalItems: number): number`: Computes target `x` coordinate for programmatic scrolling.

### Hook Signature
```typescript
import { useCarousel, type UseCarouselConfig } from 'alambre';

const {
  scrollRef,
  scrollX,
  scrollHandler,
  onMomentumScrollEnd,
  activeIndex,
  scrollToIndex,
  snapInterval,
} = useCarousel({
  cardWidth: 280,
  cardGap: 16,
  totalItems: items.length,
  autoPlay: true,          // optional, default false
  autoPlayInterval: 3000,  // optional, default 3000ms
});
```

### Production Example (`CarouselComponent.tsx`)
```tsx
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useCarousel } from 'alambre';

const CARD_WIDTH = Dimensions.get('window').width * 0.75;
const CARD_GAP = 16;

export function CustomCarousel({ items }: { items: { id: string; title: string }[] }) {
  const {
    scrollRef,
    scrollHandler,
    onMomentumScrollEnd,
    activeIndex,
    snapInterval,
  } = useCarousel({
    cardWidth: CARD_WIDTH,
    cardGap: CARD_GAP,
    totalItems: items.length,
  });

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentContainerStyle={{ paddingHorizontal: 20, gap: CARD_GAP }}
      >
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[styles.card, { width: CARD_WIDTH }, activeIndex === index && styles.activeCard]}
          >
            {/* 100% Application-owned Card JSX */}
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}
```

---

## 6. `useDeck` & Swipeable Stack Kinematics

Provides a headless swipeable card deck state machine with angular translation tracking, discard history for undo operations, and programmatic swipe triggers.

### Hook Signature
```typescript
import { useDeck, type UseDeckConfig } from 'alambre';

const {
  deck,
  history,
  activeIndex,
  swipeTranslation,
  popCard,
  undoLast,
  triggerProgrammaticSwipe,
  reset,
} = useDeck<CardItem>({
  initialCards: cards,
});
```

### Return Contract
* `deck: T[]`: Array of initial cards.
* `history: T[]`: Stack of previously dismissed cards (LIFO order).
* `activeIndex: SharedValue<number>`: Reanimated shared value pointing to the current top card.
* `swipeTranslation: SharedValue<number>`: Reanimated shared value tracking active drag offset.
* `popCard(direction: 'left' | 'right'): void`: Advances `activeIndex`, pushes the dismissed card to `history`, and clears `swipeTranslation`.
* `undoLast(): void`: Restores the top card from `history` back onto the deck and decrements `activeIndex`.
* `triggerProgrammaticSwipe(direction: 'left' | 'right'): void`: Dispatches a swipe programmatically if cards remain.
* `reset(): void`: Resets active index, clears history, and restores the initial deck.

### Production Example (`DeckComponent.tsx`)
```tsx
import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, interpolate, withSpring, runOnJS } from 'react-native-reanimated';
import { useDeck } from 'alambre';

export function CardStack({ items }: { items: { id: string; name: string }[] }) {
  const {
    deck,
    activeIndex,
    swipeTranslation,
    popCard,
    undoLast,
    triggerProgrammaticSwipe,
  } = useDeck({ initialCards: items });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      swipeTranslation.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 120) {
        const dir = e.translationX > 0 ? 'right' : 'left';
        runOnJS(popCard)(dir);
      } else {
        swipeTranslation.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: swipeTranslation.value },
      { rotateZ: `${interpolate(swipeTranslation.value, [-200, 200], [-15, 15])}deg` },
    ],
  }));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Text>{deck[activeIndex.value]?.name ?? 'Deck Empty'}</Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
```

---

## 7. `useWheelPicker` & Headless Wheel Kinematics

Provides a headless kinetic wheel picker interaction driver with momentum flick physics, spring settling, virtual multi-cycle infinite scrolling, and step tap interactions. 

Following the headless behavior architecture, `alambre` provides the touch gesture worklets, velocity physics, and reactive Reanimated `SharedValue` position tracking. The application completely owns the visual rendering, rows, selection highlight band, typography, and container layout.

### Hook Signature
```typescript
import { useWheelPicker, type UseWheelPickerOptions, type UseWheelPickerResult } from 'alambre';

const {
  currentPosition,
  gesture,
  allItems,
} = useWheelPicker({
  itemCount: 24,       // number of unique items (e.g. 24 hours, 60 minutes)
  selected: 8,         // currently selected index
  onSelect: (index) => handleSelect(index),
  rowHeight: 44,       // row height in pixels for gesture translation
  cycles: 5,           // optional: virtual cycles for infinite scroll illusion (default: 5)
});
```

### Options (`UseWheelPickerOptions`)
* `itemCount: number`: Total number of distinct items in the collection.
* `selected: number`: Currently active/selected integer index (`0` to `itemCount - 1`).
* `onSelect: (val: number) => void`: Callback fired on the JS thread when a selection settles.
* `rowHeight: number`: Pixel height of a single row, used to calculate drag distance and snapping targets.
* `cycles?: number`: Number of repeated cycles generated in `allItems` to create the illusion of seamless continuous scrolling (default: `5`).

### Return Contract (`UseWheelPickerResult`)
* `currentPosition: SharedValue<number>`: Continuous fractional row offset on the UI thread, tracking drag gestures and momentum spring animations. Use with `useAnimatedStyle` to drive column `translateY`.
* `gesture: ReturnType<typeof Gesture.Exclusive>`: Combined Pan + Tap gesture to attach directly to `<GestureDetector gesture={gesture}>`.
  - **Pan Gesture:** Translates vertical drag into row movements with velocity-weighted spring flick settling (`stiffness: 220, damping: 24, mass: 0.6`). Recenters seamlessly when scrolled past boundaries.
  - **Tap Gesture:** Tapping above or below the selection band automatically steps backward or forward by 1 item with smooth timing.
* `allItems: number[]`: Pre-computed flattened array of cycle indices `[0..itemCount-1, 0..itemCount-1, ...]`.

### Production Example (`SwipeableTimePicker.tsx`)
```tsx
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useWheelPicker } from 'alambre';

const ROW_HEIGHT = 44;
const VISIBLE_ROWS = 3;

export function WheelColumn({
  itemCount,
  selected,
  onSelect,
  format = (val) => val.toString().padStart(2, '0'),
}: {
  itemCount: number;
  selected: number;
  onSelect: (val: number) => void;
  format?: (val: number) => string;
}) {
  const { currentPosition, gesture, allItems } = useWheelPicker({
    itemCount,
    selected,
    onSelect,
    rowHeight: ROW_HEIGHT,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ROW_HEIGHT - currentPosition.value * ROW_HEIGHT }],
  }));

  return (
    <View style={styles.wheelColumn}>
      {/* 100% App-owned Selection Band */}
      <View pointerEvents="none" style={styles.selectionBand} />

      <GestureDetector gesture={gesture}>
        <View style={styles.gestureTarget}>
          <Animated.View style={[styles.columnContent, animatedStyle]}>
            {allItems.map((item, idx) => (
              <View key={`${item}-${idx}`} style={styles.row}>
                <Text style={styles.rowText}>{format(item)}</Text>
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wheelColumn: { height: ROW_HEIGHT * VISIBLE_ROWS, overflow: 'hidden', width: 64 },
  gestureTarget: { flex: 1 },
  columnContent: { alignItems: 'center' },
  row: { height: ROW_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  rowText: { fontSize: 20, fontWeight: '600' },
  selectionBand: {
    position: 'absolute',
    top: ROW_HEIGHT,
    left: 0,
    right: 0,
    height: ROW_HEIGHT,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
});
```

---

## 8. `useContinuousPress` & Hold-to-Repeat Gestures

Provides headless continuous press gesture coordination ("hold tap") for rapid interaction controls such as steppers, counters, volume adjustment, and fast-forward scrubbing.

### Mechanism & Lifecycle

1. **Immediate Initial Actuation:** When the user touches down (`onPressIn`), `onPress` fires immediately so single taps remain instantaneous with zero latency.
2. **Hold Threshold (`delay`):** A timeout is initiated for `delay` ms (default: `500ms`). If released before `delay` expires, the gesture is treated as a normal single tap.
3. **Continuous Repetition (`interval`):** If held past `delay`, an interval timer starts repeatedly invoking `onPress` at the base `interval` rate (default: `100ms`).
4. **Dynamic Acceleration (`intervalMultiplier`):** After every repeating tick, the interval period is scaled by `intervalMultiplier` (`currentInterval = Math.max(10, currentInterval * intervalMultiplier)`). Setting `intervalMultiplier: 0.9` causes repetitions to accelerate smoothly the longer the user holds the button, clamped at a safe 10ms threshold.
5. **Clean Release:** When released (`onPressOut`), all active timers and pending intervals are cleared immediately.
6. **Callback Stability:** Internally tracks `onPress` with a React ref (`savedOnPress`), guaranteeing that state updates in parent components never reset active hold timers or cause timer drift.

### Hook Signature

```typescript
import { useContinuousPress, type UseContinuousPressOptions } from 'alambre';

const handlers = useContinuousPress({
  onPress: () => handleIncrement(),
  delay: 400,
  interval: 100,
  intervalMultiplier: 0.9,
});
```

### Options Contract (`UseContinuousPressOptions`)

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `onPress` | `() => void` | **Required** | Callback invoked on initial touch and on subsequent hold repetitions. |
| `delay` | `number` | `500` | Duration in milliseconds the user must hold before repetition begins. |
| `interval` | `number` | `100` | Initial milliseconds between repeated invocations. |
| `intervalMultiplier` | `number` | `1` | Multiplier applied to interval after each firing. Values `< 1` accelerate firing frequency. |

### Return Contract

Returns `{ onPressIn: () => void, onPressOut: () => void }` designed to spread directly onto React Native `<Pressable>` or custom gesture responders.

### Kinetics Cross-Reference

While `useContinuousPress` drives the temporal pacing logic on the JS thread, visual feedback should pair with `kinetics.ts` spring profiles for physical responsiveness:
* **Interactive Button Press:** Pair with `kinetics.spring.snappy` (`{ damping: 20, mass: 1, stiffness: 250 }`) for instantaneous button depth / scale depression on touch down.
* **Rolling Value Counters:** Pair rapidly incrementing numeric values with `kinetics.spring.bouncy` (`{ damping: 14, mass: 1, stiffness: 150 }`) or `kinetics.spring.snappy` to give rolling numbers tactile punch as speed accelerates.

### Production Example: Wrapping a `Pressable`

```tsx
import React from 'react';
import { Pressable, Text, StyleSheet, type PressableProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useContinuousPress, kinetics } from 'alambre';

interface ContinuousButtonProps extends Omit<PressableProps, 'onPress'> {
  onPress: () => void;
  label: string;
  delay?: number;
  interval?: number;
  intervalMultiplier?: number;
}

export function ContinuousButton({
  onPress,
  label,
  delay = 400,
  interval = 100,
  intervalMultiplier = 0.9,
  disabled,
  style,
  ...props
}: ContinuousButtonProps) {
  const scale = useSharedValue(1);

  const continuousHandlers = useContinuousPress({
    onPress,
    delay,
    interval,
    intervalMultiplier,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    // Animate scale down with snappy kinetics
    scale.value = withSpring(0.92, kinetics.spring.snappy);
    continuousHandlers.onPressIn();
  };

  const handlePressOut = () => {
    // Restore scale on release
    scale.value = withSpring(1, kinetics.spring.snappy);
    continuousHandlers.onPressOut();
  };

  return (
    <Pressable
      {...props}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.button, disabled && styles.disabled, style as any]}
      accessibilityRole="button"
    >
      <Animated.View style={animatedStyle}>
        <Text style={styles.text}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
});
```



