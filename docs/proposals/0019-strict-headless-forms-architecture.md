---
id: RFC-0019
title: "Proposal 19: Strict Headless Forms Architecture & Granular Subscription (`createForm`, `useField`, `getFieldProps`)"
status: PROPOSED
author: @lead
scope: alambre (capabilities/forms)
summary: "Strict headless forms architecture & granular subscription (`createForm`, `useField`, `getFieldProps`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 19: Strict Headless Forms Architecture & Granular Subscription (`createForm`, `useField`, `getFieldProps`)
- **Status**: PROPOSED
- **Author**: @lead

### 1. Current Problem
- **Unexported Prototype with Loose Typing:** `packages/alambre/src/capabilities/forms/` implements `createForm`, but it is not exported from `packages/alambre/src/index.ts` and lacks contract documentation.
- **Loose Types in Field Mutation:** `setFieldValue` is typed as `(field: keyof T, value: any) => void` instead of maintaining strict field-value correspondence (`<K extends keyof T>(field: K, value: T[K])`).
- **Coarse Component Re-Renders:** `useForm()` exposes full form state (`values`, `errors`, `touched`), causing every keystroke in a text field to re-render the entire enclosing screen.
- **Lack of Spreadable Component Bindings:** Consumers must manually write `value={form.values.email}`, `onChangeText={(val) => form.setFieldValue('email', val)}`, and `errorMessage={form.errors.email}` for each input.

### 2. Proposed Solution
1. **Strict Generic Typing:**
   - Parameterize `createForm<T extends Record<string, unknown>>(options)`.
   - Strictly type `setFieldValue<K extends keyof T>(field: K, value: T[K]): void`.
2. **Granular Subscriptions (`useField`):**
   - Provide `useField<K extends keyof T>(field: K)` backed by `useExternalStore`, ensuring only the input associated with the active field re-renders on keystroke.
3. **Declarative Component Bindings (`getFieldProps`):**
   - Provide `getFieldProps(field)` returning `{ value, onChangeText, onBlur, errorMessage, hasError }` directly spreadable onto `AppTextInput` or `Input`.
4. **Form Metadata & Lifecycle:**
   - Add `isDirty`, `dirtyFields`, `resetField(field)`, and async validation support (`validate?: (values: T) => Promise<FormErrors<T>> | FormErrors<T>`).
5. **Export & Documentation:**
   - Export `createForm` and form contracts from `packages/alambre/src/index.ts` and document in `docs/packages/alambre/capabilities.md`.

### 3. Pros & Cons
- **Pros:**
  - Provides a lightweight, high-performance form state solution with zero external dependencies (avoiding heavy Formik/React Hook Form dependencies).
  - Eliminates unnecessary re-renders in complex forms.
- **Cons:**
  - Introduces new public contract types in `packages/alambre`.

---

[← Back to Proposals Index](./index.md)
