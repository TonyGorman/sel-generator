import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AisleBarcode from './AisleBarcode';
import { IBarcodeConfig } from '../models/IBarcodeConfig';

vi.mock('./BarcodeGenerator', () => ({
  default: ({ aisles }: { aisles: string[] }) => <div data-testid="generated-count">{aisles.length}</div>,
}));

const defaultConfig: IBarcodeConfig = {
  primaryCodeFormat: 'sideBay',
  shelfStyle: 'alphabetical',
  secondaryCodeFormat: 'dashes',
};

describe('AisleBarcode', () => {
  it('shows shelf range validation before any range-order message', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    fireEvent.change(inputs[10], { target: { value: '21' } });

    fireEvent.click(screen.getByRole('button', { name: 'Generate labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Shelves must be between 1 and 20.');
    expect(screen.queryByText('Aisle start cannot be greater than aisle end.')).not.toBeInTheDocument();
  });

  it('shows error when no side range is provided', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.change(inputs[10], { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: 'Generate labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter at least one complete side range');
  });

  it('opens configuration tab when the inline configuration link is clicked', () => {
    const onOpenConfiguration = vi.fn();

    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={onOpenConfiguration} />);

    fireEvent.click(screen.getByRole('link', { name: 'configuration section' }));
    expect(onOpenConfiguration).toHaveBeenCalledTimes(1);
  });
});
