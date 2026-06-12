import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LabelTile, { normalizeLabelCode, getEncodedLabelCode, getLargeSelDisplayParts, getMiniPrimaryFontSizeMm, getPrimaryLabelText } from './LabelTile';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX, SPECIAL_AISLE_VALUES } from '../config/labelConfig';
import { getLabelLayoutStrategy } from '../config/labelLayoutStrategies';

const MM_TO_PX = 96 / 25.4;
const mmToPx = (mm: number): number => mm * MM_TO_PX;

vi.mock('react-barcode', () => ({
  default: ({ value, width, height }: { value: string; width: number; height: number }) => (
    <div data-testid="label-value" data-width={String(width)} data-height={String(height)}>{value}</div>
  ),
}));

const defaultConfig: ILabelConfig = {
  shelfStyle: 'alphabetical',
  backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
};

describe('LabelTile helpers', () => {
  it('formats compact aisle code into spaced display output', () => {
    expect(normalizeLabelCode('01L01A')).toBe('01 L01 A');
  });

  it('formats compact back wall code into spaced display output', () => {
    expect(normalizeLabelCode(`${DEFAULT_BACK_CODE_PREFIX}01A`)).toBe(`${DEFAULT_BACK_CODE_PREFIX} 01 A`);
  });

  it('keeps named aisle values unchanged in normalized form', () => {
    expect(normalizeLabelCode('FLORAL')).toBe('FLORAL');
    expect(normalizeLabelCode('kiosk')).toBe('KIOSK');
  });

  it('encodes compact aisle values without separators for scanners', () => {
    expect(getEncodedLabelCode('01L01A')).toBe('01L01A');
  });

  it('encodes lowercase named aisle values as uppercase barcode payloads', () => {
    expect(getEncodedLabelCode('kiosk')).toBe('KIOSK');
    expect(getEncodedLabelCode('floral')).toBe('FLORAL');
  });

  it('formats compact custom back wall prefix code into spaced display output', () => {
    expect(normalizeLabelCode('9901A', '99')).toBe('99 01 A');
  });

  it('returns unmatched Back code unchanged when fallback bay is non-numeric', () => {
    expect(normalizeLabelCode('ABCDE7', 'BK')).toBe('ABCDE7');
  });

  it('does not use Back fallback formatting for malformed bay tokens', () => {
    expect(normalizeLabelCode('BKA', 'BK')).toBe('BKA');
  });

  it('returns unknown, non-valid values unchanged', () => {
    expect(normalizeLabelCode('ABCDEF')).toBe('ABCDEF');
  });

  it('builds side and bay primary text with spaces secondary display for compact aisle input', () => {
    expect(
      getPrimaryLabelText('01L01A'),
    ).toEqual({
      primary: 'L01',
      secondary: '01 L01 A',
    });
  });

  it('returns raw primary and secondary when Back code fallback bay is non-numeric', () => {
    expect(
      getPrimaryLabelText('ABCDE9', 'BK'),
    ).toEqual({
      primary: 'ABCDE9',
      secondary: 'ABCDE9',
    });
  });

  it('does not use Back fallback primary parsing for malformed bay tokens', () => {
    expect(
      getPrimaryLabelText('BKA', 'BK'),
    ).toEqual({
      primary: 'BKA',
      secondary: 'BKA',
    });
  });

  it('returns raw fallback primary and secondary for unknown shape values', () => {
    expect(
      getPrimaryLabelText('UNKNOWN'),
    ).toEqual({
      primary: 'UNKNOWN',
      secondary: 'UNKNOWN',
    });
  });

  it('returns compact back wall primary text for valid back wall values', () => {
    expect(
      getPrimaryLabelText(`${DEFAULT_BACK_CODE_PREFIX}01A`),
    ).toEqual({
      primary: `${DEFAULT_BACK_CODE_PREFIX}01`,
      secondary: `${DEFAULT_BACK_CODE_PREFIX} 01 A`,
    });
  });

  it('renders custom Back prefix for primary and secondary text', () => {
    expect(
      getPrimaryLabelText('9901A', '99'),
    ).toEqual({
      primary: '9901',
      secondary: '99 01 A',
    });
  });

  it('returns unchanged output for plain non-matching values', () => {
    expect(normalizeLabelCode('XYZ')).toBe('XYZ');
    expect(
      getPrimaryLabelText('XYZ'),
    ).toEqual({
      primary: 'XYZ',
      secondary: 'XYZ',
    });
  });

  it('returns named aisle value as primary text with blank secondary text', () => {
    expect(
      getPrimaryLabelText('FLORAL', DEFAULT_BACK_CODE_PREFIX, SPECIAL_AISLE_VALUES),
    ).toEqual({
      primary: 'FLORAL',
      secondary: '',
    });
  });

  it('parses large-sel display parts from aisle values', () => {
    expect(getLargeSelDisplayParts('31L03A')).toEqual({
      prefix: '31',
      main: 'L03',
      suffix: 'A',
    });
  });

  it('parses large-sel display parts from back values', () => {
    expect(getLargeSelDisplayParts(`${DEFAULT_BACK_CODE_PREFIX}01A`)).toEqual({
      prefix: DEFAULT_BACK_CODE_PREFIX,
      main: '01',
      suffix: 'A',
    });
  });

  it('keeps mini primary size at max for short values', () => {
    const mini = getLabelLayoutStrategy('mini-sel');
    expect(getMiniPrimaryFontSizeMm('L01', mini)).toBe(mini.typography.primaryTextMaxSizeMm);
  });

  it('shrinks mini primary size for long values without going below min', () => {
    const mini = getLabelLayoutStrategy('mini-sel');
    const fitted = getMiniPrimaryFontSizeMm('LONGSHELFTOKEN999', mini);

    expect(fitted).toBeGreaterThanOrEqual(mini.typography.primaryTextMinSizeMm);
    expect(fitted).toBeLessThan(mini.typography.primaryTextMaxSizeMm);
  });

  it('does not auto-fit when layout mode is large-sel', () => {
    const large = getLabelLayoutStrategy('large-sel');
    expect(getMiniPrimaryFontSizeMm('LONGSHELFTOKEN999', large)).toBe(large.typography.primaryTextMaxSizeMm);
  });

  it('shrinks BACK plus bay tokens enough to avoid mini-label overflow', () => {
    const mini = getLabelLayoutStrategy('mini-sel');
    const fitted = getMiniPrimaryFontSizeMm('BACK01', mini);

    expect(fitted).toBeGreaterThanOrEqual(mini.typography.primaryTextMinSizeMm);
    expect(fitted).toBeLessThanOrEqual(9.5);
  });

  it('shrinks long named aisles enough to avoid mini-label overflow', () => {
    const mini = getLabelLayoutStrategy('mini-sel');
    const fitted = getMiniPrimaryFontSizeMm('BACKWALL', mini);

    expect(fitted).toBeGreaterThanOrEqual(mini.typography.primaryTextMinSizeMm);
    expect(fitted).toBeLessThanOrEqual(7.5);
  });
});

