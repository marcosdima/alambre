import { useCallback, useMemo } from 'react';
import { useExternalStore } from '../../core/use-external-store';
import createStore from '../../core/create-store';
import type {
  CreateFormOptions,
  CreateFormReturn,
  FieldProps,
  FieldState,
  FormActions,
  FormContextType,
  FormDirtyFields,
  FormErrors,
  FormInternalState,
  FormState,
  FormTouched,
  UseFieldReturn,
} from './form-types';

function areValuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!areValuesEqual(a[i], b[i])) return false;
      }
      return true;
    }
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!areValuesEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function computeFieldState<T extends Record<string, any>, K extends keyof T>(
  key: K,
  values: T,
  errors: FormErrors<T>,
  touched: FormTouched<T>,
  dirtyFields: FormDirtyFields<T>,
  prevField?: FieldState<T[K]>,
): FieldState<T[K]> {
  const value = values[key];
  const error = errors[key];
  const isTouched = Boolean(touched[key]);
  const isDirty = Boolean(dirtyFields[key]);

  if (
    prevField &&
    prevField.value === value &&
    prevField.error === error &&
    prevField.isTouched === isTouched &&
    prevField.isDirty === isDirty
  ) {
    return prevField;
  }

  return { value, error, isTouched, isDirty };
}

function updateFields<T extends Record<string, any>>(
  values: T,
  errors: FormErrors<T>,
  touched: FormTouched<T>,
  dirtyFields: FormDirtyFields<T>,
  prevFields?: { [K in keyof T]?: FieldState<T[K]> },
): { [K in keyof T]: FieldState<T[K]> } {
  const nextFields = {} as { [K in keyof T]: FieldState<T[K]> };
  const allKeys = new Set([
    ...Object.keys(values),
    ...(prevFields ? Object.keys(prevFields) : []),
  ]) as Set<keyof T>;

  for (const key of allKeys) {
    nextFields[key] = computeFieldState(
      key,
      values,
      errors,
      touched,
      dirtyFields,
      prevFields ? prevFields[key] : undefined,
    );
  }

  return nextFields;
}

