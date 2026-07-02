import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LabelTile from './LabelTile';

vi.mock('react-barcode', () => ({
  default: ({ value, width, height }: { value: string; width: number; height: number }) => (
    <div data-testid="label-value" data-width={String(width)} data-height={String(height)}>{value}</div>
  ),
}));

describe('LabelTile shelf-emphasis selection', () => {
  it('renders shelf-emphasis mini composition when miniVariantId prop is set', () => {
    render(<LabelTile code="01L01A" miniVariantId="mini-shelf-emphasis" />);

    expect(screen.getByText('A', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('01 L01 A', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText('L01', { exact: true })).toBeNull();
    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');

    const secondaryLine = document.querySelector('[class*="miniShelfFullValue"]');
    expect(secondaryLine?.getAttribute('style')).toContain('--current-mini-secondary-center-from-content-top-mm');
  });
});
