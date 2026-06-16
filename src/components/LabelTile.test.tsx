import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LabelTile, { normalizeLabelCode, getEncodedLabelCode, getLargeSelDisplayParts, getMiniPrimaryFontSizeMm, getPrimaryLabelText } from './LabelTile';
import { SHORT_CODE_PREFIXES, SPECIAL_AISLE_VALUES } from '../config/labelConfig';
import { getLabelLayoutStrategy } from '../config/labelLayoutStrategies';

const MM_TO_PX = 96 / 25.4;
const mmToPx = (mm: number): number => mm * MM_TO_PX;

vi.mock('react-barcode', () => ({
  default: ({ value, width, height }: { value: string; width: number; height: number }) => (
    <div data-testid="label-value" data-width={String(width)} data-height={String(height)}>{value}</div>
  ),
}));

const defaultShortCodePrefix = SHORT_CODE_PREFIXES[0];

describe('LabelTile helpers', () => {
  it('formats compact aisle code into spaced display output', () => {
    expect(normalizeLabelCode('01L01A')).toBe('01 L01 A');
  });

  it('formats compact short code into spaced display output', () => {
    expect(normalizeLabelCode(`${SHORT_CODE_PREFIXES[0]}01A`)).toBe(`${SHORT_CODE_PREFIXES[0]} 01 A`);
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

  it('formats compact front-of-store code into spaced display output', () => {
    expect(normalizeLabelCode(`${SHORT_CODE_PREFIXES[1]}01A`)).toBe(`${SHORT_CODE_PREFIXES[1]} 01 A`);
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

  it('returns raw fallback primary and secondary for unknown shape values', () => {
    expect(
      getPrimaryLabelText('UNKNOWN'),
    ).toEqual({
      primary: 'UNKNOWN',
      secondary: 'UNKNOWN',
    });
  });

  it('returns compact short code primary text for valid short code values', () => {
    expect(
      getPrimaryLabelText(`${SHORT_CODE_PREFIXES[0]}01A`),
    ).toEqual({
      primary: SHORT_CODE_PREFIXES[0],
      secondary: `${SHORT_CODE_PREFIXES[0]} 01 A`,
    });
  });

  it('renders Front Of Store prefix for primary and secondary text', () => {
    expect(
      getPrimaryLabelText(`${SHORT_CODE_PREFIXES[1]}01A`),
    ).toEqual({
      primary: SHORT_CODE_PREFIXES[1],
      secondary: `${SHORT_CODE_PREFIXES[1]} 01 A`,
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
      getPrimaryLabelText('FLORAL', SHORT_CODE_PREFIXES[0]),
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
    expect(getLargeSelDisplayParts(`${SHORT_CODE_PREFIXES[0]}01A`)).toEqual({
      prefix: SHORT_CODE_PREFIXES[0],
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

  it('shrinks short code token enough to avoid mini-label overflow', () => {
    const mini = getLabelLayoutStrategy('mini-sel');
    const fitted = getMiniPrimaryFontSizeMm(`${SHORT_CODE_PREFIXES[0]}01`, mini);

    expect(fitted).toBeGreaterThanOrEqual(mini.typography.primaryTextMinSizeMm);
    expect(fitted).toBeLessThan(mini.typography.primaryTextMaxSizeMm);
  });

  it('shrinks long named aisles enough to avoid mini-label overflow', () => {
    const mini = getLabelLayoutStrategy('mini-sel');
    const fitted = getMiniPrimaryFontSizeMm('SEASONAL', mini);

    expect(fitted).toBeGreaterThanOrEqual(mini.typography.primaryTextMinSizeMm);
    expect(fitted).toBeLessThanOrEqual(7.5);
  });
});

describe('LabelTile', () => {
  it('renders primary and secondary text for aisle label value', () => {
    render(<LabelTile code="01L01A" shortCodePrefix={defaultShortCodePrefix} />);

    expect(screen.getByText('L01')).toBeInTheDocument();
    expect(screen.getByText('01 L01 A')).toBeInTheDocument();
    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getAllByText('01L01A')).toHaveLength(2);
  });

  it('anchors mini-sel secondary text with a fixed baseline style independent of primary length', () => {
    render(<LabelTile code="BAK" shortCodePrefix={defaultShortCodePrefix} />);

    const secondary = screen.getAllByText('BAK')[1];

    expect(secondary.getAttribute('style')).toContain('--current-mini-secondary-top-from-content-top-mm');
  });

  it('uses layout strategy label sizing for large-sel mode', () => {
    render(<LabelTile code="01L01A" shortCodePrefix={defaultShortCodePrefix} layoutMode="large-sel" />);

    const label = screen.getByTestId('label-value');
    const largeSelTypography = getLabelLayoutStrategy('large-sel').typography;

    expect(label).toHaveAttribute('data-width', String(mmToPx(largeSelTypography.barcodeModuleThicknessMm)));
    expect(label).toHaveAttribute('data-height', String(mmToPx(largeSelTypography.barcodeHeightMm)));
    expect(screen.getAllByText('01L01A')).toHaveLength(2);
  });

  it('barcode payload stays compact with compact aisle input', () => {
    render(<LabelTile code="01L01A" shortCodePrefix={defaultShortCodePrefix} />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getByText('01 L01 A')).toBeInTheDocument();
  });

  it('Specific label with compact input produces compact barcode payload', () => {
    render(<LabelTile code="01L01A" shortCodePrefix={defaultShortCodePrefix} />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getAllByText('01L01A').length).toBeGreaterThan(1);
  });

  it('Specific label with compact input uses spaced secondary display formatting', () => {
    render(<LabelTile code="01L01A" shortCodePrefix={defaultShortCodePrefix} />);

    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');
    expect(screen.getAllByText('01L01A').length).toBeGreaterThan(1);
    expect(screen.getByText('01 L01 A')).toBeInTheDocument();
  });

  it('Specific back label with compact input produces compact barcode payload', () => {
    render(<LabelTile code={`${SHORT_CODE_PREFIXES[0]}01A`} shortCodePrefix={defaultShortCodePrefix} />);

    expect(screen.getByTestId('label-value')).toHaveTextContent(`${SHORT_CODE_PREFIXES[0]}01A`);
    expect(screen.getByText(`${SHORT_CODE_PREFIXES[0]} 01 A`)).toBeInTheDocument();
  });

  it('Specific named aisle value renders only in primary text for mini-sel', () => {
    const { container } = render(<LabelTile code="FLORAL" shortCodePrefix={defaultShortCodePrefix} />);

    expect(screen.getAllByText('FLORAL').length).toBeGreaterThan(1);
    expect(screen.getByTestId('label-value')).toHaveTextContent('FLORAL');
    const secondary = container.querySelector('[class*="secondaryCode"]');
    expect(secondary).not.toBeNull();
    expect(secondary).toHaveTextContent('');
    expect(screen.queryByText('ORA')).not.toBeInTheDocument();
  });

  it('uses primary text for large-sel fallback heading on special aisles', () => {
    const { container } = render(<LabelTile code="floral" shortCodePrefix={defaultShortCodePrefix} layoutMode="large-sel" />);

    const fallbackHeading = container.querySelector('[class*="largeSelHeadingFallback"]');
    expect(fallbackHeading).not.toBeNull();
    expect(fallbackHeading).toHaveTextContent('FLORAL');

    // Ensure compact barcode payload remains unchanged from normalized special value.
    expect(screen.getByTestId('label-value')).toHaveTextContent('FLORAL');
  });
});
