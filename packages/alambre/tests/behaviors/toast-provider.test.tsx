import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, toast } from '../../src/behaviors/toast';
import { defaultToastStore } from '../../src/behaviors/toast/toast-store';
import useToast from '../../src/behaviors/toast/use-toast';
import type { ToastComponentProps, UseToastType } from '../../src/behaviors/toast/toast-types';

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    defaultToastStore.actions.clear();
    defaultToastStore.configure({ defaultDuration: 4000, queueMode: 'queue', delay: 0 });
  });

  afterEach(() => {
    defaultToastStore.actions.clear();
    vi.useRealTimers();
  });

  const setup = (options: Partial<Parameters<typeof ToastProvider>[0]> = {}) => {
    const calls: Array<ToastComponentProps | null> = [];
    let api: UseToastType | undefined;

    const ToastSpy = (props: ToastComponentProps) => {
      calls.push({ ...props, toast: props.toast });
      return null;
    };

    const Consumer = () => {
      api = useToast();
      return null;
    };

    render(
      <ToastProvider ToastComponent={ToastSpy} {...options}>
        <Consumer />
      </ToastProvider>,
    );

    return { calls, getApi: () => api! };
  };

  it('starts with no toast and an empty queue', () => {
    const { calls, getApi } = setup();

    expect(getApi().toast).toBeNull();
    expect(getApi().queueLength).toBe(0);
    expect(calls).toHaveLength(0);
  });

  it('shows a toast with a generated id and default duration', () => {
    const { calls, getApi } = setup();

    act(() => getApi().show({ payload: 'hello' }));

    expect(calls.length).toBeGreaterThan(0);
    const last = calls[calls.length - 1];
    expect(last?.toast).not.toBeNull();
    expect(last!.toast!.data.id).toMatch(/^\d+-[a-z0-9]+$/);
    expect(last!.toast!.data.duration).toBe(4000);
    expect(last!.toast!.data.persistent).toBeUndefined();
    expect(getApi().queueLength).toBe(0);
  });

  it('preserves a custom id and duration', () => {
    const { calls, getApi } = setup();

    act(() => getApi().show({ id: 'custom-id', payload: 'x', duration: 1000 }));

    const last = calls[calls.length - 1];
    expect(last!.toast!.data.id).toBe('custom-id');
    expect(last!.toast!.data.duration).toBe(1000);
  });

  it('setMessage is an alias of show', () => {
    const { calls, getApi } = setup();

    act(() => getApi().setMessage({ payload: 'via-alias' }));

    const last = calls[calls.length - 1];
    expect(last?.toast?.data.payload).toBe('via-alias');
  });

  it('dismisses the current toast after duration + delay', () => {
    const { calls, getApi } = setup();

    act(() => getApi().show({ payload: 'x', duration: 2000 }));

    act(() => {
      vi.advanceTimersByTime(1999);
    });

    expect(calls[calls.length - 1]!.toast).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(getApi().toast).toBeNull();
  });

  it('keeps a persistent toast active indefinitely', () => {
    const { calls, getApi } = setup();

    act(() => getApi().show({ payload: 'x', persistent: true }));

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(getApi().toast).not.toBeNull();
    expect(calls[calls.length - 1]!.toast!.data.persistent).toBe(true);
  });

  it('keeps a toast with actions active until acted on or dismissed', () => {
    const { getApi } = setup();
    const onAction = vi.fn();

    act(() => getApi().show({
      payload: 'Are you sure?',
      actions: [{ label: 'Cancel', tone: 'primary', onPress: onAction }],
    }));

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(getApi().toast).not.toBeNull();
    expect(getApi().toast!.data.actions).toHaveLength(1);

    act(() => getApi().dismiss());

    expect(getApi().toast).toBeNull();
  });

  it('replaces the pending queue in replace mode without hiding the current toast', () => {
    let api: UseToastType | undefined;
    const calls: Array<ToastComponentProps | null> = [];

    const ToastSpy = (props: ToastComponentProps) => {
      calls.push({ ...props, toast: props.toast });
      return null;
    };

    const Consumer = () => {
      api = useToast();
      return null;
    };

    render(
      <ToastProvider queueMode="replace" ToastComponent={ToastSpy}>
        <Consumer />
      </ToastProvider>,
    );

    act(() => api!.show({ id: 'a', payload: 'A', duration: 1000 }));
    act(() => api!.show({ id: 'b', payload: 'B', duration: 1000 }));
    act(() => api!.show({ id: 'c', payload: 'C', duration: 1000 }));

    // The current toast is not replaced; only the pending queue is.
    expect(calls[calls.length - 1]!.toast?.data.id).toBe('a');
    expect(api!.queueLength).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(calls[calls.length - 1]!.toast?.data.id).toBe('c');
  });

  it('dismiss() clears the current toast and promotes the next queued one', () => {
    let api: UseToastType | undefined;

    const ToastSpy = (_props: ToastComponentProps) => null;

    const Consumer = () => {
      api = useToast();
      return null;
    };

    render(
      <ToastProvider ToastComponent={ToastSpy}>
        <Consumer />
      </ToastProvider>,
    );

    act(() => api!.show({ id: 'a', payload: 'A' }));
    act(() => api!.show({ id: 'b', payload: 'B' }));

    act(() => api!.dismiss());

    expect(api!.toast?.data.id).toBe('b');
    expect(api!.queueLength).toBe(0);
  });

  it('dismiss(id) removes a specific queued toast', () => {
    let api: UseToastType | undefined;
    const ToastSpy = (_props: ToastComponentProps) => null;

    const Consumer = () => {
      api = useToast();
      return null;
    };

    render(
      <ToastProvider ToastComponent={ToastSpy}>
        <Consumer />
      </ToastProvider>,
    );

    act(() => api!.show({ id: 'a', payload: 'A' }));
    act(() => api!.show({ id: 'b', payload: 'B' }));

    act(() => api!.dismiss('b'));

    expect(api!.toast?.data.id).toBe('a');
    expect(api!.queueLength).toBe(0);

    act(() => api!.dismiss('a'));
    expect(api!.toast).toBeNull();
  });

  it('clear() removes the current toast and the whole queue', () => {
    let api: UseToastType | undefined;
    const ToastSpy = (_props: ToastComponentProps) => null;

    const Consumer = () => {
      api = useToast();
      return null;
    };

    render(
      <ToastProvider ToastComponent={ToastSpy}>
        <Consumer />
      </ToastProvider>,
    );

    act(() => api!.show({ id: 'a', payload: 'A' }));
    act(() => api!.show({ id: 'b', payload: 'B' }));

    act(() => api!.clear());

    expect(api!.toast).toBeNull();
    expect(api!.queueLength).toBe(0);
  });

  it('next() returns the current toast data and dismisses it', () => {
    let api: UseToastType | undefined;
    const ToastSpy = (_props: ToastComponentProps) => null;

    const Consumer = () => {
      api = useToast();
      return null;
    };

    render(
      <ToastProvider ToastComponent={ToastSpy}>
        <Consumer />
      </ToastProvider>,
    );

    act(() => api!.show({ payload: 'only' }));

    let returned: unknown;
    act(() => {
      returned = api!.next();
    });

    expect(returned).toBeDefined();
    expect(api!.toast).toBeNull();
  });

  it('next() returns undefined when no toast is active', () => {
    let api: UseToastType | undefined;
    const ToastSpy = (_props: ToastComponentProps) => null;

    const Consumer = () => {
      api = useToast();
      return null;
    };

    render(
      <ToastProvider ToastComponent={ToastSpy}>
        <Consumer />
      </ToastProvider>,
    );

    let returned: unknown = 'sentinel';
    act(() => {
      returned = api!.next();
    });

    expect(returned).toBeUndefined();
  });

  it('uses the provider defaultDuration for toasts without a duration', () => {
    let api: UseToastType | undefined;
    const calls: Array<ToastComponentProps | null> = [];

    const ToastSpy = (props: ToastComponentProps) => {
      calls.push({ ...props, toast: props.toast });
      return null;
    };

    const Consumer = () => {
      api = useToast();
      return null;
    };

    render(
      <ToastProvider defaultDuration={1500} ToastComponent={ToastSpy}>
        <Consumer />
      </ToastProvider>,
    );

    act(() => api!.show({ payload: 'x' }));

    expect(calls[calls.length - 1]!.toast?.data.duration).toBe(1500);
  });

  it('can be used outside the provider without throwing', () => {
    let result: UseToastType | undefined;
    const Consumer = () => {
      result = useToast();
      return null;
    };

    expect(() => render(<Consumer />)).not.toThrow();
    expect(result).toBeDefined();
    expect(typeof result?.show).toBe('function');
  });

  it('allows direct imperative access via toast actions outside React render', () => {
    act(() => {
      toast.show({ id: 'direct-toast', payload: 'imperative' });
    });
    expect(defaultToastStore.store.getState().currentToast?.data.id).toBe('direct-toast');
    act(() => {
      toast.dismiss();
    });
    expect(defaultToastStore.store.getState().currentToast).toBeNull();
  });

  it('queues toasts behind the current one in queue mode', () => {
    const { calls, getApi } = setup();

    act(() => getApi().show({ id: 'a', payload: 'A', duration: 1000 }));
    act(() => getApi().show({ id: 'b', payload: 'B', duration: 1000 }));

    expect(calls[calls.length - 1]!.toast?.data.id).toBe('a');
    expect(getApi().queueLength).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(calls[calls.length - 1]!.toast?.data.id).toBe('b');
    expect(getApi().queueLength).toBe(0);
  });

  describe('zero-context semantic tone helpers (toast.success, error, warning, info)', () => {
    it('dispatches toast.success with string content and options', () => {
      act(() => {
        toast.success('Saved successfully!', { title: 'Success', position: 'bottom', duration: 3000 });
      });

      const current = defaultToastStore.store.getState().currentToast;
      expect(current).not.toBeNull();
      expect(current?.data.duration).toBe(3000);
      expect(current?.data.payload).toEqual({
        content: 'Saved successfully!',
        title: 'Success',
        position: 'bottom',
        tone: 'success',
      });
    });

    it('dispatches toast.error with danger tone', () => {
      act(() => {
        toast.error('Something went wrong');
      });

      const current = defaultToastStore.store.getState().currentToast;
      expect(current?.data.payload).toEqual({
        content: 'Something went wrong',
        title: undefined,
        position: 'top',
        tone: 'danger',
      });
    });

    it('dispatches toast.warning and toast.info with proper tone mapping', () => {
      act(() => {
        toast.warning('Check inputs', { title: 'Careful' });
      });
      let current = defaultToastStore.store.getState().currentToast;
      expect(current?.data.payload).toEqual({
        content: 'Check inputs',
        title: 'Careful',
        position: 'top',
        tone: 'warning',
      });

      act(() => {
        toast.dismiss();
        toast.info('New version available');
      });
      current = defaultToastStore.store.getState().currentToast;
      expect(current?.data.payload).toEqual({
        content: 'New version available',
        title: undefined,
        position: 'top',
        tone: 'info',
      });
    });

    it('hook useToast exposes semantic tone helpers', () => {
      const { calls, getApi } = setup();

      act(() => {
        getApi().success('Hook success');
      });

      const last = calls[calls.length - 1];
      expect(last?.toast?.data.payload).toEqual({
        content: 'Hook success',
        title: undefined,
        position: 'top',
        tone: 'success',
      });
    });

    it('accepts object payload and applies options overrides for semantic helpers', () => {
      act(() => {
        toast.success(
          { content: 'Payload body', title: 'Initial', position: 'bottom' },
          { title: 'Overridden', position: 'top', duration: 2500 },
        );
      });

      const current = defaultToastStore.store.getState().currentToast;
      expect(current?.data.duration).toBe(2500);
      expect(current?.data.payload).toEqual({
        content: 'Payload body',
        title: 'Overridden',
        position: 'top',
        tone: 'success',
      });
    });

    it('replaces pending queue when using semantic helpers in replace mode', () => {
      defaultToastStore.configure({ queueMode: 'replace', defaultDuration: 1000 });

      act(() => {
        toast.info('Active toast');
        toast.warning('Queued warning');
        toast.error('Queued error replacing warning');
      });

      const state = defaultToastStore.store.getState();
      expect((state.currentToast?.data.payload as any).content).toBe('Active toast');
      expect((state.currentToast?.data.payload as any).tone).toBe('info');
      expect(state.queue).toHaveLength(1);
      expect((state.queue[0]?.payload as any).content).toBe('Queued error replacing warning');
      expect((state.queue[0]?.payload as any).tone).toBe('danger');

      act(() => {
        toast.dismiss();
      });

      const nextState = defaultToastStore.store.getState();
      expect((nextState.currentToast?.data.payload as any).content).toBe('Queued error replacing warning');
      expect(nextState.queue).toHaveLength(0);
    });

    it('appends to queue in FIFO order when using semantic helpers in queue mode', () => {
      defaultToastStore.configure({ queueMode: 'queue', defaultDuration: 1000 });

      act(() => {
        toast.info('First');
        toast.success('Second');
        toast.warning('Third');
      });

      let state = defaultToastStore.store.getState();
      expect((state.currentToast?.data.payload as any).content).toBe('First');
      expect(state.queue).toHaveLength(2);
      expect((state.queue[0]?.payload as any).content).toBe('Second');
      expect((state.queue[1]?.payload as any).content).toBe('Third');

      act(() => {
        toast.dismiss();
      });
      state = defaultToastStore.store.getState();
      expect((state.currentToast?.data.payload as any).content).toBe('Second');
      expect(state.queue).toHaveLength(1);

      act(() => {
        toast.dismiss();
      });
      state = defaultToastStore.store.getState();
      expect((state.currentToast?.data.payload as any).content).toBe('Third');
      expect(state.queue).toHaveLength(0);
    });

    it('replaces pending queue via hook in ToastProvider with queueMode="replace"', () => {
      let api: UseToastType | undefined;
      const Consumer = () => {
        api = useToast();
        return null;
      };

      render(
        <ToastProvider queueMode="replace" ToastComponent={() => null}>
          <Consumer />
        </ToastProvider>,
      );

      act(() => {
        api!.success('Active success');
        api!.warning('Will be replaced');
        api!.error('Final queued');
      });

      expect((api!.toast?.data.payload as any).content).toBe('Active success');
      expect(api!.queueLength).toBe(1);

      act(() => {
        api!.dismiss();
      });

      expect((api!.toast?.data.payload as any).content).toBe('Final queued');
      expect(api!.queueLength).toBe(0);
    });
  });
});

