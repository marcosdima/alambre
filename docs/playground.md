# Playground Standards (`apps/playground`)

**Strict Rules for Agents:**
1. **No Default/Lazy UI:** NEVER use raw `View`, `Text`, or `TouchableOpacity` for testbed scaffolding or content. You MUST use framework components (`alambre`) or the app's standard presentation wrappers (e.g. `AppTitle`, `AppButton`, `GummyTabs`) and consume semantic colors from `useLightDark()`.
2. **Rich Configuration is Mandatory:** You are building testbeds, not static demos. If you are building a transition, physics hook, or gesture, you MUST expose a rich configuration panel. Provide `ConfigSlider` (for duration, friction, mass, stiffness, bounds) and `ConfigSwitch` (for mode toggles, easing types) to allow deep testing of the mathematical behavior. Do not ship a single hardcoded transition.
3. **Mandatory Wrappers:** Every testbed must be wrapped in `TestCard` (providing Title and Description).
4. **State Wiring:** Configuration controls must be strictly wired to the component. Do not leave dead sliders. Use `runOnJS` or reactive shared values if interfacing with Reanimated.
5. **Sub-navigation:** Use `GummyTabs` if a testbed requires multiple views.
