import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SpecificBarcode from './SpecificBarcode';
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

describe('SpecificBarcode', () => {
  it('shows error when submitted without input', () => {
    render(<SpecificBarcode config={defaultConfig} />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter at least one barcode value.');
  });

  it('shows error for invalid barcode values', () => {
    render(<SpecificBarcode config={defaultConfig} />);

    fireEvent.change(screen.getByPlaceholderText('Enter barcodes'), {
      target: { value: '00L01A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid codes only.');
  });

  it('normalizes valid values and renders generated barcodes', () => {
    render(<SpecificBarcode config={defaultConfig} />);

    fireEvent.change(screen.getByPlaceholderText('Enter barcodes'), {
      target: { value: ' 01l01a , bak-01-2 ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-barcodes')).toHaveTextContent('01L01A|BAK-01-2');
  });

  it('accepts compact BAK values and renders generated list', () => {
    render(<SpecificBarcode config={defaultConfig} />);

    fireEvent.change(screen.getByPlaceholderText('Enter barcodes'), {
      target: { value: 'BAK01A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-barcodes')).toHaveTextContent('BAK01A');
  });

  it('rejects values with invalid shelf tokens', () => {
    render(<SpecificBarcode config={defaultConfig} />);

    fireEvent.change(screen.getByPlaceholderText('Enter barcodes'), {
      target: { value: '01L01AA' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid codes only.');
  });
});