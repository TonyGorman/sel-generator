import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AISLE_SIDE_METADATA } from '../config/aisleSideMetadata';
import {
  LABEL_HARD_LIMIT,
  LABEL_SOFT_LIMIT,
  MAX_AISLE_VALUE,
  MAX_BAY_VALUE,
  MIN_AISLE_VALUE,
  formatTwoDigitValue,
} from '../config/labelConfig';
import { useAisleLabelForm } from './useAisleLabelForm';

const makeInputEvent = (value: string): React.ChangeEvent<HTMLInputElement> => {
  return { target: { value } } as React.ChangeEvent<HTMLInputElement>;
};

describe('useAisleLabelForm', () => {
  const baseArgs = {
    sideRows: AISLE_SIDE_METADATA,
    minAisleValue: MIN_AISLE_VALUE,
    maxAisleValue: MAX_AISLE_VALUE,
    maxBayValue: MAX_BAY_VALUE,
    softLimit: LABEL_SOFT_LIMIT,
    hardLimit: LABEL_HARD_LIMIT,
    formatTwoDigitValue,
  };

  it('initializes with empty summary and no generated labels', () => {
    const { result } = renderHook(() => useAisleLabelForm(baseArgs));

    expect(result.current.state.totalLabels).toBe(0);
    expect(result.current.state.shelfSummary).toBe('--');
    expect(result.current.state.generatedLabels).toBeNull();
    expect(result.current.state.errorMessage).toBeNull();
    expect(result.current.state.warningMessage).toBeNull();
  });

  it('computes totals and default shelf summary start when only end shelf is set', () => {
    const { result } = renderHook(() => useAisleLabelForm(baseArgs));

    act(() => {
      result.current.actions.onInputChange(makeInputEvent('1'), 'aisleStart');
      result.current.actions.onInputChange(makeInputEvent('1'), 'aisleEnd');
      result.current.actions.onSideRangeInputChange(makeInputEvent('1'), 'L', 'start');
      result.current.actions.onSideRangeInputChange(makeInputEvent('1'), 'L', 'end');
      result.current.actions.onShelfEndChange('C');
    });

    expect(result.current.state.shelfSummary).toBe('A – C');
    expect(result.current.state.totalLabels).toBe(3);
    expect(result.current.state.activeSideRanges).toHaveLength(1);
    expect(result.current.state.activeSideRanges[0]?.label).toBe('Left');
  });

  it('returns required-field validation error when generation inputs are incomplete', () => {
    const { result } = renderHook(() => useAisleLabelForm(baseArgs));

    act(() => {
      result.current.actions.generateLabel();
    });

    expect(result.current.state.errorMessage).toBe('Please enter aisle start, aisle end, and select a shelf.');
    expect(result.current.state.generatedLabels).toBeNull();
  });

  it('generates labels for a valid aisle/side/shelf range', () => {
    const { result } = renderHook(() => useAisleLabelForm(baseArgs));

    act(() => {
      result.current.actions.onInputChange(makeInputEvent('1'), 'aisleStart');
      result.current.actions.onInputChange(makeInputEvent('1'), 'aisleEnd');
      result.current.actions.onSideRangeInputChange(makeInputEvent('1'), 'L', 'start');
      result.current.actions.onSideRangeInputChange(makeInputEvent('1'), 'L', 'end');
      result.current.actions.onShelfStartChange('B');
      result.current.actions.onShelfEndChange('D');
    });

    act(() => {
      result.current.actions.generateLabel();
    });

    expect(result.current.state.errorMessage).toBeNull();
    expect(result.current.state.warningMessage).toBeNull();
    expect(result.current.state.generatedLabels).toEqual(['01L01B', '01L01C', '01L01D']);
  });

  it('applies soft-limit warning and hard-limit block using configured thresholds', () => {
    const softWarningArgs = {
      ...baseArgs,
      softLimit: 2,
      hardLimit: 10,
    };
    const hardBlockArgs = {
      ...baseArgs,
      softLimit: 1,
      hardLimit: 2,
    };

    const { result: softResult } = renderHook(() => useAisleLabelForm(softWarningArgs));

    act(() => {
      softResult.current.actions.onInputChange(makeInputEvent('1'), 'aisleStart');
      softResult.current.actions.onInputChange(makeInputEvent('1'), 'aisleEnd');
      softResult.current.actions.onSideRangeInputChange(makeInputEvent('1'), 'L', 'start');
      softResult.current.actions.onSideRangeInputChange(makeInputEvent('1'), 'L', 'end');
      softResult.current.actions.onShelfEndChange('C');
    });

    act(() => {
      softResult.current.actions.generateLabel();
    });

    expect(softResult.current.state.warningMessage).toContain('Large batch warning: more than 2 labels');
    expect(softResult.current.state.generatedLabels).toHaveLength(3);

    const { result: hardResult } = renderHook(() => useAisleLabelForm(hardBlockArgs));

    act(() => {
      hardResult.current.actions.onInputChange(makeInputEvent('1'), 'aisleStart');
      hardResult.current.actions.onInputChange(makeInputEvent('1'), 'aisleEnd');
      hardResult.current.actions.onSideRangeInputChange(makeInputEvent('1'), 'L', 'start');
      hardResult.current.actions.onSideRangeInputChange(makeInputEvent('1'), 'L', 'end');
      hardResult.current.actions.onShelfEndChange('C');
    });

    act(() => {
      hardResult.current.actions.generateLabel();
    });

    expect(hardResult.current.state.errorMessage).toBe('Too many labels requested. Reduce the total to 2 or fewer.');
    expect(hardResult.current.state.generatedLabels).toBeNull();
  });
});