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
    tone: 'danger', // 'default' | 'danger'
  });

  if (confirmed) {
    // proceed with deletion
  }
};
```

---

## 3. `ToastProvider` & `useToast`

Provides non-blocking, queued transient notification toasts. The application provides `ToastComponent` to render the notification.

### Provider Setup
```typescript
import { ToastProvider, type ToastComponentProps } from 'alambre';

export function ToastBanner({ toast, dismiss }: ToastComponentProps) {
  return (
    <View style={styles.toast}>
      <Text>{toast.data.payload}</Text>
      <Pressable onPress={() => dismiss(toast.data.id)}>
        <Text>✕</Text>
      </Pressable>
    </View>
  );
}

<ToastProvider ToastComponent={ToastBanner}>
  <App />
</ToastProvider>
```

### Hook Usage
```typescript
import { useToast } from 'alambre';

const { show, dismiss, clear } = useToast();

// Trigger a toast notification
show({
  payload: 'Saved successfully!',
  timeout: 3000, // optional timeout in ms (default 4000)
});
```

---

## 4. `createApiProvider`

Integrates TanStack React Query (`QueryClientProvider`) into an application with optional default query options.

### Signature
```typescript
import { createApiProvider } from 'alambre';

const { ApiProvider, queryClient } = createApiProvider({
  defaultOptions: {
    queries: { retry: 2 },
  },
});
```
