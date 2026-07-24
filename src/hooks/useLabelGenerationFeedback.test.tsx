import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLabelGenerationFeedback } from './useLabelGenerationFeedback';

describe('useLabelGenerationFeedback', () => {
  it('initializes with null output and messages', () => {
    const { result } = renderHook(() => useLabelGenerationFeedback());

    expect(result.current.state.generatedLabels).toBeNull();
    expect(result.current.state.errorMessage).toBeNull();
    expect(result.current.state.warningMessage).toBeNull();
  });

  it('sets failure state and clears generated labels/warning', () => {
    const { result } = renderHook(() => useLabelGenerationFeedback());

    act(() => {
      result.current.actions.setSuccess(['01L01A'], 'warning');
    });

    act(() => {
      result.current.actions.setFailure('Validation failed');
    });

    expect(result.current.state.errorMessage).toBe('Validation failed');
    expect(result.current.state.warningMessage).toBeNull();
    expect(result.current.state.generatedLabels).toBeNull();
  });

  it('sets success state and clears existing error', () => {
    const { result } = renderHook(() => useLabelGenerationFeedback());

    act(() => {
      result.current.actions.setFailure('Validation failed');
    });

    act(() => {
      result.current.actions.setSuccess(['01L01A', '01L01B'], null);
    });

    expect(result.current.state.errorMessage).toBeNull();
    expect(result.current.state.warningMessage).toBeNull();
    expect(result.current.state.generatedLabels).toEqual(['01L01A', '01L01B']);
  });

  it('resets only generated labels to preserve existing message state', () => {
    const { result } = renderHook(() => useLabelGenerationFeedback());

    act(() => {
      result.current.actions.setSuccess(['01L01A'], 'Large batch warning');
    });

    act(() => {
      result.current.actions.resetGeneratedLabels();
    });

    expect(result.current.state.generatedLabels).toBeNull();
    expect(result.current.state.warningMessage).toBe('Large batch warning');
    expect(result.current.state.errorMessage).toBeNull();
  });
});
