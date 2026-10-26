import { act, render, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createForm } from '../../src/capabilities/forms';
import type { FormContextType, UseFieldReturn } from '../../src/capabilities/forms';

interface LoginForm {
  username: string;
  email: string;
  age: number;
}

const initialValues: LoginForm = {
  username: '',
  email: '',
  age: 18,
};

describe('createForm capability', () => {
  it('initializes with default state values', () => {
    const onSubmit = vi.fn();
    const form = createForm({
      initialValues,
      onSubmit,
    });

    const state = form.getState();
    expect(state.values).toEqual(initialValues);
    expect(state.errors).toEqual({});
    expect(state.touched).toEqual({});
    expect(state.dirtyFields).toEqual({});
    expect(state.isDirty).toBe(false);
    expect(state.isValid).toBe(true);
    expect(state.isSubmitting).toBe(false);
    expect(state.isValidating).toBe(false);
  });

  it('updates field value, tracks dirtyFields and isDirty correctly', () => {
    const form = createForm({
      initialValues,
      onSubmit: vi.fn(),
    });

    form.actions.setFieldValue('username', 'alice');
    let state = form.getState();
    expect(state.values.username).toBe('alice');
    expect(state.dirtyFields.username).toBe(true);
    expect(state.isDirty).toBe(true);

    // Setting back to initial value clears dirty
    form.actions.setFieldValue('username', '');
    state = form.getState();
    expect(state.values.username).toBe('');
    expect(state.dirtyFields.username).toBe(false);
    expect(state.isDirty).toBe(false);
  });

  it('validates synchronously and updates errors and isValid', () => {
    const form = createForm({
      initialValues,
      validate: (values) => {
        const errors: Partial<Record<keyof LoginForm, string>> = {};
        if (!values.username) errors.username = 'Username is required';
        if (!values.email.includes('@')) errors.email = 'Invalid email';
        return errors;
      },
      onSubmit: vi.fn(),
    });

    form.actions.setFieldValue('username', 'alice');
    let state = form.getState();
    expect(state.errors.username).toBeUndefined();
    expect(state.errors.email).toBe('Invalid email');
    expect(state.isValid).toBe(false);

    form.actions.setFieldValue('email', 'alice@test.com');
    state = form.getState();
    expect(state.errors).toEqual({});
    expect(state.isValid).toBe(true);
  });

  it('validates asynchronously with isValidating flag and handles out-of-order race conditions', async () => {
    let resolveFirstValidation: (errors: Record<string, string>) => void;
    let resolveSecondValidation: (errors: Record<string, string>) => void;

    let callCount = 0;
    const form = createForm({
      initialValues,
      validate: () => {
        callCount++;
        const currentCall = callCount;
        return new Promise((resolve) => {
          if (currentCall === 1) {
            resolveFirstValidation = resolve;
          } else {
            resolveSecondValidation = resolve;
          }
        });
      },
      onSubmit: vi.fn(),
    });

    // First change
    form.actions.setFieldValue('username', 'a');
    expect(form.getState().isValidating).toBe(true);

    // Second change before first resolves
    form.actions.setFieldValue('username', 'ab');
    expect(form.getState().isValidating).toBe(true);

    // Resolve second first (newer)
    await act(async () => {
      resolveSecondValidation!({});
    });
    expect(form.getState().isValidating).toBe(false);
    expect(form.getState().isValid).toBe(true);

    // Resolve first later (older stale) - must be ignored!
    await act(async () => {
      resolveFirstValidation!({ username: 'Stale error' });
    });
    expect(form.getState().errors.username).toBeUndefined();
  });

  it('manages touch states and resetField / resetForm lifecycle', () => {
    const form = createForm({
      initialValues,
      onSubmit: vi.fn(),
    });

    form.actions.setFieldValue('username', 'bob');
    form.actions.setFieldTouched('username', true);
    form.actions.setFieldError('username', 'Custom error');

    let state = form.getState();
    expect(state.touched.username).toBe(true);
    expect(state.dirtyFields.username).toBe(true);
    expect(state.errors.username).toBe('Custom error');

    // Reset single field
    form.actions.resetField('username');
    state = form.getState();
    expect(state.values.username).toBe('');
    expect(state.touched.username).toBeUndefined();
    expect(state.dirtyFields.username).toBe(false);
    expect(state.errors.username).toBeUndefined();
    expect(state.isDirty).toBe(false);

    // Modify multiple fields and resetForm
    form.actions.setFieldValue('username', 'charlie');
    form.actions.setFieldValue('age', 25);
    expect(form.getState().isDirty).toBe(true);

    form.actions.resetForm({ username: 'default-user', email: '', age: 18 });
    state = form.getState();
    expect(state.values.username).toBe('default-user');
    expect(state.values.age).toBe(18);
    expect(state.isDirty).toBe(false);
  });

  it('executes submitForm lifecycle: touches all fields, validates, and runs onSubmit', async () => {
    const onSubmit = vi.fn();
    const form = createForm({
      initialValues: { username: '', email: '' },
      validate: (values) => {
        const errors: Record<string, string> = {};
        if (!values.username) errors.username = 'Required';
        return errors;
      },
      onSubmit,
    });

    // When invalid, submitForm returns false and does not call onSubmit
    const failedResult = await form.actions.submitForm();
    expect(failedResult).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(form.getState().touched.username).toBe(true);
    expect(form.getState().touched.email).toBe(true);

    // Fix error
    form.actions.setFieldValue('username', 'alice');
    const successResult = await form.actions.submitForm();
    expect(successResult).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({ username: 'alice', email: '' });
    expect(form.getState().isSubmitting).toBe(false);
  });

  it('getFieldProps returns spreadable props for AppTextInput', () => {
    const form = createForm({
      initialValues: { search: 'initial' },
      validate: (values) => (!values.search ? { search: 'Search cannot be empty' } : {}),
      onSubmit: vi.fn(),
    });

    let props = form.getFieldProps('search');
    expect(props.value).toBe('initial');
    expect(props.hasError).toBe(false);
    expect(props.errorMessage).toBeUndefined();

    // Trigger change via onChangeText
    props.onChangeText('');
    props = form.getFieldProps('search');
    expect(props.value).toBe('');
    // Not touched yet, so errorMessage is not shown yet
    expect(props.errorMessage).toBeUndefined();
    expect(props.hasError).toBe(false);

    // Trigger onBlur
    props.onBlur();
    props = form.getFieldProps('search');
    expect(props.errorMessage).toBe('Search cannot be empty');
    expect(props.hasError).toBe(true);
  });

  it('useForm provides reactive form state and getFieldProps in components', async () => {
    const form = createForm({
      initialValues: { name: 'Alex' },
      onSubmit: vi.fn(),
    });

    const holder: { current?: FormContextType<{ name: string }> } = {};
    const Component = () => {
      holder.current = form.useForm();
      return null;
    };

    render(<Component />);
    expect(holder.current?.values.name).toBe('Alex');

    act(() => {
      holder.current?.setFieldValue('name', 'Sam');
    });

    await waitFor(() => {
      expect(holder.current?.values.name).toBe('Sam');
      expect(holder.current?.isDirty).toBe(true);
    });
  });

  it('useField provides isolated granular subscriptions (does NOT re-render unrelated fields)', async () => {
    const form = createForm({
      initialValues: {
        fieldA: 'initial-a',
        fieldB: 'initial-b',
      },
      onSubmit: vi.fn(),
    });

    let renderCountA = 0;
    let renderCountB = 0;
    const holderA: { current?: UseFieldReturn<string> } = {};
    const holderB: { current?: UseFieldReturn<string> } = {};

    const ComponentA = () => {
      renderCountA++;
      holderA.current = form.useField('fieldA');
      return null;
    };

    const ComponentB = () => {
      renderCountB++;
      holderB.current = form.useField('fieldB');
      return null;
    };

    const Root = () => (
      <>
        <ComponentA />
        <ComponentB />
      </>
    );

    render(<Root />);

    expect(renderCountA).toBe(1);
    expect(renderCountB).toBe(1);
    expect(holderA.current?.value).toBe('initial-a');
    expect(holderB.current?.value).toBe('initial-b');

    // Mutate Field A
    act(() => {
      holderA.current?.setValue('new-a');
    });

    await waitFor(() => {
      expect(holderA.current?.value).toBe('new-a');
      expect(holderA.current?.isDirty).toBe(true);
    });

    // Component A must have re-rendered
    expect(renderCountA).toBe(2);
    // Component B must NOT have re-rendered! (Granular subscription isolation)
    expect(renderCountB).toBe(1);

    // Mutate Field B
    act(() => {
      holderB.current?.setValue('new-b');
    });

    await waitFor(() => {
      expect(holderB.current?.value).toBe('new-b');
      expect(holderB.current?.isDirty).toBe(true);
    });

    // Component B re-renders, Component A does not re-render
    expect(renderCountA).toBe(2);
    expect(renderCountB).toBe(2);
  });
});
