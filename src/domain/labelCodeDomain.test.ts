import { describe, expect, it } from 'vitest';
import { DEFAULT_BACK_CODE_PREFIX, MAX_SHELF_LETTER } from '../config/labelConfig';
import { validateSpecificLabelCode } from './labelCodeDomain';

const defaultOptions = {
  backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues: ['KIOSK', 'FLORAL', 'SEASONAL'],
  minAisleValue: 0,
  maxAisleValue: 99,
  maxBayValue: 99,
  maxShelfLetter: MAX_SHELF_LETTER,
};

describe('validateSpecificLabelCode', () => {
  it('accepts compact aisle labels within bounds', () => {
    const result = validateSpecificLabelCode('01L01A', defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.kind).toBe('aisle');
    }
  });

  it('accepts compact back labels within bounds', () => {
    const result = validateSpecificLabelCode(`${DEFAULT_BACK_CODE_PREFIX}01A`, defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.kind).toBe('back');
    }
  });

  it('accepts allowlisted named aisle values', () => {
    const result = validateSpecificLabelCode('kiosk', defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.kind).toBe('special');
    }
  });

  it('accepts allowlisted named aisle values from mixed-case config', () => {
    const result = validateSpecificLabelCode('kiosk', {
      ...defaultOptions,
      specialAisleValues: ['kiosk', 'FlOrAl', ' seasonal '],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.kind).toBe('special');
      expect(result.parsed.value).toBe('KIOSK');
    }
  });

  it('rejects non-compact input with separators', () => {
    const dashed = validateSpecificLabelCode('01-L01-A', defaultOptions);
    const spaced = validateSpecificLabelCode('01 L01 A', defaultOptions);

    expect(dashed).toEqual({ ok: false, reason: 'not-compact' });
    expect(spaced).toEqual({ ok: false, reason: 'not-compact' });
  });

  it('rejects out-of-range bay values', () => {
    const result = validateSpecificLabelCode('01L00A', {
      ...defaultOptions,
      maxBayValue: 99,
    });

    expect(result).toEqual({ ok: false, reason: 'invalid-bay-range' });
  });

  it('rejects out-of-range shelf values', () => {
    const result = validateSpecificLabelCode('01L01Z', {
      ...defaultOptions,
      maxShelfLetter: MAX_SHELF_LETTER,
    });

    expect(result).toEqual({ ok: false, reason: 'invalid-shelf-range' });
  });

  it('rejects completely unparseable input', () => {
    const result = validateSpecificLabelCode('xyz123', defaultOptions);

    expect(result).toEqual({ ok: false, reason: 'unparseable' });
  });

  it('rejects empty strings', () => {
    const result = validateSpecificLabelCode('', defaultOptions);

    expect(result).toEqual({ ok: false, reason: 'unparseable' });
  });

  it('rejects random gibberish', () => {
    const result = validateSpecificLabelCode('!@#$%', defaultOptions);

    expect(result).toEqual({ ok: false, reason: 'unparseable' });
  });

  it('rejects malformed aisle code (too short)', () => {
    const result = validateSpecificLabelCode('1L01A', defaultOptions);

    expect(result).toEqual({ ok: false, reason: 'unparseable' });
  });

  it('rejects out-of-range aisle values', () => {
    const result = validateSpecificLabelCode('99L01A', {
      ...defaultOptions,
      maxAisleValue: 50,
    });

    expect(result).toEqual({ ok: false, reason: 'invalid-aisle-range' });
  });
});
