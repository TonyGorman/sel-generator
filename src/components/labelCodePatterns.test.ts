import { describe, expect, it } from 'vitest';
import {
  AISLE_PREFIX_NUMBER_PATTERN,
  AISLE_TOKEN_PATTERN,
  SIDE_TOKEN_PATTERN,
  BAY_TOKEN_PATTERN,
  SHELF_TOKEN_PATTERN,
  buildCompactConfiguredAisleCodePattern,
  buildCompactLabelCodePattern,
  buildCompactShortCodePattern,
} from '../domain/labelCodePatterns';
import { AISLE_SIDES } from '../config/labelConfig';

describe('labelCodePatterns', () => {
  it('keeps aisle token pattern numeric-only', () => {
    expect(AISLE_TOKEN_PATTERN).toBe('\\d{2}');
    expect(AISLE_PREFIX_NUMBER_PATTERN).toBe('\\d{1,2}');
    expect(SIDE_TOKEN_PATTERN).toBe(`(?:${AISLE_SIDES.join('|')})`);
    expect(BAY_TOKEN_PATTERN).toBe('\\d{2}');
    expect(SHELF_TOKEN_PATTERN).toBe('[A-Z]');
  });

  it('matches compact aisle labels with configured prefixes only', () => {
    const pattern = buildCompactConfiguredAisleCodePattern(['BR', 'BL', 'FL', 'FR']);

    expect(pattern).not.toBeNull();
    expect(pattern?.test('BR1L01A')).toBe(true);
    expect(pattern?.test('BR10L01A')).toBe(true);
    expect(pattern?.test('FL2R02B')).toBe(true);
    expect(pattern?.test('PR1L01A')).toBe(false);
    expect(pattern?.test('BRL01A')).toBe(false);
  });

  it('returns null when no configured aisle prefixes are supplied', () => {
    const pattern = buildCompactConfiguredAisleCodePattern([]);

    expect(pattern).toBeNull();
  });

  it('prefers longest configured prefix first when configured prefixes overlap', () => {
    const pattern = buildCompactConfiguredAisleCodePattern(['B', 'BR']);

    expect(pattern).not.toBeNull();

    const match = pattern?.exec('BR10L01A');
    expect(match?.[1]).toBe('BR');
    expect(match?.[2]).toBe('10');
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
