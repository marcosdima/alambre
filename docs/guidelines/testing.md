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

