# Playground Standards (`apps/playground`)

**Strict Rules for Agents:**
1. **No Default/Lazy UI:** NEVER use raw `View`, `Text`, or `TouchableOpacity` for testbed scaffolding or content. You MUST use framework components (`alambre`) or the app's standard presentation wrappers (e.g. `AppTitle`, `AppButton`, `GummyTabs`) and consume semantic colors from `useLightDark()`.
2. **Rich & Non-Redundant Configuration:** You are building testbeds, not static demos. You MUST expose a rich configuration panel for transitions, physics hooks, or gestures, but fields must be strictly non-redundant and relevant to the behavior being tested. Use `ConfigSlider` (for duration, friction, mass, stiffness) and `ConfigSwitch` (for mode toggles, overshoot clamping). DO NOT include stylistic or irrelevant fields (e.g., 'item size' or 'colors') that do not alter the mathematical behavior. Do not ship a single hardcoded transition.
3. **Real-World Scenarios:** Testbeds must simulate concrete, everyday product scenarios (e.g., Accordions, Grid/List Morphs, Dynamic Filters, Swipe-to-Dismiss). Do not build abstract geometric sandboxes. If an interaction does not have a clear product use-case, it cannot be effectively evaluated for framework extraction.
4. **Mandatory Wrappers:** Every testbed must be wrapped in `TestCard` (providing Title and Description).
5. **State Wiring:** Configuration controls must be strictly wired to the component. Do not leave dead sliders. Use `runOnJS` or reactive shared values if interfacing with Reanimated.
6. **Sub-navigation:** Use `GummyTabs` if a testbed requires multiple views.
7. **Lifecycle & Extraction (The Survey Phase):** Playground is the living candidate catalog and an ephemeral proving ground. Do not write prose "discovery" entries for what you build here; the running testbed is the record. The mandatory workflow is: Prototype in Playground -> Test and refine -> **Extraction Audit** (`docs/guidelines/agents.md` §6, run by `@reviewer` at the end of the cycle) -> promote according to the audit -> refactor the testbed to consume the extracted component (or delete it) to avoid dragging obsolete test code. Destinations:
   - **`packages/alambre`:** headless, presentation-neutral behavior with >= 2 consumers and contract tests.
   - **`apps/base-template`:** presentation or compound UI that does not belong in the framework (it carries a visual skin or app-level opinions) but is welcome as a template starting point.
   - **Stays here / stays in its app:** single-consumer, domain-specific (e.g. card-game mechanics, edge relays) or experimental ideas. Keep them as testbeds or delete them.
8. **Subagent Peer Review:** After implementing a complex visual or mechanical testbed, the Lead must invoke the `@ui-reviewer` subagent to audit the code to avoid "maker's blindness". The reviewer must specifically check for Rule 2 violations (e.g., leaving hardcoded physics instead of using ConfigSliders) and Reanimated UI-thread state desyncs.

## 9. Testbed Unit Testing (`apps/playground/tests/`)

Every playground testbed must have its corresponding unit test file in `tests/`. The mandatory rules are:

1. **Location and Naming:** `tests/<domain>/<Testbed>.test.tsx`, matching the exact name of the file under test. One `describe` block per component.
2. **Shared Render Helper:** Exclusively use `renderWithProviders` from `tests/render.tsx`. Do not duplicate the `ConfigProvider` + `LightDarkProvider` wrapper inside individual test files.
3. **Mandatory Providers:** Every test must render under `ConfigProvider` and `LightDarkProvider` (handled by `renderWithProviders`).
4. **Resilient Queries:** Prefer `getByTestId` / `getByLabelText` over `getByText`. Testbeds must expose `testID` or `accessibilityLabel` on interactive elements. Reserve `getByText` for stable public contract copy.
5. **Do Not Test Internal Animation Ticks:** Never assert on internal Reanimated values (`withSpring`, `withTiming`, etc.); they are mocked and non-deterministic. Test resulting state, layout, and telemetry instead.
6. **Async:** Use `await act(async () => { ... })` for interactions that trigger animations or state transitions, and `waitFor` for asynchronous updates.
7. **Mocks:** `tests/setup.ts` globally stubs worklets, Expo modules, Reanimated, and gesture-handler. Do not introduce new global mocks without consulting `@reviewer`; use local `vi.mock()` within specific tests when needed.
8. **Extraction Audit Relationship:** When a testbed is extracted to `packages/alambre` following an Extraction Audit (`docs/guidelines/agents.md` §6), its contract tests are promoted to `packages/alambre/tests/`. Testbed-specific interaction tests stay in the playground.

## Canonical Testbed Example

When scaffolding a new testbed, use the following structure as the baseline:

```tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';
import { TestCard } from '../../components/test-utils/TestCard';
import { ConfigSlider } from '../../components/test-utils/ConfigSlider';
import { GummyTabs } from '../../components/test-utils/GummyTabs';

export default function ExampleTestbed() {
  const { theme } = useLightDark();
  
  // Rule 2: Expose rich physics configurations
  const [damping, setDamping] = useState(15);
  const [stiffness, setStiffness] = useState(150);

  // Strictly wire configuration to the Reanimated transition
  const transition = LinearTransition.springify().damping(damping).stiffness(stiffness);

  // Rule 3 & 6: Use GummyTabs for concrete product scenarios
  const tabs = [
    { id: 'scenario-a', label: 'Accordion', content: <ScenarioA transition={transition} /> },
    { id: 'scenario-b', label: 'Morph', content: <ScenarioB transition={transition} /> },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Rule 4: Mandatory TestCard wrapper */}
      <TestCard 
        title="Example Scenarios" 
        description="Testing concrete product uses for Layout Transitions."
      >
        <ConfigSlider label={`Damping (${damping})`} value={damping} min={5} max={50} step={1} onChange={setDamping} />
        <ConfigSlider label={`Stiffness (${stiffness})`} value={stiffness} min={50} max={500} step={10} onChange={setStiffness} />
      </TestCard>

      <GummyTabs tabs={tabs} />
    </View>
  );
}

function ScenarioA({ transition }: any) {
  return <ScrollView style={styles.content}>{/* UI */}</ScrollView>;
}

function ScenarioB({ transition }: any) {
  return <ScrollView style={styles.content}>{/* UI */}</ScrollView>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 }
});
```
