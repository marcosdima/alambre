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
* `pageKey`: Unique identifier string of the current route (useful as an animation key).
* `scrollTop`: Current scroll Y offset of the page container.

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
  const confirmed = await confirm({
    title: 'Are you sure?',
    message: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    tone: 'danger', // 'primary' | 'danger'
  });

  if (confirmed) {
    // proceed with deletion
  }
};
```

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
