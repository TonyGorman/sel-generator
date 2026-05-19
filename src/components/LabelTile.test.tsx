import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LabelTile, { getDashedLabelCode, getEncodedLabelCode, getLargeSelDisplayParts, getPrimaryLabelText } from './LabelTile';
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
  primaryCodeFormat: 'sideBay',
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

  it('encodes compact aisle values without separators for scanners', () => {
    expect(getEncodedLabelCode('01L01A')).toBe('01L01A');
  });

  it('encodes dashed aisle values to compact scanner payload', () => {
    expect(getEncodedLabelCode('01-L01-A')).toBe('01L01A');
  });

  it('encodes dashed back wall values to compact scanner payload', () => {
    expect(getEncodedLabelCode(`${DEFAULT_BACK_CODE_PREFIX}-01-A`, 'Back')).toBe(`${DEFAULT_BACK_CODE_PREFIX}01A`);
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
    expect(getDashedLabelCode('ABCDE7', 'Back')).toBe('AB-CD-E7');
  });

  it('uses generic 6-character fallback formatting for unknown values', () => {
    expect(getDashedLabelCode('ABCDEF')).toBe('AB-CDE-F');
  });

  it('builds shelf-only primary text using numeric shelf style', () => {
    expect(
      getPrimaryLabelText('01L01B', 'shelfOnly', 'number', 'dashes', 'Aisle'),
    ).toEqual({
      primary: '2',
      secondary: '01-L01-B',
    });
  });

  it('builds side and bay primary text with spaces secondary format', () => {
    expect(
      getPrimaryLabelText('01L01A', 'sideBay', 'alphabetical', 'spaces', 'Aisle'),
    ).toEqual({
      primary: 'L01',
      secondary: '01 L01 A',
    });
  });

  it('uses dashed parts parsing for already dashed values', () => {
    expect(
      getPrimaryLabelText('01-L01-A', 'shelfOnly', 'number', 'dashes', 'Aisle'),
    ).toEqual({
      primary: '1',
      secondary: '01-L01-A',
    });
  });

  it('uses Back fallback primary parsing when type is Back and pattern does not match', () => {
    expect(
      getPrimaryLabelText('ABCDE9', 'shelfOnly', 'alphabetical', 'dashes', 'Back'),
    ).toEqual({
      primary: 'E9',
      secondary: 'AB-CD-E9',
    });
  });

  it('returns raw fallback primary and secondary for unknown shape values', () => {
    expect(
      getPrimaryLabelText('AA-BB', 'sideBay', 'alphabetical', 'dashes', 'Aisle'),
    ).toEqual({
      primary: 'AA-BB',
      secondary: 'AA-BB',
    });
  });

  it('returns compact back wall primary text when primary format is sideBay', () => {
    expect(
      getPrimaryLabelText(`${DEFAULT_BACK_CODE_PREFIX}01A`, 'sideBay', 'alphabetical', 'dashes', 'Back'),
    ).toEqual({
      primary: `${DEFAULT_BACK_CODE_PREFIX}01`,
      secondary: `${DEFAULT_BACK_CODE_PREFIX}-01-A`,
    });
  });

  it('renders dashed back wall input with back wall secondary text', () => {
    expect(
      getPrimaryLabelText(`${DEFAULT_BACK_CODE_PREFIX}-01-A`, 'sideBay', 'alphabetical', 'dashes'),
    ).toEqual({
      primary: `${DEFAULT_BACK_CODE_PREFIX}01`,
      secondary: `${DEFAULT_BACK_CODE_PREFIX}-01-A`,
    });
  });

  it('renders custom Back prefix for primary and secondary text', () => {
    expect(
      getPrimaryLabelText('9901A', 'sideBay', 'alphabetical', 'dashes', 'Back', '99'),
    ).toEqual({
      primary: '9901',
      secondary: '99-01-A',
    });
  });

  it('returns unchanged output for plain non-matching values', () => {
    expect(getDashedLabelCode('XYZ')).toBe('XYZ');
    expect(
      getPrimaryLabelText('XYZ', 'sideBay', 'alphabetical', 'dashes', 'Aisle'),
    ).toEqual({
      primary: 'XYZ',
      secondary: 'XYZ',
    });
  });

  it('handles non-digit non-letter tokens in convertShelfTokenToNumber', () => {
    expect(
      getPrimaryLabelText('SPECIAL', 'shelfOnly', 'number', 'dashes', 'Aisle'),
    ).toEqual({
      primary: 'SPECIAL',
      secondary: 'SPECIAL',
    });
  });

  it('handles numeric tokens beyond 26 in convertShelfTokenToLetter', () => {
    expect(
      getPrimaryLabelText('27', 'shelfOnly', 'alphabetical', 'dashes', 'Aisle'),
    ).toEqual({
      primary: '27',
      secondary: '27',
    });
  });

  it('returns unchanged plain numeric values when format does not match patterns', () => {
    expect(
      getPrimaryLabelText('3', 'shelfOnly', 'alphabetical', 'dashes', 'Aisle'),
    ).toEqual({
      primary: '3',
      secondary: '3',
    });
  });

  it('parses large-sel display parts from aisle values', () => {
    expect(getLargeSelDisplayParts('31L03A', 'Aisle')).toEqual({
      prefix: '31-',
      main: 'L03',
      suffix: '-A',
    });
  });
});

describe('LabelTile', () => {
  it('renders primary and secondary text with dashed label value', () => {
    render(<LabelTile code="01L01A" config={defaultConfig} type="Aisle" />);

    expect(screen.getByText('L01')).toBeInTheDocument();
    expect(screen.getByText('01-L01-A')).toBeInTheDocument();
    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
  });

  it('uses layout strategy label sizing for large-sel mode', () => {
    render(<LabelTile code="01L01A" config={defaultConfig} type="Aisle" layoutMode="large-sel" />);

    const label = screen.getByTestId('label-value');
    const largeSelTypography = getLabelLayoutStrategy('large-sel').typography;

    expect(label).toHaveAttribute('data-width', String(mmToPx(largeSelTypography.barcodeModuleThicknessMm)));
    expect(label).toHaveAttribute('data-height', String(mmToPx(largeSelTypography.barcodeHeightMm)));
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
    render(<LabelTile code="BK-01-A" config={dashesConfig} type="Specific" />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('BK01A');
  });

  it('Specific back label with compact input produces compact barcode payload', () => {
    const dashesConfig: ILabelConfig = { ...defaultConfig, secondaryCodeFormat: 'dashes' };
    render(<LabelTile code="BK01A" config={dashesConfig} type="Specific" />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('BK01A');
  });
});
