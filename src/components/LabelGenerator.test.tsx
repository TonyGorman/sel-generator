import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LabelGenerator from './LabelGenerator';
import { getLabelLayoutStrategy } from '../config/labelLayoutStrategies';

vi.mock('./LabelTile', () => ({
  default: ({ code }: { code: string }) => <div>{code}</div>,
  normalizeLabelCode: (code: string) => code,
  getEncodedLabelCode: (code: string) => code,
  getMiniPrimaryFontSizeMm: () => 13,

  getLargeSelDisplayParts: () => null,
}));

vi.mock('./Pagination', () => ({
  default: ({ onPageChange }: { onPageChange: (pageNumber: number) => void }) => (
    <button data-testid="pagination-trigger" onClick={() => onPageChange(2)}>Paginate</button>
  ),
}));

describe('LabelGenerator', () => {
  it('shows only print action in the action bar', () => {
    render(<LabelGenerator labelCodes={['01L01A']} />);

    expect(screen.getByRole('button', { name: 'Print Labels' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download Labels' })).not.toBeInTheDocument();
  });

  it('exposes shared Mini SEL secondary anchor geometry on the preview page style', () => {
    const { container } = render(<LabelGenerator labelCodes={['01L01A']} />);
    const miniTypography = getLabelLayoutStrategy('mini-sel').typography;

    const previewPage = container.querySelector('[class*="previewPage"]');

    expect(previewPage).not.toBeNull();
    expect(previewPage).toHaveStyle({
      '--current-primary-center-from-tile-top-mm': `${miniTypography.primaryCenterFromTileTopMm}mm`,
      '--current-secondary-baseline-from-tile-top-mm': `${miniTypography.secondaryBaselineFromTileTopMm}mm`,
      '--current-secondary-dom-top-offset-mm': `${miniTypography.secondaryDomTopOffsetMm}mm`,
    });
  });

  it('updates preview items through pagination callback', () => {
    const labelCodes = Array.from({ length: 36 }, (_, index) => `01L${String(index + 1).padStart(2, '0')}A`);
    const { container } = render(<LabelGenerator labelCodes={labelCodes} />);
    const previewPage = container.querySelector('[class*="previewPage"]');

    expect(previewPage).not.toBeNull();
    expect(within(previewPage as HTMLElement).getByText('01L01A')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pagination-trigger'));

    expect(within(previewPage as HTMLElement).getByText('01L36A')).toBeInTheDocument();
    expect(within(previewPage as HTMLElement).queryByText('01L01A')).not.toBeInTheDocument();
  });

  it('invokes window.print when print button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    render(<LabelGenerator labelCodes={['01L01A']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Print Labels' }));
    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });
});
