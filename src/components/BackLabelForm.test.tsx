import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BackLabelForm from './BackLabelForm';
import { SHORT_CODE_PREFIXES, MAX_BAY_VALUE, MAX_SHELF_LETTER } from '../config/labelConfig';

vi.mock('./LabelGenerator', () => ({
  default: ({ labelCodes }: { labelCodes: string[] }) => (
    <div data-testid="generated-labels">{labelCodes.join('|')}</div>
  ),
}));

describe('BackLabelForm', () => {
  it('shows validation error when fields are missing', () => {
    render(<BackLabelForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter start bay, end bay, and select a last shelf.');
  });

  it('shows validation error when start bay is greater than end bay', () => {
    render(<BackLabelForm />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '5' } });
    fireEvent.change(inputs[1], { target: { value: '3' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'B' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Start bay cannot be greater than end bay.');
  });

  it('generates expected short codes for range and shelves', () => {
    render(<BackLabelForm />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'B' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent(`${SHORT_CODE_PREFIXES[0]}01A|${SHORT_CODE_PREFIXES[0]}01B|${SHORT_CODE_PREFIXES[0]}02A|${SHORT_CODE_PREFIXES[0]}02B`);
  });

  it('shows validation error when bay start is below 1', () => {
    render(<BackLabelForm />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '0' } });
    fireEvent.change(inputs[1], { target: { value: '5' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'B' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Bays must be between/i);
    expect(alert).toHaveTextContent(String(MAX_BAY_VALUE));
  });

  it('shows shelf select with letters A through MAX_SHELF_LETTER', () => {
    render(<BackLabelForm />);

    const select = screen.getByRole('combobox', { name: 'Last Shelf' });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: MAX_SHELF_LETTER })).toBeInTheDocument();
  });

  it('switches short code type to Front and generates FOS labels', () => {
    render(<BackLabelForm />);

    fireEvent.click(screen.getByLabelText('FOS'));

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'B' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent('FOS01A|FOS01B');
  });

  it('does not render NaN when a letter is entered into a numeric field', () => {
    render(<BackLabelForm />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'a' } });

    expect(inputs[0]).toHaveValue('');
    expect(screen.queryByDisplayValue('NaN')).not.toBeInTheDocument();
  });

  it('blocks generation when total labels exceed hard limit', () => {
    render(<BackLabelForm />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '99' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'L' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Too many labels requested.');
    expect(screen.queryByTestId('generated-labels')).not.toBeInTheDocument();
  });
});
