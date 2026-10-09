# Colguetti Architecture & Reference

Colguetti is organized around domain modules rather than purely by UI views. It separates the persistent schedule from the runtime activation logic.

## 1. Domain Structure (`apps/colguetti/src/`)

* **`items/`**: The core entities representing "what" needs attention (e.g., "Pills", "Water"). An item defines the visual representation (icon, color) but has no concept of time.
* **`alarms/`**: The schedule definitions (e.g., "Every Monday at 8:00 AM"). An alarm references one or multiple `itemIds`.
* **`notifications/`**: The bridge to the operating system (`expo-notifications`). 
  * `schedule.ts`: Diffs the desired `alarms` state against the currently scheduled OS notifications.
  * `sync.ts` & `NotificationsWatcher.tsx`: Handles foreground/background OS notification interactions (Snooze, Activate) and requests OS permissions.
* **`checklist/`**: The runtime state. When an alarm triggers and the user taps "Activate", the app enters an active checklist session, resolving the `itemIds` into a task queue.

## 2. Background Alarms, Permissions & OS Synchronization

### Android Exact Alarms and Battery Doze

On Android 12+ (API 31+), Android restricts exact background task execution to conserve battery. When a device enters Doze mode, standard scheduled notifications (`AlarmManager.setAndAllowWhileIdle`) are batched into OS maintenance windows, delaying alarms by 9–15+ minutes.

To guarantee reliable delivery:
* **Permissions:** Android 12 requires `android.permission.SCHEDULE_EXACT_ALARM`. Android 13/14 (API 33+) requires `android.permission.USE_EXACT_ALARM` for alarm/timer applications (which is granted automatically at install time). *These are already configured in `app.json`*.
* **Dedicated High-Priority Notification Channel:** Notifications target a dedicated channel (`ALARM_CHANNEL_ID`) configured with `AndroidImportance.MAX`, `vibrationPattern`, and `sound: true`.

### Reactive `AppState` Synchronization

External state transitions—such as a user opening system settings via `Linking.openSettings()` to enable permissions or the device sleeping while a routine window elapses—do not emit JavaScript callbacks while the app is backgrounded.

To prevent frozen states:
* `NotificationsWatcher.tsx` subscribes to `AppState.addEventListener('change')`.
* On `'active'`, it immediately re-reads system permissions and triggers `syncSchedule()` without requiring an app process restart.

