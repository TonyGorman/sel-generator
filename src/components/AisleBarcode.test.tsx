import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AisleBarcode from './AisleBarcode';
import { IBarcodeConfig } from '../models/IBarcodeConfig';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/barcodeConfig';

vi.mock('./BarcodeGenerator', () => ({
  default: ({ aisles }: { aisles: string[] }) => <div data-testid="generated-count">{aisles.length}</div>,
}));

const defaultConfig: IBarcodeConfig = {
  primaryCodeFormat: 'sideBay',
  shelfStyle: 'alphabetical',
  secondaryCodeFormat: 'dashes',
  backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
};

describe('AisleBarcode', () => {
  const fillInputs = (values: Record<number, string>): void => {
    const inputs = screen.getAllByRole('textbox');
    Object.entries(values).forEach(([index, value]) => {
      fireEvent.change(inputs[Number(index)], { target: { value } });
    });
  };

  it('shows required fields error when aisle and shelves are missing', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter aisle start, aisle end, and shelves using whole numbers.');
  });

  it('shows aisle range validation when aisle value is out of bounds', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fillInputs({ 0: '1', 1: '100', 10: '1' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Aisles must be between 1 and 99.');
  });

  it('shows shelf range validation before any range-order message', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fillInputs({ 0: '1', 1: '1', 10: '21' });

    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Shelves must be between 1 and 20.');
    expect(screen.queryByText('Aisle start cannot be greater than aisle end.')).not.toBeInTheDocument();
  });

  it('shows error when no side range is provided', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fillInputs({ 0: '1', 1: '2', 10: '5' });

    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter at least one complete side range');
  });

  it('shows aisle order validation when start is greater than end', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fillInputs({ 0: '3', 1: '2', 2: '1', 3: '1', 10: '1' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Aisle start cannot be greater than aisle end.');
  });

  it('shows side range order validation when side start is greater than side end', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fillInputs({ 0: '1', 1: '1', 2: '4', 3: '2', 10: '1' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Side range start cannot be greater than side range end.');
  });

  it('shows bay upper bound validation when side range exceeds max', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fillInputs({ 0: '1', 1: '1', 2: '1', 3: '100', 10: '1' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Bay values must be between 1 and 99.');
  });

  it('generates labels and updates summary for valid Left and Right ranges', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fillInputs({
      0: '1',
      1: '1',
      2: '1',
      3: '2',
      4: '1',
      5: '1',
      10: '2',
    });

    expect(screen.getByText('Left 01 – 02, Right 01 – 01')).toBeInTheDocument();
    expect(screen.getByText('A – B')).toBeInTheDocument();
    expect(screen.getByText('Total labels: 6')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-count')).toHaveTextContent('6');
  });

  it('renders numeric shelf summary when shelf style is number', () => {
    const numericConfig: IBarcodeConfig = {
      ...defaultConfig,
      shelfStyle: 'number',
    };

    render(<AisleBarcode config={numericConfig} onOpenConfiguration={vi.fn()} />);

    fillInputs({ 10: '2' });
    expect(screen.getByText('1 – 2')).toBeInTheDocument();
  });

  it('generates labels for End and Front side ranges', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fillInputs({
      0: '1',
      1: '1',
      6: '1',
      7: '1',
      8: '2',
      9: '2',
      10: '1',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-count')).toHaveTextContent('2');
    expect(screen.getByText('End 01 – 01, Front 02 – 02')).toBeInTheDocument();
  });

  it('shows error when aisle start is 0 or less', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fillInputs({ 0: '0', 1: '1', 10: '1' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Aisles must be between 1 and 99.');
  });

  it('shows error when shelves value is 0 or less', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fillInputs({ 0: '1', 1: '1', 2: '1', 3: '1', 10: '0' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Barcodes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Shelves must be between 1 and 20.');
  });

  it('opens configuration tab when the inline configuration link is clicked', () => {
    const onOpenConfiguration = vi.fn();

    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={onOpenConfiguration} />);

    fireEvent.click(screen.getByRole('link', { name: 'configuration section' }));
    expect(onOpenConfiguration).toHaveBeenCalledTimes(1);
  });

  it('does not render NaN when a letter is entered into a numeric field', () => {
    render(<AisleBarcode config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'a' } });

    expect(inputs[0]).toHaveValue('');
    expect(screen.queryByDisplayValue('NaN')).not.toBeInTheDocument();
  });
});
