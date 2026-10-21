# Testing

## 16. E2E Testing with Maestro & Out-of-App Transitions

End-to-end testing with Maestro must account for interactions that navigate outside the application's view hierarchy:

### System settings and external URLs

1. **System settings (`Linking.openSettings()`):**
   * Tapping system settings opens `com.android.settings`.
   * To return cleanly without relying on brittle relative `back` presses, use `launchApp: { clearState: false }` in subflows (`apps/colguetti/e2e/subflows/return-to-app.yaml`). This brings the application back to the foreground with full React state preserved and triggers `AppState` listeners.

2. **External URLs (`Linking.openURL()`):**
   * External links launch the default browser (Chrome).
   * To prevent Chrome's First Run Experience (terms and sync wizard) from blocking unattended CI or emulator runs, `scripts/e2e.sh` automatically writes `echo 'chrome --disable-fre' > /data/local/tmp/chrome-command-line` on connected adb devices prior to running test flows.

3. **Runtime permissions dialogs:**
   * Handled conditionally via `runFlow: when: visible: ".*(Allow|Permitir).*"` or pre-granted via `adb shell pm grant` in `scripts/e2e.sh`.

### Agile & Atomic Testing Architecture

To prevent slow, repetitive test executions that rerun unimpacted features:

1. **Atomic Flows by Feature:**
   * Never bundle unrelated feature assertions into large omnibus flows.
   * Tests are partitioned into dedicated files tagged with native Maestro metadata (`apps/colguetti/e2e/`):
     * `smoke.yaml` (`tags: [smoke]`): Rapid sanity check across top-level screens (3–5 seconds).
     * `settings.yaml` (`tags: [settings]`): Language switching, test notification toast, support dialog, battery hints.
     * `items.yaml` (`tags: [items]`): Item creation, element-targeted swipe gestures (`swipe: direction: LEFT, element: text: "..."`), and deletion confirmation dialog.
     * `alarms.yaml` (`tags: [alarms]`): Alarm creation, time picker interaction, weekday toggles, save validation.

2. **Turbo Mode (Instant 0ms Transitions):**
   * `scripts/e2e.sh` automatically puts the Android device into Turbo Mode before testing:
     ```bash
     adb shell settings put global window_animation_scale 0
     adb shell settings put global transition_animation_scale 0
     adb shell settings put global animator_duration_scale 0
     ```
   * On script exit (including failures/aborts via `trap EXIT`), animation scales are automatically restored to `1`.
   * This cuts end-to-end execution time in half by removing artificial system delays between view transitions.

3. **Continuous Batch Execution & Selective Shortcuts:**
   * **Selective target:** Run only the affected area during local iteration:
     * `./scripts/e2e.sh settings`
     * `./scripts/e2e.sh items`
     * `./scripts/e2e.sh alarms`
     * `./scripts/e2e.sh smoke`
   * **Tag filter:** `./scripts/e2e.sh -t <tag>`
   * **Continuous batch mode:** Running `./scripts/e2e.sh` executes all flows in a single uninterrupted Maestro session, eliminating per-file server restart overhead.



## 17. Unit Tests (Vitest + React Native Testing Library)

`apps/playground` and `packages/alambre` use **Vitest** (v4) with **`@testing-library/react-native`** and the `vitest-native` plugin to execute component and hook tests in a `jsdom` environment. The execution command is `pnpm --filter <workspace> test` (`vitest run`).

### 17.1. Where and How to Name Tests

* Place test files in `<workspace>/tests/`, adhering to the `include: ['tests/**/*.test.{ts,tsx}']` pattern defined in `vitest.config.ts`.
* Use one test file per component/hook, matching the name of the file under test (for example, `SpatialKineticsLab.test.tsx` for `SpatialKineticsLab.tsx`).
* Use one `describe` block per component under test.

### 17.2. Shared Render Helper (Mandatory in Playground)

Do not duplicate provider wrappers inside test files. `apps/playground/tests/render.tsx` exports `renderWithProviders(ui)`, which mounts the component wrapped in `ConfigProvider` + `LightDarkProvider`:

```tsx
import { renderWithProviders } from './render';

const screen = renderWithProviders(<MyTestbed />);
```

If a component requires additional providers (e.g., Router, QueryClient), wrap them within `renderWithProviders` in the test file itself; do not create duplicate or parallel helper wrappers.

### 17.3. Global Mocks (`tests/setup.ts`)

`tests/setup.ts` runs prior to each test suite and automatically stubs:

* `react-native-worklets` — stubs for `__workletsModuleProxy`, `runOnJS`/`runOnUI`, etc.
* `expo`, `expo-clipboard`, `expo-modules-core` — native functions unavailable in jsdom.
* `react-native-reanimated` — synchronous stubs for `useSharedValue`, `withTiming`, `withSpring`, `interpolateColor`, etc.
* `react-native-gesture-handler` — simplified stubs for `Gesture`, `GestureDetector`, `GestureHandlerRootView`.

### 17.4. Resilient Queries (Prefer `testID`/`accessibilityLabel`)

Avoid `getByText('exact string')` as the primary query because copy updates or localization changes break tests unnecessarily. Instead:

* Use `testID` or `accessibilityLabel` on interactive elements and query with `getByTestId` / `getByLabelText` / `getByRole`.
* Reserve `getByText` for text that constitutes an immutable public contract (such as fixed navigation labels).

### 17.5. Async and Animations (Reanimated)

Playground testbeds are physics-driven and kinetic (Reanimated). Follow these rules:

* Use `await act(async () => { fireEvent.press(...) })` to trigger interactions that cause animations.
* Never assert internal Reanimated animation values (`withSpring`, `withTiming`, etc.); their execution is mocked and non-deterministic.
* If you need to wait for an asynchronous state change, use `waitFor` from `@testing-library/react-native`.
* Avoid `vi.useFakeTimers` unless strictly necessary; `setup.ts` mocks already resolve animations synchronously.

### 17.6. What to Test (and What Not to)

| Test ✅ | Do Not Test ❌ |
|---|---|
| Component mounts cleanly without crashing. | Internal Reanimated animation values / tick frames. |
| User interactions (press, toggle, slider) trigger expected state / telemetry changes. | Private implementation details (`useSharedValue` internals). |
| Conditional content swaps (tabs, clearing the dock, removing items). | Exact decorative copy (prefer `testID`). |
| `ConfigSlider` / `ConfigSwitch` invoke `onChange` with the correct value. | Pixel-level visual design (covered by `@ui-reviewer` and `@ui-verifier`). |

### 17.7. Pre-PR Checklist

1. `pnpm lint` and `pnpm typecheck` pass cleanly in the affected workspace.
2. `pnpm test` passes for the affected workspace.
3. No duplicate render wrappers; `renderWithProviders` from `./render` is used.
4. Queries prefer `testID` / `accessibilityLabel` / `role` wherever possible.
5. Documentation is kept up-to-date whenever contracts or boundaries change.

**Do not add new global mocks without consulting `@reviewer`.** If a testbed imports an unmocked Expo or Reanimated module, add the mock locally with `vi.mock()` inside that specific test file, not in `setup.ts`.
