---
title: Behaviors Reference
summary: Application interaction patterns decoupled from presentation: NavigatorProvider, ConfirmProvider, ToastProvider, and createApiProvider.
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
} = useNavigator();
```
* `navigate(target: string, settings?: { subpage?: string })`: Navigates to a top-level page or a subpage.
* `previous()`: Returns to the previous page in history.
* `noPreviousPages: boolean`: True when at the root of navigation history.
* `currentPage`: Object containing the current React element in `.component`.
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


## 2. `ConfirmProvider` & `useConfirm`

Provides blocking confirmation dialogs resolved via Promises. The framework manages the pending request state; the application registers its own `ConfirmComponent` to define visual presentation.

### Provider Setup
```typescript
import { ConfirmProvider, type ConfirmComponentProps } from 'alambre';

export function ConfirmDialog({ confirm, onConfirm, onCancel }: ConfirmComponentProps) {
  return (
    <Modal visible transparent>
      <View>
        <Text>{confirm.title}</Text>
        <Button onPress={onCancel} title={confirm.cancelLabel ?? 'Cancel'} />
        <Button onPress={onConfirm} title={confirm.confirmLabel} />
      </View>
    </Modal>
  );
}

<ConfirmProvider ConfirmComponent={ConfirmDialog}>
  <App />
</ConfirmProvider>
```

### Hook Usage
```typescript
import { useConfirm } from 'alambre';

const { confirm } = useConfirm();

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

### Promise Lifecycle & Props Contract (`ConfirmComponentProps`)
The `confirm()` method pushes a pending confirmation request into the provider queue. When the user interacts with your custom `ConfirmComponent`:
* **`confirm`**: The active configuration payload `{ title, message, confirmLabel, cancelLabel, tone }`.
* **`onConfirm()`**: Settles the pending Promise with `true` and closes the modal.
* **`onCancel()`**: Settles the pending Promise with `false` and closes the modal.
* **`visible: boolean`**: True while a confirmation request is actively pending.

---

## 3. `ToastProvider` & `useToast`

Provides non-blocking, queued transient notification toasts. The framework provides the state machine, queue management, and contracts; the application provides the concrete visual component (`ToastComponent`).

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

### Provider Setup
```typescript
import { ToastProvider, type ToastComponentProps } from 'alambre';
import { TemplateToast } from './src/providers/toast';

<ToastProvider
  ToastComponent={TemplateToast}
  defaultDuration={4000}       // optional, default 4000ms
  delay={0}                    // optional, delay between consecutive toasts
  queueMode="queue"            // optional, 'queue' (default) or 'replace'
>
  <App />
</ToastProvider>
```

### Hook Usage (`useToast`)
```typescript
import { useToast } from 'alambre';

const { show, dismiss, clear, queueLength, toast } = useToast();
```

#### 1. Simple Quick Toast
```typescript
show({
  payload: 'Preferences saved successfully.',
  duration: 3000,
});
```

#### 2. Structured Semantic Toast (Top or Bottom)
```typescript
show({
  duration: 4000,
  payload: {
    title: 'Sync Complete',
    content: 'All records have been synchronized with the cloud.',
    tone: 'success',        // 'info' | 'success' | 'warning' | 'danger'
    position: 'bottom',     // 'top' (default) | 'bottom'
  },
});
```

#### 3. Actionable Interactive Toast
```typescript
show({
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

## 4. `createApiProvider`

Integrates TanStack React Query (`QueryClientProvider`) into an application and generates typed route/query/mutation helpers around a `fetch`-based request function.

### Signature
```typescript
import { createApiProvider } from 'alambre';

const api = createApiProvider({
  baseUrl: 'https://api.example.com',
  getHeaders: async () => ({ Authorization: `Bearer ${token}` }), // optional
  createQueryClient: () => new QueryClient(),                     // optional
});

const { ApiProvider, useApi, createRoute, createRoutes,
        createQueryHook, createMutationHook } = api;
```

### Options (`CreateApiProviderOptions`)
* `baseUrl: string`: Base URL prepended to every request path.
* `getHeaders?(): Promise<RequestHeaders | undefined> | RequestHeaders | undefined`: Per-request headers (typically auth).
* `createQueryClient?(): QueryClient`: Custom `QueryClient` factory; defaults to `new QueryClient()`.

### Return
* `ApiProvider`: Wraps the app in `QueryClientProvider` + the API context.
* `useApi()`: Returns `{ request }`, a typed `fetch` helper.
* `createRoute` / `createRoutes`: Type helpers to declare an endpoint/catalog (`ApiEndpoint`).
* `createQueryHook(endpoint)`: Builds a query hook from an `ApiEndpoint`.
* `createQueryHookFromRoute(route)`: Same, from a typed route.
* `createMutationHook(endpoint, settings?)`: Builds a mutation hook; `settings.invalidateKeys` invalidates queries on success.
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

