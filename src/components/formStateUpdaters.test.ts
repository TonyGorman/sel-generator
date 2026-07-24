import { describe, expect, it } from 'vitest';
import { setOptionalLetterField, setParsedNumericField } from './formStateUpdaters';

describe('formStateUpdaters', () => {
  it('sets parsed numeric values for valid digit input', () => {
    const prev = { bayStart: null as number | null, shelfStart: null as string | null };

    const next = setParsedNumericField(prev, 'bayStart', '07');

    expect(next.bayStart).toBe(7);
    expect(next.shelfStart).toBeNull();
  });

  it('sets parsed numeric values to null for invalid numeric input', () => {
    const prev = { bayStart: 4 as number | null };

    expect(setParsedNumericField(prev, 'bayStart', '').bayStart).toBeNull();
    expect(setParsedNumericField(prev, 'bayStart', 'x').bayStart).toBeNull();
  });

  it('normalizes optional letter values', () => {
    const prev = { shelfEnd: null as string | null };

    expect(setOptionalLetterField(prev, 'shelfEnd', 'C').shelfEnd).toBe('C');
    expect(setOptionalLetterField(prev, 'shelfEnd', '').shelfEnd).toBeNull();
  });
});
