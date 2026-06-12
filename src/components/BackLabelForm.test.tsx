import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BackLabelForm from './BackLabelForm';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX, MAX_BAY_VALUE, MAX_SHELF_LETTER } from '../config/labelConfig';

vi.mock('./LabelGenerator', () => ({
  default: ({ aisles }: { aisles: string[] }) => (
    <div data-testid="generated-labels">{aisles.join('|')}</div>
  ),
}));

const defaultConfig: ILabelConfig = {
  backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
};

describe('BackLabelForm', () => {
  it('shows validation error when fields are missing', () => {
    render(<BackLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter start bay, end bay, and select a last shelf.');
  });

  it('shows validation error when start bay is greater than end bay', () => {
    render(<BackLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '5' } });
    fireEvent.change(inputs[1], { target: { value: '3' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'B' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Start bay cannot be greater than end bay.');
  });

  it('generates expected back wall codes for range and shelves', () => {
    render(<BackLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'B' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent(`${DEFAULT_BACK_CODE_PREFIX}01A|${DEFAULT_BACK_CODE_PREFIX}01B|${DEFAULT_BACK_CODE_PREFIX}02A|${DEFAULT_BACK_CODE_PREFIX}02B`);
  });

  it('shows validation error when bay start is below 1', () => {
    render(<BackLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

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
    render(<BackLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    const select = screen.getByRole('combobox', { name: 'Last Shelf' });
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: MAX_SHELF_LETTER })).toBeInTheDocument();
  });

  it('generates codes with configured Back prefix', () => {
    render(<BackLabelForm config={{ ...defaultConfig, backCodePrefix: '99' }} onOpenConfiguration={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Last Shelf' }), { target: { value: 'B' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent('9901A|9901B');
  });

  it('opens configuration when configuration section link is clicked', () => {
    const onOpenConfiguration = vi.fn();
    render(<BackLabelForm config={defaultConfig} onOpenConfiguration={onOpenConfiguration} />);

    fireEvent.click(screen.getByRole('link', { name: 'configuration section' }));

    expect(onOpenConfiguration).toHaveBeenCalledTimes(1);
  });

  it('does not render NaN when a letter is entered into a numeric field', () => {
    render(<BackLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'a' } });

    expect(inputs[0]).toHaveValue('');
    expect(screen.queryByDisplayValue('NaN')).not.toBeInTheDocument();
  });
});
