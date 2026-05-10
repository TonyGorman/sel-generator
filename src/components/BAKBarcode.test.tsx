import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BAKBarcode from './BAKBarcode';
import { IBarcodeConfig } from '../models/IBarcodeConfig';

vi.mock('./BarcodeGenerator', () => ({
  default: ({ aisles }: { aisles: string[] }) => (
    <div data-testid="generated-barcodes">{aisles.join('|')}</div>
  ),
}));

const defaultConfig: IBarcodeConfig = {
  primaryCodeFormat: 'sideBay',
  shelfStyle: 'alphabetical',
  secondaryCodeFormat: 'dashes',
};

describe('BAKBarcode', () => {
  it('shows validation error when fields are missing', () => {
    render(<BAKBarcode config={defaultConfig} />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter start bay, end bay, and shelves using whole numbers.');
  });

  it('shows validation error when start bay is greater than end bay', () => {
    render(<BAKBarcode config={defaultConfig} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '5' } });
    fireEvent.change(inputs[1], { target: { value: '3' } });
    fireEvent.change(inputs[2], { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Start bay cannot be greater than end bay.');
  });

  it('generates expected BAK codes for range and shelves', () => {
    render(<BAKBarcode config={defaultConfig} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.change(inputs[2], { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-barcodes')).toHaveTextContent('BAK01A|BAK01B|BAK02A|BAK02B');
  });

  it('shows validation error when bay start is below 1', () => {
    render(<BAKBarcode config={defaultConfig} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '0' } });
    fireEvent.change(inputs[1], { target: { value: '5' } });
    fireEvent.change(inputs[2], { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Bays must be between 1 and 99.');
  });

  it('shows validation error when shelves exceeds max', () => {
    render(<BAKBarcode config={defaultConfig} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '5' } });
    fireEvent.change(inputs[2], { target: { value: '21' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Shelves must be between 1 and 20.');
  });
});