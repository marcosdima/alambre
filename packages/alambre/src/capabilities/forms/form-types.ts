import type { Store } from '../../core/create-store';

export type FormErrors<T extends Record<string, any>> = Partial<Record<keyof T, string>>;
export type FormTouched<T extends Record<string, any>> = Partial<Record<keyof T, boolean>>;
export type FormDirtyFields<T extends Record<string, any>> = Partial<Record<keyof T, boolean>>;

export interface FieldState<V> {
  value: V;
  error?: string;
  isTouched: boolean;
  isDirty: boolean;
}

export interface FieldProps<V> {
  value: V;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  errorMessage?: string;
  hasError: boolean;
}

export interface UseFieldReturn<V> extends FieldState<V>, FieldProps<V> {
  setValue: (value: V) => void;
  setError: (error: string | undefined) => void;
  setTouched: (isTouched?: boolean) => void;
  reset: () => void;
  fieldProps: FieldProps<V>;
}

export interface FormState<T extends Record<string, any>> {
  values: T;
  errors: FormErrors<T>;
  touched: FormTouched<T>;
  dirtyFields: FormDirtyFields<T>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isValidating: boolean;
}

export interface FormActions<T extends Record<string, any>> {
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: <K extends keyof T>(field: K, error: string | undefined) => void;
  setFieldTouched: <K extends keyof T>(field: K, isTouched?: boolean) => void;
  setValues: (values: Partial<T> | ((prev: T) => T)) => void;
  setErrors: (errors: FormErrors<T>) => void;
  setTouched: (touched: FormTouched<T>) => void;
  resetField: <K extends keyof T>(field: K) => void;
  resetForm: (nextInitialValues?: Partial<T>) => void;
  submitForm: () => Promise<boolean>;
  validateForm: () => Promise<boolean> | boolean;
}

export interface FormContextType<T extends Record<string, any>> extends FormState<T>, FormActions<T> {
  getFieldProps: <K extends keyof T>(field: K) => FieldProps<T[K]>;
}

export interface CreateFormOptions<T extends Record<string, any>> {
  initialValues: T;
  validate?: (values: T) => FormErrors<T> | Promise<FormErrors<T>>;
  onSubmit: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface FormInternalState<T extends Record<string, any>> extends FormState<T> {
  fields: { [K in keyof T]: FieldState<T[K]> };
}

export interface CreateFormReturn<T extends Record<string, any>> {
  store: Store<FormInternalState<T>>;
  actions: FormActions<T>;
  getState: () => FormState<T>;
  useForm: () => FormContextType<T>;
  useField: <K extends keyof T>(field: K) => UseFieldReturn<T[K]>;
  getFieldProps: <K extends keyof T>(field: K) => FieldProps<T[K]>;
  subscribe: (listener: (state: FormState<T>) => void) => () => void;
}
