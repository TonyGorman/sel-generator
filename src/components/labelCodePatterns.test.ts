import { describe, expect, it } from 'vitest';
import {
  AISLE_TOKEN_PATTERN,
  SIDE_TOKEN_PATTERN,
  BAY_TOKEN_PATTERN,
  SHELF_TOKEN_PATTERN,
  buildCompactLabelCodePattern,
  buildCompactShortCodePattern,
} from './labelCodePatterns';

describe('labelCodePatterns', () => {
  it('keeps aisle token pattern numeric-only', () => {
    expect(AISLE_TOKEN_PATTERN).toBe('\\d{2}');
    expect(SIDE_TOKEN_PATTERN).toBe('[LREF]');
    expect(BAY_TOKEN_PATTERN).toBe('\\d{2}');
    expect(SHELF_TOKEN_PATTERN).toBe('[A-Z]');
  });

  it('matches valid compact aisle labels and rejects non-numeric aisle tokens', () => {
    const pattern = buildCompactLabelCodePattern();

    expect(pattern.test('01L01A')).toBe(true);
    expect(pattern.test('A1L01A')).toBe(false);
    expect(pattern.test('01L011')).toBe(false);
  });

  it('matches compact short codes with uppercase normalized prefixes', () => {
    const pattern = buildCompactShortCodePattern('BAK');

    expect(pattern.test('BAK01A')).toBe(true);
    expect(pattern.test('bak01A')).toBe(false);
  });

  it('escapes regex characters in custom short code prefixes', () => {
    const pattern = buildCompactShortCodePattern('B+');

    expect(pattern.test('B+01A')).toBe(true);
    expect(pattern.test('BB01A')).toBe(false);
  });

});
