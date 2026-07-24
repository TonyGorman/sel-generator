import { describe, expect, it } from 'vitest';
import { getSpecificLabelValidationResult } from './specificLabelGeneration';

const contentTokens = {
  bayRangeText: '01-99',
  shelfRangeText: 'A-Z',
  namedAisleExamples: 'KIOSK, FLORAL',
  aislePrefixedExamples: 'BR1L01A, BL2L02B',
};

describe('getSpecificLabelValidationResult', () => {
  it('returns empty error when no labels are provided', () => {
    const result = getSpecificLabelValidationResult({
      labelText: '   ',
      labelPrintMode: 'mini-sel',
      isValidSpecificCode: () => true,
      contentTokens,
    });

    expect(result.labels).toEqual([]);
    expect(result.errorMessage).toBe('Enter at least one label value.');
    expect(result.warningMessage).toBeNull();
  });

  it('returns invalid error when any label is invalid', () => {
    const result = getSpecificLabelValidationResult({
      labelText: '01L01A,ZZZ',
      labelPrintMode: 'mini-sel',
      isValidSpecificCode: (code) => code !== 'ZZZ',
      contentTokens,
    });

    expect(result.labels).toEqual([]);
    expect(result.errorMessage).toContain('Use valid label codes only');
    expect(result.warningMessage).toBeNull();
  });

  it('blocks special values in large mode', () => {
    const result = getSpecificLabelValidationResult({
      labelText: 'KIOSK',
      labelPrintMode: 'large-sel',
      isValidSpecificCode: () => true,
      contentTokens,
    });

    expect(result.labels).toEqual([]);
    expect(result.errorMessage).toContain('Special label values');
    expect(result.warningMessage).toBeNull();
  });

  it('returns normalized labels and no warning for valid small batches', () => {
    const result = getSpecificLabelValidationResult({
      labelText: '01l01a, bak01a',
      labelPrintMode: 'mini-sel',
      isValidSpecificCode: () => true,
      contentTokens,
    });

    expect(result.errorMessage).toBeNull();
    expect(result.warningMessage).toBeNull();
    expect(result.labels).toEqual(['01L01A', 'BAK01A']);
  });
});
