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
  aisleStart: 1,
  aisleEnd: 1,
  sideRanges: {
    L: { start: 1, end: 2 },
    E: { start: null, end: null },
    R: { start: null, end: null },
    F: { start: null, end: null },
  },
  shelfStart: null,
  shelfEnd: 'B',
};

describe('labelGeneration', () => {
  it('parses numeric input and rejects non-numeric values', () => {
    expect(parseNumericInput(' 12 ')).toBe(12);
    expect(parseNumericInput('')).toBeNull();
    expect(parseNumericInput('A1')).toBeNull();
  });

  it('validates aisle input required fields first', () => {
    const error = validateAisleLabelInput(
      { ...baseAisleInput, aisleStart: null },
      { minAisleValue: 0, maxAisleValue: 99, maxBayValue: 99 },
    );

    expect(error).toBe('Please enter aisle start, aisle end, and select a shelf.');
  });

  it('validates aisle side ranges and bay max bounds', () => {
    const orderError = validateAisleLabelInput(
      { ...baseAisleInput, sideRanges: { ...baseAisleInput.sideRanges, L: { start: 3, end: 2 } } },
      { minAisleValue: 0, maxAisleValue: 99, maxBayValue: 99 },
    );
    const rangeError = validateAisleLabelInput(
      { ...baseAisleInput, sideRanges: { ...baseAisleInput.sideRanges, L: { start: 1, end: 100 } } },
      { minAisleValue: 0, maxAisleValue: 99, maxBayValue: 99 },
    );

    expect(orderError).toBe('Side range start cannot be greater than side range end.');
    expect(rangeError).toBe('Bay values must be between 1 and 99.');
  });

  it('validates incomplete and lower-bound aisle side ranges', () => {
    const incompleteRangeError = validateAisleLabelInput(
      { ...baseAisleInput, sideRanges: { ...baseAisleInput.sideRanges, R: { start: 2, end: null } } },
      { minAisleValue: 0, maxAisleValue: 99, maxBayValue: 99 },
    );
    const lowerBoundError = validateAisleLabelInput(
      { ...baseAisleInput, sideRanges: { ...baseAisleInput.sideRanges, L: { start: 0, end: 1 } } },
      { minAisleValue: 0, maxAisleValue: 99, maxBayValue: 99 },
    );

    expect(incompleteRangeError).toBe('Enter both start and end bay values for each selected side.');
    expect(lowerBoundError).toBe('Bay values must be between 1 and 99.');
  });

  it('generates aisle labels grouped by configured side order', () => {
    const codes = generateAisleLabelCodes(
      {
        aisleStart: 1,
        aisleEnd: 1,
        sideRanges: {
          L: { start: 1, end: 1 },
          E: { start: 1, end: 1 },
          R: { start: 1, end: 1 },
          F: { start: 1, end: 1 },
        },
        shelfStart: null,
        shelfEnd: 'A',
      },
      formatTwoDigitValue,
    );

    expect(codes).toEqual(AISLE_SIDES.map((side) => `01${side}01A`));
  });

  it('validates short label bounds and generates compact output', () => {
    const shortInput: IShortLabelInput = {
      bayStart: 1,
      bayEnd: 2,
      shelfStart: null,
      shelfEnd: 'B',
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
      bayStart: 1,
      bayEnd: 1,
      shelfStart: 'C',
      shelfEnd: 'A',
      prefix: 'BAK',
    };

    expect(validateShortLabelInput(invalidShelfOrderInput, 1, 99)).toBe(
      'Start shelf must come before or equal to end shelf.',
    );

    const validRangeInput: IShortLabelInput = {
      bayStart: 1,
      bayEnd: 1,
      shelfStart: 'B',
      shelfEnd: 'C',
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
