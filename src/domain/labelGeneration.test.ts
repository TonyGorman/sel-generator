import { describe, expect, it } from 'vitest';
import {
  generateAisleLabelCodes,
  generateShortLabelCodes,
  normalizeSpecificInputCodes,
  parseNumericInput,
  validateAisleLabelInput,
  validateShortLabelInput,
  type IAisleLabelInput,
  type IShortLabelInput,
} from './labelGenerationUseCases';

const formatTwoDigitValue = (value: number): string => value.toString().padStart(2, '0');

const baseAisleInput: IAisleLabelInput = {
  aisle_start: 1,
  aisle_end: 1,
  lf_start: 1,
  lf_end: 2,
  ef_start: null,
  ef_end: null,
  rf_start: null,
  rf_end: null,
  ft_start: null,
  ft_end: null,
  shelves: 'B',
};

describe('labelGeneration', () => {
  it('parses numeric input and rejects non-numeric values', () => {
    expect(parseNumericInput(' 12 ')).toBe(12);
    expect(parseNumericInput('')).toBeNull();
    expect(parseNumericInput('A1')).toBeNull();
  });

  it('validates aisle input required fields first', () => {
    const error = validateAisleLabelInput(
      { ...baseAisleInput, aisle_start: null },
      { minAisleValue: 0, maxAisleValue: 99, maxBayValue: 99 },
    );

    expect(error).toBe('Please enter aisle start, aisle end, and select a shelf.');
  });

  it('validates aisle side ranges and bay max bounds', () => {
    const orderError = validateAisleLabelInput(
      { ...baseAisleInput, lf_start: 3, lf_end: 2 },
      { minAisleValue: 0, maxAisleValue: 99, maxBayValue: 99 },
    );
    const rangeError = validateAisleLabelInput(
      { ...baseAisleInput, lf_end: 100 },
      { minAisleValue: 0, maxAisleValue: 99, maxBayValue: 99 },
    );

    expect(orderError).toBe('Side range start cannot be greater than side range end.');
    expect(rangeError).toBe('Bay values must be between 1 and 99.');
  });

  it('validates incomplete and lower-bound aisle side ranges', () => {
    const incompleteRangeError = validateAisleLabelInput(
      { ...baseAisleInput, rf_start: 2, rf_end: null },
      { minAisleValue: 0, maxAisleValue: 99, maxBayValue: 99 },
    );
    const lowerBoundError = validateAisleLabelInput(
      { ...baseAisleInput, lf_start: 0, lf_end: 1 },
      { minAisleValue: 0, maxAisleValue: 99, maxBayValue: 99 },
    );

    expect(incompleteRangeError).toBe('Enter both start and end bay values for each selected side.');
    expect(lowerBoundError).toBe('Bay values must be between 1 and 99.');
  });

  it('generates aisle labels grouped by side in L/R/E/F order', () => {
    const codes = generateAisleLabelCodes(
      {
        aisle_start: 1,
        aisle_end: 1,
        lf_start: 1,
        lf_end: 1,
        ef_start: 1,
        ef_end: 1,
        rf_start: 1,
        rf_end: 1,
        ft_start: 1,
        ft_end: 1,
        shelves: 'A',
      },
      formatTwoDigitValue,
    );

    expect(codes).toEqual(['01L01A', '01R01A', '01E01A', '01F01A']);
  });

  it('validates short label bounds and generates compact output', () => {
    const shortInput: IShortLabelInput = {
      bay_start: 1,
      bay_end: 2,
      shelves: 'B',
      prefix: 'BAK',
    };

    expect(validateShortLabelInput(shortInput, 1, 99)).toBeNull();
    expect(generateShortLabelCodes(shortInput, formatTwoDigitValue)).toEqual([
      'BAK01A',
      'BAK01B',
      'BAK02A',
      'BAK02B',
    ]);
  });

  it('normalizes specific input tokens to compact uppercase values', () => {
    expect(normalizeSpecificInputCodes(' 01l01a, bak01a , , kiosk ')).toEqual([
      '01L01A',
      'BAK01A',
      'KIOSK',
    ]);
  });
});
