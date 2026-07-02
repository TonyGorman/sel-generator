import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-barcode', () => ({
  default: ({ value, width, height }: { value: string; width: number; height: number }) => (
    <div data-testid="label-value" data-width={String(width)} data-height={String(height)}>{value}</div>
  ),
}));

const setQuery = (query: string): void => {
  const suffix = query ? `?${query}` : '';
  window.history.replaceState({}, '', `/${suffix}`);
};

const importLabelTileWithQuery = async (query: string) => {
  setQuery(query);
  vi.resetModules();
  const module = await import('./LabelTile');
  return module.default;
};

afterEach(() => {
  setQuery('');
  vi.resetModules();
});

describe('LabelTile shelf-emphasis override', () => {
  it('renders shelf-emphasis mini composition when query override is set', async () => {
    const LabelTile = await importLabelTileWithQuery('miniVariant=mini-shelf-emphasis');

    render(<LabelTile code="01L01A" />);

    expect(screen.getByText('A', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('01 L01 A', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText('L01', { exact: true })).toBeNull();
    expect(screen.getByTestId('label-value')).toHaveTextContent('01L01A');

    const secondaryLine = document.querySelector('[class*="miniShelfFullValue"]');
    expect(secondaryLine?.getAttribute('style')).toContain('--current-mini-secondary-center-from-content-top-mm');
  });
});
