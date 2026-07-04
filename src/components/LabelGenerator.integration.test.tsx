import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LabelGenerator from './LabelGenerator';

describe('LabelGenerator integration', () => {
  it('renders real LabelTile output for mini labels', () => {
    render(<LabelGenerator labelCodes={['01L01A']} />);

    expect(screen.getByRole('button', { name: 'Print Labels' })).toBeInTheDocument();
    expect(screen.getAllByText('01', { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('L01', { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('A', { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('01L01A').length).toBeGreaterThan(0);
    expect(document.querySelector('svg')).not.toBeNull();
  });

  it('invokes print from integrated generator path', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    render(<LabelGenerator labelCodes={['01L01A']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Print Labels' }));

    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });
});
