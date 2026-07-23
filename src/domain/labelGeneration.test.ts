import { describe, expect, it } from 'vitest';
import {
  generateAisleLabelCodes,
  getShelfRangeCount,
  generateShortLabelCodes,
  normalizeSpecificInputCodes,
  parseNumericInput,
  validateAisleLabelInput,
  validateShortLabelInput,
  type IAisleLabelInput,
  type IShortLabelInput,
} from './labelGeneration';
import { AISLE_SIDES } from '../config/labelConfig';

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
  shelf_start: null,
  shelf_end: 'B',
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

  it('generates aisle labels grouped by configured side order', () => {
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
        shelf_start: null,
        shelf_end: 'A',
      },
      formatTwoDigitValue,
    );

    expect(codes).toEqual(AISLE_SIDES.map((side) => `01${side}01A`));
  });

  it('validates short label bounds and generates compact output', () => {
    const shortInput: IShortLabelInput = {
      bay_start: 1,
      bay_end: 2,
      shelf_start: null,
      shelf_end: 'B',
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

  it('validates short shelf ordering and supports shelf ranges from custom starts', () => {
    const invalidShelfOrderInput: IShortLabelInput = {
      bay_start: 1,
      bay_end: 1,
      shelf_start: 'C',
      shelf_end: 'A',
      prefix: 'BAK',
    };

    expect(validateShortLabelInput(invalidShelfOrderInput, 1, 99)).toBe(
      'Start shelf must come before or equal to end shelf.',
    );

    const validRangeInput: IShortLabelInput = {
      bay_start: 1,
      bay_end: 1,
      shelf_start: 'B',
      shelf_end: 'C',
      prefix: 'BAK',
    };

    expect(generateShortLabelCodes(validRangeInput, formatTwoDigitValue)).toEqual([
      'BAK01B',
      'BAK01C',
    ]);
  });

  it('normalizes specific input tokens to compact uppercase values', () => {
    expect(normalizeSpecificInputCodes(' 01l01a, bak01a , , kiosk ')).toEqual([
      '01L01A',
      'BAK01A',
      'KIOSK',
    ]);
  });

  it('computes shelf range counts with default and custom starts', () => {
    expect(getShelfRangeCount(null, null)).toBe(0);
    expect(getShelfRangeCount(null, 'C')).toBe(3);
    expect(getShelfRangeCount('B', 'C')).toBe(2);
  });
});
