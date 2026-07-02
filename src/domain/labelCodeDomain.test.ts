import { describe, expect, it } from 'vitest';
import { SHORT_CODE_PREFIXES, MAX_SHELF_LETTER } from '../config/labelConfig';
import {
  getMiniCompositionVariant,
  parseLabelCode,
  validateSpecificLabelCode,
} from './labelCodeDomain';

const defaultOptions = {
  shortCodePrefixes: SHORT_CODE_PREFIXES,
  minAisleValue: 0,
  maxAisleValue: 99,
  maxBayValue: 99,
  maxShelfLetter: MAX_SHELF_LETTER,
};

describe('validateSpecificLabelCode', () => {
  it('parses configured compact prefixed aisle labels', () => {
    const result = parseLabelCode('BR1L01A');

    expect(result).toEqual({
      kind: 'aisle',
      parts: {
        aisle: 'BR1',
        side: 'L',
        bay: '01',
        shelf: 'A',
      },
    });
  });

  it('parses special aisle values into ISpecialCodeParts shape', () => {
    const result = parseLabelCode('KIOSK');

    expect(result).toEqual({
      kind: 'special',
      parts: { value: 'KIOSK' },
    });
  });

  it('parses special aisle values case-insensitively into ISpecialCodeParts shape', () => {
    const result = parseLabelCode('floral');

    expect(result).toEqual({
      kind: 'special',
      parts: { value: 'FLORAL' },
    });
  });

  it('parses configured compact prefixed aisle labels with multi-digit aisle numbers', () => {
    const result = parseLabelCode('BR10L01A');

    expect(result).toEqual({
      kind: 'aisle',
      parts: {
        aisle: 'BR10',
        side: 'L',
        bay: '01',
        shelf: 'A',
      },
    });
  });

  it('accepts configured compact prefixed aisle labels within bounds', () => {
    const result = validateSpecificLabelCode('BR1L01A', defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.kind).toBe('aisle');
      if (result.parsed.kind === 'aisle') {
        expect(result.parsed.parts.aisle).toBe('BR1');
      }
    }
  });

  it('accepts configured compact prefixed aisles with multi-digit aisle numbers within bounds', () => {
    const result = validateSpecificLabelCode('BR10L01A', defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.kind).toBe('aisle');
      if (result.parsed.kind === 'aisle') {
        expect(result.parsed.parts.aisle).toBe('BR10');
      }
    }
  });

  it('accepts compact aisle labels within bounds', () => {
    const result = validateSpecificLabelCode('01L01A', defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.kind).toBe('aisle');
    }
  });

  it('accepts compact short code labels within bounds', () => {
    const result = validateSpecificLabelCode(`${SHORT_CODE_PREFIXES[0]}01A`, defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.kind).toBe('short');
    }
  });

  it('accepts compact front-of-store labels within bounds', () => {
    const result = validateSpecificLabelCode(`${SHORT_CODE_PREFIXES[1]}01A`, defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.kind).toBe('short');
      if (result.parsed.kind === 'short') {
        expect(result.parsed.parts.prefix).toBe(SHORT_CODE_PREFIXES[1]);
      }
    }
  });

  it('rejects unsupported short code prefixes', () => {
    const result = validateSpecificLabelCode('9901A', defaultOptions);

    expect(result).toEqual({ ok: false, reason: 'unparseable' });
  });

  it('rejects unsupported aisle prefixes', () => {
    const result = validateSpecificLabelCode('PR1L01A', defaultOptions);

    expect(result).toEqual({ ok: false, reason: 'unparseable' });
  });

  it('rejects out-of-range prefixed aisle numbers', () => {
    const result = validateSpecificLabelCode('BR100L01A', defaultOptions);

    expect(result).toEqual({ ok: false, reason: 'unparseable' });
  });

  it('rejects configured prefixed aisles when validator aisle prefix options exclude the prefix', () => {
    const result = validateSpecificLabelCode('BR1L01A', {
      ...defaultOptions,
      aislePrefixes: ['BL'],
    });

    expect(result).toEqual({ ok: false, reason: 'invalid-aisle-prefix' });
  });

  it('rejects codes with prefixes that are not configured, even when passed as preferred prefixes', () => {
    const result = validateSpecificLabelCode('BACK01A', {
      ...defaultOptions,
      shortCodePrefixes: ['BACK'],
    });

    expect(result).toEqual({ ok: false, reason: 'unparseable' });
  });

  it('accepts allowlisted named aisle values', () => {
    const result = validateSpecificLabelCode('kiosk', defaultOptions);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parsed.kind).toBe('special');
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
      maxShelfLetter: 'X',
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

  it('accepts both short code prefixes when preferred config value is set', () => {
    const backResult = validateSpecificLabelCode(`${SHORT_CODE_PREFIXES[0]}01A`, defaultOptions);
    const frontResult = validateSpecificLabelCode(`${SHORT_CODE_PREFIXES[1]}01A`, defaultOptions);

    expect(backResult.ok).toBe(true);
    expect(frontResult.ok).toBe(true);
  });
});

describe('mini composition variants', () => {
  it('keeps mini-three-row composition behavior for aisle labels', () => {
    const variant = getMiniCompositionVariant('mini-three-row');
    const composed = variant.composeLabel('01L01A');

    expect(composed.primaryLineText).toBe('L01');
    expect(composed.secondaryLineText).toBe('01');
    expect(composed.tertiaryLineText).toBe('A');
    expect(composed.fullSpacedValue).toBe('01 L01 A');
    expect(composed.encodedBarcodeValue).toBe('01L01A');
  });

  it('composes shelf-emphasis variant with shelf primary and full spaced secondary line', () => {
    const variant = getMiniCompositionVariant('mini-shelf-emphasis');
    const composed = variant.composeLabel('BR1L01A');

    expect(composed.primaryLineText).toBe('A');
    expect(composed.secondaryLineText).toBe('BR1 L01 A');
    expect(composed.tertiaryLineText).toBeUndefined();
    expect(composed.fullSpacedValue).toBe('BR1 L01 A');
    expect(composed.encodedBarcodeValue).toBe('BR1L01A');
  });
});
