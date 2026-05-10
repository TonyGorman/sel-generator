import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BackBarcode from './BackBarcode';
import { IBarcodeConfig } from '../models/IBarcodeConfig';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/barcodeConfig';

vi.mock('./BarcodeGenerator', () => ({
  default: ({ aisles }: { aisles: string[] }) => (
    <div data-testid="generated-barcodes">{aisles.join('|')}</div>
  ),
}));

const defaultConfig: IBarcodeConfig = {
  primaryCodeFormat: 'sideBay',
  shelfStyle: 'alphabetical',
  secondaryCodeFormat: 'dashes',
  backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
};

describe('BackBarcode', () => {
  it('shows validation error when fields are missing', () => {
    render(<BackBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter start bay, end bay, and shelves using whole numbers.');
  });

  it('shows validation error when start bay is greater than end bay', () => {
    render(<BackBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '5' } });
    fireEvent.change(inputs[1], { target: { value: '3' } });
    fireEvent.change(inputs[2], { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Start bay cannot be greater than end bay.');
  });

  it('generates expected back wall codes for range and shelves', () => {
    render(<BackBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.change(inputs[2], { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-barcodes')).toHaveTextContent(`${DEFAULT_BACK_CODE_PREFIX}01A|${DEFAULT_BACK_CODE_PREFIX}01B|${DEFAULT_BACK_CODE_PREFIX}02A|${DEFAULT_BACK_CODE_PREFIX}02B`);
  });

  it('shows validation error when bay start is below 1', () => {
    render(<BackBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '0' } });
    fireEvent.change(inputs[1], { target: { value: '5' } });
    fireEvent.change(inputs[2], { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Bays must be between 1 and 99.');
  });

  it('shows validation error when shelves exceeds max', () => {
    render(<BackBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '5' } });
    fireEvent.change(inputs[2], { target: { value: '21' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Shelves must be between 1 and 20.');
  });

  it('generates codes with configured Back prefix', () => {
    render(<BackBarcode config={{ ...defaultConfig, backCodePrefix: '99' }} onOpenConfiguration={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    fireEvent.change(inputs[2], { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-barcodes')).toHaveTextContent('9901A|9901B');
  });

  it('opens configuration when configuration section link is clicked', () => {
    const onOpenConfiguration = vi.fn();
    render(<BackBarcode config={defaultConfig} onOpenConfiguration={onOpenConfiguration} />);

    fireEvent.click(screen.getByRole('link', { name: 'configuration section' }));

    expect(onOpenConfiguration).toHaveBeenCalledTimes(1);
  });
});
