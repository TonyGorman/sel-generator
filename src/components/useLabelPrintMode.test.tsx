import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLabelPrintMode } from './useLabelPrintMode';

describe('useLabelPrintMode', () => {
  it('defaults to mini-sel', () => {
    const { result } = renderHook(() => useLabelPrintMode());

    expect(result.current.labelPrintMode).toBe('mini-sel');
    expect(result.current.printModeOptions).toEqual([
      { key: 'mini-sel', text: 'Mini SEL' },
      { key: 'large-sel', text: 'Large SEL' },
    ]);
  });

  it('updates mode and invokes callback when mode changes', () => {
    const onModeChange = vi.fn();
    const { result } = renderHook(() => useLabelPrintMode(onModeChange));

    act(() => {
      result.current.handleModeChange('large-sel');
    });

    expect(result.current.labelPrintMode).toBe('large-sel');
    expect(onModeChange).toHaveBeenCalledTimes(1);
    expect(onModeChange).toHaveBeenCalledWith('large-sel');
  });

  it('does not invoke callback when selecting the already active mode', () => {
    const onModeChange = vi.fn();
    const { result } = renderHook(() => useLabelPrintMode(onModeChange));

    act(() => {
      result.current.handleModeChange('mini-sel');
    });

    expect(result.current.labelPrintMode).toBe('mini-sel');
    expect(onModeChange).not.toHaveBeenCalled();
  });
});
