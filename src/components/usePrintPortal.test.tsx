import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePrintPortal } from './usePrintPortal';

describe('usePrintPortal', () => {
  it('creates and cleans up a print portal container when one does not exist', () => {
    const containerId = 'test-print-portal-create';

    const { result, unmount } = renderHook(() => usePrintPortal(containerId));
    expect(result.current).not.toBeNull();

    const container = document.getElementById(containerId);
    expect(container).not.toBeNull();
    expect(result.current).toBe(container);

    unmount();
    expect(document.getElementById(containerId)).toBeNull();
  });

  it('reuses an existing container and does not remove it after unmount', () => {
    const containerId = 'test-print-portal-existing';
    const existingContainer = document.createElement('div');
    existingContainer.id = containerId;
    document.body.appendChild(existingContainer);

    const { result, unmount } = renderHook(() => usePrintPortal(containerId));
    expect(result.current).toBe(existingContainer);

    unmount();
    expect(document.getElementById(containerId)).toBe(existingContainer);

    existingContainer.remove();
  });
});
