import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AisleLabelForm from './AisleLabelForm';
import { SHORT_CODE_PREFIXES, MIN_AISLE_VALUE, MAX_AISLE_VALUE, MAX_BAY_VALUE, MAX_SHELF_LETTER } from '../config/labelConfig';

vi.mock('./LabelGenerator', () => ({
  default: ({ labelCodes, layoutMode }: { labelCodes: string[]; layoutMode?: string }) => (
    <div data-testid="generated-count" data-layout-mode={layoutMode}>{labelCodes.length}</div>
  ),
}));

describe('AisleLabelForm', () => {
  const fillInputs = (values: Record<number, string>): void => {
    const inputs = screen.getAllByRole('textbox');
    Object.entries(values).forEach(([index, value]) => {
      fireEvent.change(inputs[Number(index)], { target: { value } });
    });
  };

  it('shows required fields error when aisle and shelves are missing', () => {
    render(<AisleLabelForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter aisle start, aisle end, and select a shelf.');
  });

  it('shows aisle range validation when aisle value is out of bounds', () => {
    render(<AisleLabelForm />);

    fillInputs({ 0: '1', 1: '100' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(String(MIN_AISLE_VALUE));
    expect(alert).toHaveTextContent(String(MAX_AISLE_VALUE));
  });

  it('shows select a shelf error when shelf is not selected', () => {
    render(<AisleLabelForm />);

    fillInputs({ 0: '1', 1: '1', 2: '1', 3: '2' });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('select a shelf');
  });

  it('shows error when no side range is provided', () => {
    render(<AisleLabelForm />);

    fillInputs({ 0: '1', 1: '2' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'E' } });

    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter at least one complete side range');
  });

  it('shows aisle order validation when start is greater than end', () => {
    render(<AisleLabelForm />);

    fillInputs({ 0: '3', 1: '2', 2: '1', 3: '1' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Aisle start cannot be greater than aisle end.');
  });

  it('shows side range order validation when side start is greater than side end', () => {
    render(<AisleLabelForm />);

    fillInputs({ 0: '1', 1: '1', 2: '4', 3: '2' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Side range start cannot be greater than side range end.');
  });

  it('shows bay upper bound validation when side range exceeds max', () => {
    render(<AisleLabelForm />);

    fillInputs({ 0: '1', 1: '1', 2: '1', 3: '100' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(String(MAX_BAY_VALUE));
  });

  it('generates labels and updates summary for valid Left and Right ranges', () => {
    render(<AisleLabelForm />);

    fillInputs({
      0: '1',
      1: '1',
      2: '1',
      3: '2',
      4: '1',
      5: '1',
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'B' } });

    expect(screen.getByText('Left 01 – 02, Right 01 – 01')).toBeInTheDocument();
    expect(screen.getByText('A – B')).toBeInTheDocument();
    expect(screen.getByText('Total labels: 6')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-count')).toHaveTextContent('6');
  });

  it('generates labels for End and Front side ranges', () => {
    render(<AisleLabelForm />);

    fillInputs({
      0: '1',
      1: '1',
      6: '1',
      7: '1',
      8: '2',
      9: '2',
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'A' } });

    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-count')).toHaveTextContent('2');
    expect(screen.getByText('End 01 – 01, Front 02 – 02')).toBeInTheDocument();
  });

  it('accepts aisle start at 0 and generates labels', () => {
    render(<AisleLabelForm />);

    fillInputs({ 0: '0', 1: '1', 2: '1', 3: '1' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-count')).toHaveTextContent('2');
  });

  it('shows shelf section with letter options from A to MAX_SHELF_LETTER', () => {
    render(<AisleLabelForm />);

    const select = screen.getByRole('combobox', { name: 'Last Shelf' });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: MAX_SHELF_LETTER })).toBeInTheDocument();
  });

  it('does not render NaN when a letter is entered into a numeric field', () => {
    render(<AisleLabelForm />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'a' } });

    expect(inputs[0]).toHaveValue('');
    expect(screen.queryByDisplayValue('NaN')).not.toBeInTheDocument();
  });

  it('passes large-sel mode to generator when Large SEL is selected', () => {
    render(<AisleLabelForm />);

    fireEvent.click(screen.getByLabelText('Large SEL'));

    fillInputs({
      0: '1',
      1: '1',
      2: '1',
      3: '1',
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'A' } });

    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByTestId('generated-count')).toHaveAttribute('data-layout-mode', 'large-sel');
  });
});
