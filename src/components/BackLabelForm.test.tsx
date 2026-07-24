import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BackLabelForm from './BackLabelForm';
import { SHORT_CODE_PREFIXES, MAX_BAY_VALUE, MAX_SHELF_LETTER } from '../config/labelConfig';
import { clickGenerateLabels, setComboboxValue, setTextboxValues } from '../test/formTestHelpers';

vi.mock('./LabelGenerator', () => ({
  default: ({ labelCodes }: { labelCodes: string[] }) => (
    <div data-testid="generated-labels">{labelCodes.join('|')}</div>
  ),
}));

describe('BackLabelForm', () => {
  it('shows validation error when fields are missing', () => {
    render(<BackLabelForm />);

    clickGenerateLabels();

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter start bay, end bay, and select an end shelf.');
  });

  it('shows validation error when start bay is greater than end bay', () => {
    render(<BackLabelForm />);

    setTextboxValues({ 0: '5', 1: '3' });
    setComboboxValue('End Shelf', 'B');
    clickGenerateLabels();

    expect(screen.getByRole('alert')).toHaveTextContent('Start bay cannot be greater than end bay.');
  });

  it('generates expected short codes for range and shelves', () => {
    render(<BackLabelForm />);

    setTextboxValues({ 0: '1', 1: '2' });
    setComboboxValue('End Shelf', 'B');
    clickGenerateLabels();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent(`${SHORT_CODE_PREFIXES[0]}01A|${SHORT_CODE_PREFIXES[0]}01B|${SHORT_CODE_PREFIXES[0]}02A|${SHORT_CODE_PREFIXES[0]}02B`);
  });

  it('shows validation error when bay start is below 1', () => {
    render(<BackLabelForm />);

    setTextboxValues({ 0: '0', 1: '5' });
    setComboboxValue('End Shelf', 'B');
    clickGenerateLabels();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Bays must be between/i);
    expect(alert).toHaveTextContent(String(MAX_BAY_VALUE));
  });

  it('shows shelf start and end selects with letters A through MAX_SHELF_LETTER', () => {
    render(<BackLabelForm />);

    const startShelfSelect = screen.getByRole('combobox', { name: 'Start Shelf' });
    const endShelfSelect = screen.getByRole('combobox', { name: 'End Shelf' });

    expect(startShelfSelect).toBeInTheDocument();
    expect(endShelfSelect).toBeInTheDocument();
    expect(within(startShelfSelect).getByRole('option', { name: 'A' })).toBeInTheDocument();
    expect(within(endShelfSelect).getByRole('option', { name: MAX_SHELF_LETTER })).toBeInTheDocument();
  });

  it('switches short code type to Front and generates FOS labels', () => {
    render(<BackLabelForm />);

    fireEvent.click(screen.getByLabelText('FOS'));

    setTextboxValues({ 0: '1', 1: '1' });
    setComboboxValue('End Shelf', 'B');
    clickGenerateLabels();

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

    setTextboxValues({ 0: '1', 1: '99' });
    setComboboxValue('End Shelf', 'Z');
    clickGenerateLabels();

    expect(screen.getByRole('alert')).toHaveTextContent('Too many labels requested.');
    expect(screen.queryByTestId('generated-labels')).not.toBeInTheDocument();
  });

  it('supports shelf start to shelf end range generation', () => {
    render(<BackLabelForm />);

    setTextboxValues({ 0: '1', 1: '1' });
    setComboboxValue('Start Shelf', 'B');
    setComboboxValue('End Shelf', 'C');
    clickGenerateLabels();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent('BAK01B|BAK01C');
  });

  it('shows shelf ordering validation when start shelf is after end shelf', () => {
    render(<BackLabelForm />);

    setTextboxValues({ 0: '1', 1: '1' });
    setComboboxValue('Start Shelf', 'C');
    setComboboxValue('End Shelf', 'A');
    clickGenerateLabels();

    expect(screen.getByRole('alert')).toHaveTextContent('Start shelf must come before or equal to end shelf.');
    expect(screen.queryByTestId('generated-labels')).not.toBeInTheDocument();
  });
});
