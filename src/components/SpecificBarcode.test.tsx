import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SpecificBarcode from './SpecificBarcode';
import { IBarcodeConfig } from '../models/IBarcodeConfig';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/barcodeConfig';

vi.mock('./BarcodeGenerator', () => ({
  default: ({ aisles, layoutMode }: { aisles: string[]; layoutMode?: string }) => (
    <div data-testid="generated-barcodes" data-layout-mode={layoutMode}>{aisles.join('|')}</div>
  ),
}));

const defaultConfig: IBarcodeConfig = {
  primaryCodeFormat: 'sideBay',
  shelfStyle: 'alphabetical',
  secondaryCodeFormat: 'dashes',
  backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
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
      target: { value: ` 01l01a , ${DEFAULT_BACK_CODE_PREFIX.toLowerCase()}-01-2 ` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-barcodes')).toHaveTextContent(`01L01A|${DEFAULT_BACK_CODE_PREFIX}-01-2`);
  });

  it('accepts compact back wall values and renders generated list', () => {
    render(<SpecificBarcode config={defaultConfig} />);

    fireEvent.change(screen.getByPlaceholderText('Enter barcodes'), {
      target: { value: `${DEFAULT_BACK_CODE_PREFIX}01A` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-barcodes')).toHaveTextContent(`${DEFAULT_BACK_CODE_PREFIX}01A`);
  });

  it('rejects values with invalid shelf tokens', () => {
    render(<SpecificBarcode config={defaultConfig} />);

    fireEvent.change(screen.getByPlaceholderText('Enter barcodes'), {
      target: { value: '01L01AA' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid codes only.');
  });

  it('accepts configured back wall prefix values', () => {
    render(<SpecificBarcode config={{ ...defaultConfig, backCodePrefix: '99' }} />);

    fireEvent.change(screen.getByPlaceholderText('Enter barcodes'), {
      target: { value: '99-01-A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-barcodes')).toHaveTextContent('99-01-A');
  });

  it('rejects back wall values when Back prefix is configured differently', () => {
    render(<SpecificBarcode config={{ ...defaultConfig, backCodePrefix: '99' }} />);

    fireEvent.change(screen.getByPlaceholderText('Enter barcodes'), {
      target: { value: `${DEFAULT_BACK_CODE_PREFIX}01A` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid codes only.');
  });

  it('always renders specific labels using mini-sel mode', () => {
    render(<SpecificBarcode config={defaultConfig} />);

    fireEvent.change(screen.getByPlaceholderText('Enter barcodes'), {
      target: { value: '01L01A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByTestId('generated-barcodes')).toHaveAttribute('data-layout-mode', 'mini-sel');
  });
});