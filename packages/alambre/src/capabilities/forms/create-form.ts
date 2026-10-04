import { useExternalStore } from '../../core/use-external-store';
import createStore from '../../core/create-store';
import type { CreateFormOptions, FormState, FormActions, FormContextType } from './form-types';

export function createForm<T extends Record<string, any>>(options: CreateFormOptions<T>) {
  const initialState: FormState<T> = {
    values: options.initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
  };

  const store = createStore<FormState<T>>(initialState);

  const validateForm = (values: T) => {
    if (!options.validate) return true;
    const errors = options.validate(values);
    store.setState((prev) => ({ ...prev, errors, isValid: Object.keys(errors).length === 0 }));
    return Object.keys(errors).length === 0;
  };

  const actions: FormActions<T> = {
    setFieldValue: (field, value) => {
      const currentValues = store.getState().values;
      const newValues = { ...currentValues, [field]: value } as T;
      store.setState((prev) => ({ ...prev, values: newValues }));
      validateForm(newValues);
    },
    setFieldError: (field, error) => {
      const currentErrors = store.getState().errors;
      const newErrors = { ...currentErrors, [field]: error };
      if (!error) delete newErrors[field];
      store.setState((prev) => ({ ...prev, errors: newErrors, isValid: Object.keys(newErrors).length === 0 }));
    },
    setFieldTouched: (field, isTouched = true) => {
      const currentTouched = store.getState().touched;
      store.setState((prev) => ({ ...prev, touched: { ...currentTouched, [field]: isTouched } }));
    },
    resetForm: () => {
      store.setState(initialState);
    },
    submitForm: async () => {
      const state = store.getState();
      const currentValues = state.values;
      
      const allTouched = Object.keys(currentValues).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Record<keyof T, boolean>);
      
      store.setState((prev) => ({ ...prev, touched: allTouched }));

      if (validateForm(currentValues)) {
        store.setState((prev) => ({ ...prev, isSubmitting: true }));
        try {
          await options.onSubmit(currentValues);
        } finally {
          store.setState((prev) => ({ ...prev, isSubmitting: false }));
        }
      }
    },
  };

  function useForm(): FormContextType<T> {
    const state = useExternalStore(store, (s) => s);
    return {
      ...state,
      ...actions,
    };
  }

  return {
    store,
    actions,
    useForm,
  };
}
