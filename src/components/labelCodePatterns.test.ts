import { describe, expect, it } from 'vitest';
import {
  AISLE_TOKEN_PATTERN,
  SIDE_TOKEN_PATTERN,
  BAY_TOKEN_PATTERN,
  SHELF_TOKEN_PATTERN,
  buildCompactLabelCodePattern,
  buildCompactBackCodePattern,
} from './labelCodePatterns';

describe('labelCodePatterns', () => {
  it('keeps aisle token pattern numeric-only', () => {
    expect(AISLE_TOKEN_PATTERN).toBe('\\d{2}');
    expect(SIDE_TOKEN_PATTERN).toBe('[LREF]');
    expect(BAY_TOKEN_PATTERN).toBe('\\d{2}');
    expect(SHELF_TOKEN_PATTERN).toBe('[A-Z0-9]+');
  });

  it('matches valid compact aisle labels and rejects non-numeric aisle tokens', () => {
    const pattern = buildCompactLabelCodePattern();

    expect(pattern.test('01L01A')).toBe(true);
    expect(pattern.test('A1L01A')).toBe(false);
  });

  it('matches compact back labels with uppercase normalized prefixes', () => {
    const pattern = buildCompactBackCodePattern('BACK');

    expect(pattern.test('BACK01A')).toBe(true);
    expect(pattern.test('back01A')).toBe(false);
  });

  it('escapes regex characters in custom back prefixes', () => {
    const pattern = buildCompactBackCodePattern('B+');

    expect(pattern.test('B+01A')).toBe(true);
    expect(pattern.test('BB01A')).toBe(false);
  });

});
