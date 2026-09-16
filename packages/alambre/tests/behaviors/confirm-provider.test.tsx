import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ConfirmProvider from '../../src/behaviors/confirm/confirm-provider';
import useConfirm from '../../src/behaviors/confirm/use-confirm';
import type {
  ConfirmComponentProps,
  RegisterConfirm,
  UseConfirmType,
} from '../../src/behaviors/confirm/confirm-types';

describe('ConfirmProvider', () => {
  const setup = () => {
    const registrations: ConfirmComponentProps[] = [];
    let api: UseConfirmType | undefined;

    const ConfirmSpy = (props: ConfirmComponentProps) => {
      registrations.push(props);
      return null;
    };

    const Consumer = () => {
      api = useConfirm();
      return null;
    };

    render(
      <ConfirmProvider ConfirmComponent={ConfirmSpy}>
        <Consumer />
      </ConfirmProvider>,
    );

    return { registrations, getApi: () => api! };
  };

  const request: RegisterConfirm = {
    title: 'Are you sure?',
    message: 'This cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    tone: 'danger',
  };

  it('starts with no confirm rendered', () => {
    const { registrations } = setup();
    expect(registrations).toHaveLength(0);
  });

  it('renders the confirm and resolves true through onConfirm', async () => {
    const { registrations, getApi } = setup();

    let promise: Promise<boolean>;
    act(() => { promise = getApi().confirm(request); });

    expect(registrations).toHaveLength(1);
    expect(registrations[0].confirm).toEqual(request);

    act(() => registrations[0].onConfirm());

    await expect(promise!).resolves.toBe(true);
  });

  it('resolves false through onCancel', async () => {
    const { registrations, getApi } = setup();

    let promise: Promise<boolean>;
    act(() => { promise = getApi().confirm(request); });

    act(() => registrations[0].onCancel());

    await expect(promise!).resolves.toBe(false);
  });

  it('dismiss() resolves false and clears the confirm', async () => {
    const { registrations, getApi } = setup();

    let promise: Promise<boolean>;
    act(() => { promise = getApi().confirm(request); });

    act(() => getApi().dismiss());

    await expect(promise!).resolves.toBe(false);
    expect(registrations).toHaveLength(1);
  });

  it('only one confirm renders at a time and a new confirm replaces the previous', async () => {
    const { registrations, getApi } = setup();

    let first: Promise<boolean>;
    let second: Promise<boolean>;
    act(() => {
      first = getApi().confirm(request);
      second = getApi().confirm({ ...request, title: 'Second' });
    });

    expect(registrations).toHaveLength(1);
    expect(registrations[0].confirm.title).toBe('Second');

    act(() => registrations[0].onConfirm());

    await expect(first!).resolves.toBe(false);
    await expect(second!).resolves.toBe(true);
  });

  it('throws when used outside the provider', () => {
    const Consumer = () => {
      useConfirm();
      return null;
    };

    expect(() => render(<Consumer />)).toThrow(/useConfirm must be used within ConfirmProvider/);
  });

  it('forwards onConfirm/onCancel as callbacks', () => {
    const { registrations, getApi } = setup();

    act(() => { void getApi().confirm(request); });

    expect(registrations[0].onConfirm).toBeTypeOf('function');
    expect(registrations[0].onCancel).toBeTypeOf('function');
  });

  it('resolve callback is only called once', async () => {
    const { registrations, getApi } = setup();
    const onResolve = vi.fn();

    let promise: Promise<boolean>;
    act(() => {
      promise = getApi().confirm(request).then((ok) => {
        onResolve(ok);
        return ok;
      });
    });

    act(() => registrations[0].onConfirm());
    act(() => registrations[0].onConfirm());

    await expect(promise!).resolves.toBe(true);
    expect(onResolve).toHaveBeenCalledTimes(1);
  });
});