export function createForm<T extends Record<string, any>>(options: CreateFormOptions<T>): CreateFormReturn<T> {
  let initialValuesRef = { ...options.initialValues };

  const initialErrors: FormErrors<T> = {};
  const initialTouched: FormTouched<T> = {};
  const initialDirtyFields: FormDirtyFields<T> = {};

  const initialFields = updateFields(initialValuesRef, initialErrors, initialTouched, initialDirtyFields);

  const initialInternalState: FormInternalState<T> = {
    values: { ...initialValuesRef },
    errors: initialErrors,
    touched: initialTouched,
    dirtyFields: initialDirtyFields,
    isDirty: false,
    isValid: true,
    isSubmitting: false,
    isValidating: false,
    fields: initialFields,
  };

  const store = createStore<FormInternalState<T>>(initialInternalState);

  let validationSeq = 0;

  const runValidation = (valuesToValidate: T): Promise<boolean> | boolean => {
    if (!options.validate) {
      store.setState((prev) => {
        const nextErrors: FormErrors<T> = {};
        return {
          ...prev,
          errors: nextErrors,
          isValid: true,
          isValidating: false,
          fields: updateFields(valuesToValidate, nextErrors, prev.touched, prev.dirtyFields, prev.fields),
        };
      });
      return true;
    }

    const currentSeq = ++validationSeq;
    const result = options.validate(valuesToValidate);

    if (result instanceof Promise) {
      store.setState((prev) => ({
        ...prev,
        isValidating: true,
      }));

      return result
        .then((errors) => {
          if (currentSeq !== validationSeq) {
            return Object.keys(store.getState().errors).length === 0;
          }
          const safeErrors = errors || {};
          const isValid = Object.keys(safeErrors).length === 0;
          store.setState((prev) => ({
            ...prev,
            errors: safeErrors,
            isValid,
            isValidating: false,
            fields: updateFields(prev.values, safeErrors, prev.touched, prev.dirtyFields, prev.fields),
          }));
          return isValid;
        })
        .catch(() => {
          if (currentSeq === validationSeq) {
            store.setState((prev) => ({
              ...prev,
              isValidating: false,
            }));
          }
          return false;
        });
    }

    const safeErrors = result || {};
    const isValid = Object.keys(safeErrors).length === 0;
    store.setState((prev) => ({
      ...prev,
      errors: safeErrors,
      isValid,
      isValidating: false,
      fields: updateFields(valuesToValidate, safeErrors, prev.touched, prev.dirtyFields, prev.fields),
    }));
    return isValid;
  };

  const actions: FormActions<T> = {
    setFieldValue: (field, value) => {
      const current = store.getState();
      const newValues = { ...current.values, [field]: value } as T;
      const isFieldDirty = !areValuesEqual(value, initialValuesRef[field]);
      const nextDirtyFields = { ...current.dirtyFields, [field]: isFieldDirty };
      const isDirty = Object.values(nextDirtyFields).some(Boolean);

      store.setState((prev) => ({
        ...prev,
        values: newValues,
        dirtyFields: nextDirtyFields,
        isDirty,
        fields: updateFields(newValues, prev.errors, prev.touched, nextDirtyFields, prev.fields),
      }));

      if (options.validateOnChange !== false && options.validate) {
        runValidation(newValues);
      }
    },

    setFieldError: (field, error) => {
      store.setState((prev) => {
        const nextErrors = { ...prev.errors };
        if (error) {
          nextErrors[field] = error;
        } else {
          delete nextErrors[field];
        }
        const isValid = Object.keys(nextErrors).length === 0;
        return {
          ...prev,
          errors: nextErrors,
          isValid,
          fields: updateFields(prev.values, nextErrors, prev.touched, prev.dirtyFields, prev.fields),
        };
      });
    },

    setFieldTouched: (field, isTouched = true) => {
      store.setState((prev) => {
        const nextTouched = { ...prev.touched, [field]: isTouched };
        return {
          ...prev,
          touched: nextTouched,
          fields: updateFields(prev.values, prev.errors, nextTouched, prev.dirtyFields, prev.fields),
        };
      });

      if (isTouched && options.validateOnBlur !== false && options.validate) {
        runValidation(store.getState().values);
      }
    },

    setValues: (nextValues) => {
      const current = store.getState();
      const resolvedValues =
        typeof nextValues === 'function' ? nextValues(current.values) : { ...current.values, ...nextValues };
      const nextDirtyFields: FormDirtyFields<T> = {};
      for (const key of Object.keys(resolvedValues) as (keyof T)[]) {
        nextDirtyFields[key] = !areValuesEqual(resolvedValues[key], initialValuesRef[key]);
      }
      const isDirty = Object.values(nextDirtyFields).some(Boolean);

      store.setState((prev) => ({
        ...prev,
        values: resolvedValues,
        dirtyFields: nextDirtyFields,
        isDirty,
        fields: updateFields(resolvedValues, prev.errors, prev.touched, nextDirtyFields, prev.fields),
      }));

      if (options.validateOnChange !== false && options.validate) {
        runValidation(resolvedValues);
      }
    },

    setErrors: (errors) => {
      store.setState((prev) => ({
        ...prev,
        errors,
        isValid: Object.keys(errors).length === 0,
        fields: updateFields(prev.values, errors, prev.touched, prev.dirtyFields, prev.fields),
      }));
    },

    setTouched: (touched) => {
      store.setState((prev) => ({
        ...prev,
        touched,
        fields: updateFields(prev.values, prev.errors, touched, prev.dirtyFields, prev.fields),
      }));
    },

    resetField: (field) => {
      store.setState((prev) => {
        const initialVal = initialValuesRef[field];
        const nextValues = { ...prev.values, [field]: initialVal };
        const nextTouched = { ...prev.touched };
        delete nextTouched[field];
        const nextDirtyFields = { ...prev.dirtyFields, [field]: false };
        const nextErrors = { ...prev.errors };
        delete nextErrors[field];
        const isDirty = Object.values(nextDirtyFields).some(Boolean);
        const isValid = Object.keys(nextErrors).length === 0;

        return {
          ...prev,
          values: nextValues,
          touched: nextTouched,
          dirtyFields: nextDirtyFields,
          errors: nextErrors,
          isDirty,
          isValid,
          fields: updateFields(nextValues, nextErrors, nextTouched, nextDirtyFields, prev.fields),
        };
      });
    },

    resetForm: (nextInitialValues) => {
      if (nextInitialValues) {
        initialValuesRef = { ...initialValuesRef, ...nextInitialValues };
      }
      const resetValues = { ...initialValuesRef };
      const resetErrors: FormErrors<T> = {};
      const resetTouched: FormTouched<T> = {};
      const resetDirtyFields: FormDirtyFields<T> = {};

      store.setState((prev) => ({
        values: resetValues,
        errors: resetErrors,
        touched: resetTouched,
        dirtyFields: resetDirtyFields,
        isDirty: false,
        isValid: true,
        isSubmitting: false,
        isValidating: false,
        fields: updateFields(resetValues, resetErrors, resetTouched, resetDirtyFields, prev.fields),
      }));
    },

    validateForm: () => {
      return runValidation(store.getState().values);
    },

    submitForm: async () => {
      const currentState = store.getState();
      const currentValues = currentState.values;

      const allTouched: FormTouched<T> = {};
      for (const key of Object.keys(currentValues) as (keyof T)[]) {
        allTouched[key] = true;
      }

      store.setState((prev) => ({
        ...prev,
        touched: allTouched,
        fields: updateFields(prev.values, prev.errors, allTouched, prev.dirtyFields, prev.fields),
      }));

      const validationResult = runValidation(currentValues);
      const isValid = validationResult instanceof Promise ? await validationResult : validationResult;

      if (isValid) {
        store.setState((prev) => ({ ...prev, isSubmitting: true }));
        try {
          await options.onSubmit(currentValues);
          return true;
        } finally {
          store.setState((prev) => ({ ...prev, isSubmitting: false }));
        }
      }
      return false;
    },
  };

  const getFieldProps = <K extends keyof T>(field: K): FieldProps<T[K]> => {
    const state = store.getState();
    const error = state.errors[field];
    const isTouched = Boolean(state.touched[field]);
    return {
      value: state.values[field],
      onChangeText: (text: string) => actions.setFieldValue(field, text as unknown as T[K]),
      onBlur: () => actions.setFieldTouched(field, true),
      errorMessage: isTouched ? error : undefined,
      hasError: Boolean(isTouched && error),
    };
  };

  function useForm(): FormContextType<T> {
    const state = useExternalStore(store, (s) => s);

    const formGetFieldProps = useCallback(
      <K extends keyof T>(field: K): FieldProps<T[K]> => {
        const error = state.errors[field];
        const isTouched = Boolean(state.touched[field]);
        return {
          value: state.values[field],
          onChangeText: (text: string) => actions.setFieldValue(field, text as unknown as T[K]),
          onBlur: () => actions.setFieldTouched(field, true),
          errorMessage: isTouched ? error : undefined,
          hasError: Boolean(isTouched && error),
        };
      },
      [state.values, state.errors, state.touched],
    );

    return {
      ...state,
      ...actions,
      getFieldProps: formGetFieldProps,
    };
  }

  function useField<K extends keyof T>(field: K): UseFieldReturn<T[K]> {
    const fieldState = useExternalStore(
      store,
      (s) =>
        s.fields[field] ?? {
          value: s.values[field],
          error: s.errors[field],
          isTouched: Boolean(s.touched[field]),
          isDirty: Boolean(s.dirtyFields[field]),
        },
    );

    const setValue = useCallback((val: T[K]) => actions.setFieldValue(field, val), [field]);
    const setError = useCallback((err: string | undefined) => actions.setFieldError(field, err), [field]);
    const setTouched = useCallback((isTouched: boolean = true) => actions.setFieldTouched(field, isTouched), [field]);
    const reset = useCallback(() => actions.resetField(field), [field]);

    const hasError = Boolean(fieldState.isTouched && fieldState.error);
    const errorMessage = fieldState.isTouched ? fieldState.error : undefined;

    const onBlur = useCallback(() => actions.setFieldTouched(field, true), [field]);
    const onChangeText = useCallback((text: string) => actions.setFieldValue(field, text as unknown as T[K]), [field]);

    const fieldProps: FieldProps<T[K]> = useMemo(
      () => ({
        value: fieldState.value,
        onChangeText,
        onBlur,
        errorMessage,
        hasError,
      }),
      [fieldState.value, onChangeText, onBlur, errorMessage, hasError],
    );

    return {
      value: fieldState.value,
      error: fieldState.error,
      isTouched: fieldState.isTouched,
      isDirty: fieldState.isDirty,
      hasError,
      errorMessage,
      setValue,
      setError,
      setTouched,
      reset,
      fieldProps,
      onChangeText,
      onBlur,
    };
  }

  const getState = (): FormState<T> => {
    const s = store.getState();
    return {
      values: s.values,
      errors: s.errors,
      touched: s.touched,
      dirtyFields: s.dirtyFields,
      isDirty: s.isDirty,
      isValid: s.isValid,
      isSubmitting: s.isSubmitting,
      isValidating: s.isValidating,
    };
  };

  return {
    store,
    actions,
    getState,
    useForm,
    useField,
    getFieldProps,
    subscribe: (listener: (state: FormState<T>) => void) => {
      return store.subscribe((s) => {
        listener({
          values: s.values,
          errors: s.errors,
          touched: s.touched,
          dirtyFields: s.dirtyFields,
          isDirty: s.isDirty,
          isValid: s.isValid,
          isSubmitting: s.isSubmitting,
          isValidating: s.isValidating,
        });
      });
    },
  };
}
