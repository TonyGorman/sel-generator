import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LabelTile, { normalizeLabelCode, getEncodedLabelCode, getLargeSelDisplayParts, getMiniPrimaryFontSizeMm, getPrimaryLabelText } from './LabelTile';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/labelConfig';
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
  it('keeps already-separated input values unchanged', () => {
    expect(normalizeLabelCode('01-L01-A')).toBe('01-L01-A');
  });

  it('formats compact aisle code into separated output', () => {
    expect(normalizeLabelCode('01L01A')).toBe('01-L01-A');
  });

  it('formats compact back wall code into separated output', () => {
    expect(normalizeLabelCode(`${DEFAULT_BACK_CODE_PREFIX}01A`)).toBe(`${DEFAULT_BACK_CODE_PREFIX}-01-A`);
  });

  it('keeps named aisle values unchanged in normalized form', () => {
    expect(normalizeLabelCode('FLORAL')).toBe('FLORAL');
    expect(normalizeLabelCode('kiosk')).toBe('KIOSK');
  });

  it('encodes compact aisle values without separators for scanners', () => {
    expect(getEncodedLabelCode('01L01A')).toBe('01L01A');
  });

  it('encodes separated aisle values to compact scanner payload', () => {
    expect(getEncodedLabelCode('01-L01-A')).toBe('01L01A');
  });

  it('encodes separated back wall values to compact scanner payload', () => {
    expect(getEncodedLabelCode(`${DEFAULT_BACK_CODE_PREFIX}-01-A`, 'Back')).toBe(`${DEFAULT_BACK_CODE_PREFIX}01A`);
  });

  it('encodes lowercase named aisle values as uppercase barcode payloads', () => {
    expect(getEncodedLabelCode('kiosk')).toBe('KIOSK');
    expect(getEncodedLabelCode('floral')).toBe('FLORAL');
  });

  it('encodes spaced aisle values to compact scanner payload', () => {
    expect(getEncodedLabelCode('01 L01 A')).toBe('01L01A');
  });

  it('encodes spaced back wall values to compact scanner payload', () => {
    expect(getEncodedLabelCode(`${DEFAULT_BACK_CODE_PREFIX} 01 A`, 'Back')).toBe(`${DEFAULT_BACK_CODE_PREFIX}01A`);
  });

  it('formats compact custom back wall prefix code into separated output', () => {
    expect(normalizeLabelCode('9901A', 'Back', '99')).toBe('99-01-A');
  });

  it('uses Back fallback formatting when type is Back and code does not match compact patterns', () => {
    expect(normalizeLabelCode('ABCDE7', 'Back', 'BK')).toBe('AB-CD-E7');
  });

  it('returns unknown, non-valid values unchanged', () => {
    expect(normalizeLabelCode('ABCDEF')).toBe('ABCDEF');
  });

  it('builds side and bay primary text with spaces secondary display for compact aisle input', () => {
    expect(
      getPrimaryLabelText('01L01A', 'Aisle'),
    ).toEqual({
      primary: 'L01',
      secondary: '01 L01 A',
    });
  });

  it('uses separated parts parsing and normalizes secondary display to spaces for aisle values', () => {
    expect(
      getPrimaryLabelText('01-L01-A', 'Aisle'),
    ).toEqual({
      primary: 'L01',
      secondary: '01 L01 A',
    });
  });

  it('uses Back fallback primary parsing when type is Back and pattern does not match', () => {
    expect(
      getPrimaryLabelText('ABCDE9', 'Back', 'BK'),
    ).toEqual({
      primary: 'BKCD',
      secondary: 'AB CD E9',
    });
  });

  it('returns raw fallback primary and secondary for unknown shape values', () => {
    expect(
      getPrimaryLabelText('AA-BB', 'Aisle'),
    ).toEqual({
      primary: 'AA-BB',
      secondary: 'AA BB',
    });
  });

  it('returns compact back wall primary text for valid back wall values', () => {
    expect(
      getPrimaryLabelText(`${DEFAULT_BACK_CODE_PREFIX}01A`, 'Back'),
    ).toEqual({
      primary: `${DEFAULT_BACK_CODE_PREFIX}01`,
      secondary: `${DEFAULT_BACK_CODE_PREFIX} 01 A`,
    });
  });

  it('renders separated back wall input with spaces secondary text in back flow', () => {
    expect(
      getPrimaryLabelText(`${DEFAULT_BACK_CODE_PREFIX}-01-A`),
    ).toEqual({
      primary: `${DEFAULT_BACK_CODE_PREFIX}01`,
      secondary: `${DEFAULT_BACK_CODE_PREFIX} 01 A`,
    });
  });

  it('renders custom Back prefix for primary and secondary text', () => {
    expect(
      getPrimaryLabelText('9901A', 'Back', '99'),
    ).toEqual({
      primary: '9901',
      secondary: '99 01 A',
    });
  });

  it('returns unchanged output for plain non-matching values', () => {
    expect(normalizeLabelCode('XYZ')).toBe('XYZ');
    expect(
      getPrimaryLabelText('XYZ', 'Aisle'),
    ).toEqual({
      primary: 'XYZ',
      secondary: 'XYZ',
    });
  });

  it('returns named aisle value as primary and secondary text', () => {
    expect(
      getPrimaryLabelText('FLORAL', 'Specific'),
    ).toEqual({
      primary: 'FLORAL',
      secondary: 'FLORAL',
    });
  });

  it('parses large-sel display parts from aisle values', () => {
    expect(getLargeSelDisplayParts('31L03A', 'Aisle')).toEqual({
      prefix: '31 ',
      main: 'L03',
      suffix: ' A',
    });
  });

  it('parses large-sel display parts with spaces when input includes spaces', () => {
    expect(getLargeSelDisplayParts('31 L03 A', 'Aisle')).toEqual({
      prefix: '31 ',
      main: 'L03',
      suffix: ' A',
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
    render(<LabelTile code="01L01A" config={defaultConfig} type="Aisle" />);

    expect(screen.getByText('L01')).toBeInTheDocument();
    expect(screen.getByText('01 L01 A')).toBeInTheDocument();
    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getAllByText('01L01A')).toHaveLength(2);
  });

  it('anchors mini-sel secondary text with a fixed baseline style independent of primary length', () => {
    render(<LabelTile code="BACKWALL" config={defaultConfig} type="Specific" />);

    const secondary = screen.getAllByText('BACKWALL')[1];

    expect(secondary.getAttribute('style')).toContain('--current-mini-secondary-top-from-content-top-mm');
  });

  it('uses layout strategy label sizing for large-sel mode', () => {
    render(<LabelTile code="01L01A" config={defaultConfig} type="Aisle" layoutMode="large-sel" />);

    const label = screen.getByTestId('label-value');
    const largeSelTypography = getLabelLayoutStrategy('large-sel').typography;

    expect(label).toHaveAttribute('data-width', String(mmToPx(largeSelTypography.barcodeModuleThicknessMm)));
    expect(label).toHaveAttribute('data-height', String(mmToPx(largeSelTypography.barcodeHeightMm)));
    expect(screen.getAllByText('01L01A')).toHaveLength(2);
  });

  it('barcode payload stays compact with compact aisle input', () => {
    render(<LabelTile code="01L01A" config={defaultConfig} type="Aisle" />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getByText('01 L01 A')).toBeInTheDocument();
  });

  it('barcode payload stays compact with spaced aisle input', () => {
    render(<LabelTile code="01 L01 A" config={defaultConfig} type="Aisle" />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getAllByText('01 L01 A').length).toBeGreaterThan(0);
  });

  it('barcode payload stays identical across compact, separated, and spaced aisle input', () => {
    const { rerender } = render(<LabelTile code="01L01A" config={defaultConfig} type="Aisle" />);
    const compactBarcode = screen.getByTestId('label-value').textContent;

    rerender(<LabelTile code="01-L01-A" config={defaultConfig} type="Aisle" />);
    const separatedBarcode = screen.getByTestId('label-value').textContent;

    rerender(<LabelTile code="01 L01 A" config={defaultConfig} type="Aisle" />);
    const spacedBarcode = screen.getByTestId('label-value').textContent;

    expect(compactBarcode).toBe(separatedBarcode);
    expect(compactBarcode).toBe(spacedBarcode);
    expect(compactBarcode).toBe('01L01A');
  });

  it('Specific label with compact input produces compact barcode payload', () => {
    render(<LabelTile code="01L01A" config={defaultConfig} type="Specific" />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getAllByText('01L01A').length).toBeGreaterThan(1);
  });

  it('Specific label with compact input keeps compact display formatting', () => {
    render(<LabelTile code="01L01A" config={defaultConfig} type="Specific" />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getAllByText('01L01A').length).toBeGreaterThan(1);
    expect(screen.queryByText('01 L01 A')).not.toBeInTheDocument();
  });

  it('Specific back label with compact input produces compact barcode payload', () => {
    render(<LabelTile code={`${DEFAULT_BACK_CODE_PREFIX}01A`} config={defaultConfig} type="Specific" />);

    expect(screen.getByTestId('label-value')).toHaveTextContent(`${DEFAULT_BACK_CODE_PREFIX}01A`);
  });

  it('Specific named aisle value does not split into bay/shelf fallback', () => {
    render(<LabelTile code="FLORAL" config={defaultConfig} type="Specific" />);

    expect(screen.getAllByText('FLORAL').length).toBeGreaterThan(1);
    expect(screen.getByTestId('label-value')).toHaveTextContent('FLORAL');
    expect(screen.queryByText('ORA')).not.toBeInTheDocument();
  });
});
