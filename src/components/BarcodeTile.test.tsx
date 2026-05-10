import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BarcodeTile, { getDashedCode, getPrimaryText } from './BarcodeTile';
import { IBarcodeConfig } from '../models/IBarcodeConfig';

vi.mock('react-barcode', () => ({
  default: ({ value }: { value: string }) => <div data-testid="barcode-value">{value}</div>,
}));

const defaultConfig: IBarcodeConfig = {
  primaryCodeFormat: 'sideBay',
  shelfStyle: 'alphabetical',
  secondaryCodeFormat: 'dashes',
};

describe('BarcodeTile helpers', () => {
  it('keeps already dashed values unchanged', () => {
    expect(getDashedCode('01-L01-A')).toBe('01-L01-A');
  });

  it('formats compact aisle code into dashed output', () => {
    expect(getDashedCode('01L01A')).toBe('01-L01-A');
  });

  it('formats compact BAK code into dashed output', () => {
    expect(getDashedCode('BAK01A')).toBe('BAK-01-A');
  });

  it('uses BAK fallback formatting when type is BAK and code does not match compact patterns', () => {
    expect(getDashedCode('ABCDE7', 'BAK')).toBe('ABC-DE-7');
  });

  it('uses generic 6-character fallback formatting for unknown values', () => {
    expect(getDashedCode('ABCDEF')).toBe('AB-CDE-F');
  });

  it('builds shelf-only primary text using numeric shelf style', () => {
    expect(
      getPrimaryText('01L01B', 'shelfOnly', 'number', 'dashes', 'Aisle'),
    ).toEqual({
      primary: '2',
      secondary: '01-L01-B',
    });
  });

  it('builds side and bay primary text with spaces secondary format', () => {
    expect(
      getPrimaryText('01L01A', 'sideBay', 'alphabetical', 'spaces', 'Aisle'),
    ).toEqual({
      primary: 'L01',
      secondary: '01 L01 A',
    });
  });

  it('uses dashed parts parsing for already dashed values', () => {
    expect(
      getPrimaryText('01-L01-A', 'shelfOnly', 'number', 'dashes', 'Aisle'),
    ).toEqual({
      primary: '1',
      secondary: '01-L01-A',
    });
  });

  it('uses BAK fallback primary parsing when type is BAK and pattern does not match', () => {
    expect(
      getPrimaryText('ABCDE9', 'shelfOnly', 'alphabetical', 'dashes', 'BAK'),
    ).toEqual({
      primary: 'I',
      secondary: 'ABC-DE-9',
    });
  });

  it('returns raw fallback primary and secondary for unknown shape values', () => {
    expect(
      getPrimaryText('AA-BB', 'sideBay', 'alphabetical', 'dashes', 'Aisle'),
    ).toEqual({
      primary: 'AA-BB',
      secondary: 'AA-BB',
    });
  });

  it('returns compact BAK primary text when primary format is sideBay', () => {
    expect(
      getPrimaryText('BAK01A', 'sideBay', 'alphabetical', 'dashes', 'BAK'),
    ).toEqual({
      primary: 'BK01',
      secondary: 'BAK-01-A',
    });
  });

  it('returns unchanged output for plain non-matching values', () => {
    expect(getDashedCode('XYZ')).toBe('XYZ');
    expect(
      getPrimaryText('XYZ', 'sideBay', 'alphabetical', 'dashes', 'Aisle'),
    ).toEqual({
      primary: 'XYZ',
      secondary: 'XYZ',
    });
  });

  it('handles non-digit non-letter tokens in convertShelfTokenToNumber', () => {
    expect(
      getPrimaryText('SPECIAL', 'shelfOnly', 'number', 'dashes', 'Aisle'),
    ).toEqual({
      primary: 'SPECIAL',
      secondary: 'SPECIAL',
    });
  });

  it('handles numeric tokens beyond 26 in convertShelfTokenToLetter', () => {
    expect(
      getPrimaryText('27', 'shelfOnly', 'alphabetical', 'dashes', 'Aisle'),
    ).toEqual({
      primary: '27',
      secondary: '27',
    });
  });

  it('returns unchanged plain numeric values when format does not match patterns', () => {
    expect(
      getPrimaryText('3', 'shelfOnly', 'alphabetical', 'dashes', 'Aisle'),
    ).toEqual({
      primary: '3',
      secondary: '3',
    });
  });
});

describe('BarcodeTile', () => {
  it('renders primary and secondary text with dashed barcode value', () => {
    render(<BarcodeTile code="01L01A" config={defaultConfig} type="Aisle" />);

    expect(screen.getByText('L01')).toBeInTheDocument();
    expect(screen.getAllByText('01-L01-A')).toHaveLength(2);
    expect(screen.getByTestId('barcode-value')).toHaveTextContent('01-L01-A');
  });
});