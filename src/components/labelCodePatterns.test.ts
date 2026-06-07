import { describe, expect, it } from 'vitest';
import {
  AISLE_SIDE_PATTERN,
  AISLE_TOKEN_PATTERN,
  buildCompactAisleCodePattern,
  buildDashedAisleCodePattern,
  buildDashedAisleSideBayPattern,
} from './labelCodePatterns';

describe('labelCodePatterns', () => {
  it('keeps aisle token pattern numeric-only', () => {
    expect(AISLE_TOKEN_PATTERN).toBe('\\d{2}');
    expect(AISLE_SIDE_PATTERN).toBe('[LREF]');
  });

  it('matches valid compact aisle labels and rejects non-numeric aisle tokens', () => {
    const pattern = buildCompactAisleCodePattern();

    expect(pattern.test('01L01A')).toBe(true);
    expect(pattern.test('A1L01A')).toBe(false);
  });

  it('matches valid dashed aisle labels and rejects non-numeric aisle tokens', () => {
    const pattern = buildDashedAisleCodePattern();

    expect(pattern.test('01-L01-A')).toBe(true);
    expect(pattern.test('A1-L01-A')).toBe(false);
  });

  it('matches valid large-sel dashed aisle labels and rejects non-numeric aisle tokens', () => {
    const pattern = buildDashedAisleSideBayPattern();

    expect(pattern.test('01-L01-A')).toBe(true);
    expect(pattern.test('A1-L01-A')).toBe(false);
  });
});
