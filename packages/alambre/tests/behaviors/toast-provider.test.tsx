import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ToastProvider from '../../src/behaviors/toast/toast-provider';
import useToast from '../../src/behaviors/toast/use-toast';
import type { ToastComponentProps, UseToastType } from '../../src/behaviors/toast/toast-types';

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = () => {
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
      <ToastProvider ToastComponent={ToastSpy}>
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
    const { calls, getApi } = setup();
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

  it('throws when used outside the provider', () => {
    const Consumer = () => {
      useToast();
      return null;
    };

    expect(() => render(<Consumer />)).toThrow(/useToast must be used within ToastProvider/);
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
});
