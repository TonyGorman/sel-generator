import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LabelTile, { getDashedLabelCode, getEncodedLabelCode, getLargeSelDisplayParts, getMiniPrimaryFontSizeMm, getPrimaryLabelText } from './LabelTile';
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
  secondaryCodeFormat: 'dashes',
  backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
};

describe('LabelTile helpers', () => {
  it('keeps already dashed values unchanged', () => {
    expect(getDashedLabelCode('01-L01-A')).toBe('01-L01-A');
  });

  it('formats compact aisle code into dashed output', () => {
    expect(getDashedLabelCode('01L01A')).toBe('01-L01-A');
  });

  it('formats compact back wall code into dashed output', () => {
    expect(getDashedLabelCode(`${DEFAULT_BACK_CODE_PREFIX}01A`)).toBe(`${DEFAULT_BACK_CODE_PREFIX}-01-A`);
  });

  it('keeps named aisle values unchanged in dashed display', () => {
    expect(getDashedLabelCode('FLORAL')).toBe('FLORAL');
    expect(getDashedLabelCode('kiosk')).toBe('KIOSK');
  });

  it('encodes compact aisle values without separators for scanners', () => {
    expect(getEncodedLabelCode('01L01A')).toBe('01L01A');
  });

  it('encodes dashed aisle values to compact scanner payload', () => {
    expect(getEncodedLabelCode('01-L01-A')).toBe('01L01A');
  });

  it('encodes dashed back wall values to compact scanner payload', () => {
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

  it('formats compact custom back wall prefix code into dashed output', () => {
    expect(getDashedLabelCode('9901A', 'Back', '99')).toBe('99-01-A');
  });

  it('uses Back fallback formatting when type is Back and code does not match compact patterns', () => {
    expect(getDashedLabelCode('ABCDE7', 'Back', 'BK')).toBe('AB-CD-E7');
  });

  it('returns unknown, non-valid values unchanged', () => {
    expect(getDashedLabelCode('ABCDEF')).toBe('ABCDEF');
  });

  it('builds side and bay primary text with spaces secondary format', () => {
    expect(
      getPrimaryLabelText('01L01A', 'spaces', 'Aisle'),
    ).toEqual({
      primary: 'L01',
      secondary: '01 L01 A',
    });
  });

  it('uses dashed parts parsing for already dashed values', () => {
    expect(
      getPrimaryLabelText('01-L01-A', 'dashes', 'Aisle'),
    ).toEqual({
      primary: 'L01',
      secondary: '01-L01-A',
    });
  });

  it('uses Back fallback primary parsing when type is Back and pattern does not match', () => {
    expect(
      getPrimaryLabelText('ABCDE9', 'dashes', 'Back', 'BK'),
    ).toEqual({
      primary: 'BKCD',
      secondary: 'AB-CD-E9',
    });
  });

  it('returns raw fallback primary and secondary for unknown shape values', () => {
    expect(
      getPrimaryLabelText('AA-BB', 'dashes', 'Aisle'),
    ).toEqual({
      primary: 'AA-BB',
      secondary: 'AA-BB',
    });
  });

  it('returns compact back wall primary text for valid back wall values', () => {
    expect(
      getPrimaryLabelText(`${DEFAULT_BACK_CODE_PREFIX}01A`, 'dashes', 'Back'),
    ).toEqual({
      primary: `${DEFAULT_BACK_CODE_PREFIX}01`,
      secondary: `${DEFAULT_BACK_CODE_PREFIX}-01-A`,
    });
  });

  it('renders dashed back wall input with back wall secondary text', () => {
    expect(
      getPrimaryLabelText(`${DEFAULT_BACK_CODE_PREFIX}-01-A`, 'dashes'),
    ).toEqual({
      primary: `${DEFAULT_BACK_CODE_PREFIX}01`,
      secondary: `${DEFAULT_BACK_CODE_PREFIX}-01-A`,
    });
  });

  it('renders custom Back prefix for primary and secondary text', () => {
    expect(
      getPrimaryLabelText('9901A', 'dashes', 'Back', '99'),
    ).toEqual({
      primary: '9901',
      secondary: '99-01-A',
    });
  });

  it('returns unchanged output for plain non-matching values', () => {
    expect(getDashedLabelCode('XYZ')).toBe('XYZ');
    expect(
      getPrimaryLabelText('XYZ', 'dashes', 'Aisle'),
    ).toEqual({
      primary: 'XYZ',
      secondary: 'XYZ',
    });
  });

  it('returns named aisle value as primary and secondary text', () => {
    expect(
      getPrimaryLabelText('FLORAL', 'dashes', 'Specific'),
    ).toEqual({
      primary: 'FLORAL',
      secondary: 'FLORAL',
    });
  });

  it('parses large-sel display parts from aisle values', () => {
    expect(getLargeSelDisplayParts('31L03A', 'Aisle')).toEqual({
      prefix: '31-',
      main: 'L03',
      suffix: '-A',
    });
  });

  it('parses large-sel display parts with spaced separators when configured', () => {
    expect(getLargeSelDisplayParts('31L03A', 'Aisle', undefined, undefined, 'spaces')).toEqual({
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
  it('renders primary and secondary text with dashed label value', () => {
    render(<LabelTile code="01L01A" config={defaultConfig} type="Aisle" />);

    expect(screen.getByText('L01')).toBeInTheDocument();
    expect(screen.getByText('01-L01-A')).toBeInTheDocument();
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

  it('barcode payload stays compact with dashes secondary format', () => {
    const dashesConfig: ILabelConfig = { ...defaultConfig, secondaryCodeFormat: 'dashes' };
    render(<LabelTile code="01L01A" config={dashesConfig} type="Aisle" />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getByText('01-L01-A')).toBeInTheDocument();
  });

  it('barcode payload stays compact with spaces secondary format', () => {
    const spacesConfig: ILabelConfig = { ...defaultConfig, secondaryCodeFormat: 'spaces' };
    render(<LabelTile code="01L01A" config={spacesConfig} type="Aisle" />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getByText('01 L01 A')).toBeInTheDocument();
  });

  it('barcode payload identical regardless of secondary format selection', () => {
    const dashesConfig: ILabelConfig = { ...defaultConfig, secondaryCodeFormat: 'dashes' };
    const spacesConfig: ILabelConfig = { ...defaultConfig, secondaryCodeFormat: 'spaces' };

    const { rerender } = render(<LabelTile code="01L01A" config={dashesConfig} type="Aisle" />);
    const dashesBarcode = screen.getByTestId('label-value').textContent;

    rerender(<LabelTile code="01L01A" config={spacesConfig} type="Aisle" />);
    const spacesBarcode = screen.getByTestId('label-value').textContent;

    expect(dashesBarcode).toBe(spacesBarcode);
    expect(dashesBarcode).toBe('01L01A');
  });

  it('Specific label with dashed input produces compact barcode payload', () => {
    const spacesConfig: ILabelConfig = { ...defaultConfig, secondaryCodeFormat: 'spaces' };
    render(<LabelTile code="01-L01-A" config={spacesConfig} type="Specific" />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getByText('01 L01 A')).toBeInTheDocument();
  });

  it('Specific label with spaced input produces compact barcode payload', () => {
    const spacesConfig: ILabelConfig = { ...defaultConfig, secondaryCodeFormat: 'spaces' };
    render(<LabelTile code="01 L01 A" config={spacesConfig} type="Specific" />);

    // Core requirement: barcode payload must always be compact, regardless of input format
    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
  });

  it('Specific label with compact input produces compact barcode payload', () => {
    const dashesConfig: ILabelConfig = { ...defaultConfig, secondaryCodeFormat: 'dashes' };
    render(<LabelTile code="01L01A" config={dashesConfig} type="Specific" />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getByText('01-L01-A')).toBeInTheDocument();
  });

  it('Specific back label with dashed input produces compact barcode payload', () => {
    const dashesConfig: ILabelConfig = { ...defaultConfig, secondaryCodeFormat: 'dashes' };
    render(<LabelTile code={`${DEFAULT_BACK_CODE_PREFIX}-01-A`} config={dashesConfig} type="Specific" />);

    expect(screen.getByTestId('label-value')).toHaveTextContent(`${DEFAULT_BACK_CODE_PREFIX}01A`);
  });

  it('Specific back label with compact input produces compact barcode payload', () => {
    const dashesConfig: ILabelConfig = { ...defaultConfig, secondaryCodeFormat: 'dashes' };
    render(<LabelTile code={`${DEFAULT_BACK_CODE_PREFIX}01A`} config={dashesConfig} type="Specific" />);

    expect(screen.getByTestId('label-value')).toHaveTextContent(`${DEFAULT_BACK_CODE_PREFIX}01A`);
  });

  it('Specific named aisle value does not split into bay/shelf fallback', () => {
    const dashesConfig: ILabelConfig = { ...defaultConfig, secondaryCodeFormat: 'dashes' };
    render(<LabelTile code="FLORAL" config={dashesConfig} type="Specific" />);

    expect(screen.getAllByText('FLORAL').length).toBeGreaterThan(1);
    expect(screen.getByTestId('label-value')).toHaveTextContent('FLORAL');
    expect(screen.queryByText('ORA')).not.toBeInTheDocument();
  });
});
