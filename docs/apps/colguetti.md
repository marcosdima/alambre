# Colguetti Reference

## 15. Background Alarms, Permissions & OS Synchronization

Lessons and contracts established during the development of Colguetti 1.0 (`apps/colguetti`):

### Android exact alarms and battery Doze

On Android 12+ (API 31+), Android restricts exact background task execution to conserve battery. When a device enters Doze mode, standard scheduled notifications (`AlarmManager.setAndAllowWhileIdle`) are batched into OS maintenance windows, delaying alarms by 9–15+ minutes.

To guarantee reliable delivery:
* **Permissions:** Android 12 requires `android.permission.SCHEDULE_EXACT_ALARM`. Android 13/14 (API 33+) requires `android.permission.USE_EXACT_ALARM` for alarm/timer applications (which is granted automatically at install time).
* **Exact triggers:** Use exact `DATE` triggers (`trigger: { type: 'date', date: futureDate }`) instead of relative time intervals when waking from background.
* **Dedicated High-Priority Notification Channel:** Notifications must target a dedicated channel (e.g. `colguetti-alarms`) configured with `AndroidImportance.MAX`, `vibrationPattern`, and `sound: true`. On Android 8+, once a notification channel is created on device, its importance cannot be programmatically elevated; any priority elevation requires a freshly named channel.

### Reactive `AppState` synchronization

External state transitions—such as a user opening system settings via `Linking.openSettings()` to enable permissions or the device sleeping while a routine window elapses—do not emit JavaScript callbacks while the app is backgrounded.

To prevent frozen counters or stale permission indicators:
* Subscribe to `AppState.addEventListener('change', (state) => { if (state === 'active') ... })`.
* On `'active'`, immediately re-read system permissions via `Notifications.getPermissionsAsync()` without requiring an app process restart.
* Re-evaluate `new Date()` upon resume so expired routines close cleanly and immediate alerts fire without UI stalls.

---