describe('LabelTile', () => {
  it('renders primary and secondary text for aisle label value', () => {
    render(<LabelTile code="01L01A" config={defaultConfig} />);

    expect(screen.getByText('L01')).toBeInTheDocument();
    expect(screen.getByText('01 L01 A')).toBeInTheDocument();
    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getAllByText('01L01A')).toHaveLength(2);
  });

  it('anchors mini-sel secondary text with a fixed baseline style independent of primary length', () => {
    render(<LabelTile code="BACKWALL" config={defaultConfig} />);

    const secondary = screen.getAllByText('BACKWALL')[1];

    expect(secondary.getAttribute('style')).toContain('--current-mini-secondary-top-from-content-top-mm');
  });

  it('uses layout strategy label sizing for large-sel mode', () => {
    render(<LabelTile code="01L01A" config={defaultConfig} layoutMode="large-sel" />);

    const label = screen.getByTestId('label-value');
    const largeSelTypography = getLabelLayoutStrategy('large-sel').typography;

    expect(label).toHaveAttribute('data-width', String(mmToPx(largeSelTypography.barcodeModuleThicknessMm)));
    expect(label).toHaveAttribute('data-height', String(mmToPx(largeSelTypography.barcodeHeightMm)));
    expect(screen.getAllByText('01L01A')).toHaveLength(2);
  });

  it('barcode payload stays compact with compact aisle input', () => {
    render(<LabelTile code="01L01A" config={defaultConfig} />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getByText('01 L01 A')).toBeInTheDocument();
  });

  it('Specific label with compact input produces compact barcode payload', () => {
    render(<LabelTile code="01L01A" config={defaultConfig} />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getAllByText('01L01A').length).toBeGreaterThan(1);
  });

  it('Specific label with compact input uses spaced secondary display formatting', () => {
    render(<LabelTile code="01L01A" config={defaultConfig} />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getAllByText('01L01A').length).toBeGreaterThan(1);
    expect(screen.getByText('01 L01 A')).toBeInTheDocument();
  });

  it('Specific back label with compact input produces compact barcode payload', () => {
    render(<LabelTile code={`${DEFAULT_BACK_CODE_PREFIX}01A`} config={defaultConfig} />);

    expect(screen.getByTestId('label-value')).toHaveTextContent(`${DEFAULT_BACK_CODE_PREFIX}01A`);
    expect(screen.getByText(`${DEFAULT_BACK_CODE_PREFIX} 01 A`)).toBeInTheDocument();
  });

  it('Specific named aisle value renders only in primary text for mini-sel', () => {
    const { container } = render(<LabelTile code="FLORAL" config={defaultConfig} />);

    expect(screen.getAllByText('FLORAL').length).toBeGreaterThan(1);
    expect(screen.getByTestId('label-value')).toHaveTextContent('FLORAL');
    const secondary = container.querySelector('[class*="secondaryCode"]');
    expect(secondary).not.toBeNull();
    expect(secondary).toHaveTextContent('');
    expect(screen.queryByText('ORA')).not.toBeInTheDocument();
  });

  it('uses primary text for large-sel fallback heading on special aisles', () => {
    const { container } = render(<LabelTile code="floral" config={defaultConfig} layoutMode="large-sel" />);

    const fallbackHeading = container.querySelector('[class*="largeSelHeadingFallback"]');
    expect(fallbackHeading).not.toBeNull();
    expect(fallbackHeading).toHaveTextContent('FLORAL');

    // Ensure compact barcode payload remains unchanged from normalized special value.
    expect(screen.getByTestId('label-value')).toHaveTextContent('FLORAL');
  });
});
