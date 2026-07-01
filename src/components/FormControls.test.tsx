import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button, RadioGroup, ShelfSelect, TextField } from './FormControls';
import { MAX_SHELF_LETTER } from '../config/labelConfig';

describe('FormControls', () => {
  it('renders Button with default type button', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: 'Click me' })).toHaveAttribute('type', 'button');
  });

  it('forwards refs in TextField', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<TextField ref={ref} placeholder="Input" />);

    expect(ref.current).toBe(screen.getByPlaceholderText('Input'));
  });

  it('supports function refs for single-line and multiline TextField', () => {
    const inputRefSpy = vi.fn();
    const textareaRefSpy = vi.fn();

    const { rerender } = render(<TextField ref={inputRefSpy} placeholder="Function ref input" />);
    expect(inputRefSpy).toHaveBeenCalledWith(screen.getByPlaceholderText('Function ref input'));

    rerender(<TextField ref={textareaRefSpy} multiline placeholder="Function ref textarea" />);
    expect(textareaRefSpy).toHaveBeenCalledWith(screen.getByPlaceholderText('Function ref textarea'));
  });

  it('auto-grows multiline TextField and preserves external onInput handlers', () => {
    const onInput = vi.fn();
    render(<TextField multiline autoGrow onInput={onInput} placeholder="Multiline" />);

    const textarea = screen.getByPlaceholderText('Multiline') as HTMLTextAreaElement;
    Object.defineProperty(textarea, 'scrollHeight', { configurable: true, value: 72 });

    fireEvent.input(textarea);

    expect(onInput).toHaveBeenCalledTimes(1);
    expect(textarea.style.height).toBe('72px');
  });

  it('renders radio options and calls onChange with selected key', () => {
    const onChange = vi.fn();
    render(
      <RadioGroup
        name="test-group"
        options={[
          { key: 'one', text: 'Option one' },
          { key: 'two', text: 'Option two' },
        ]}
        selectedKey="one"
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText('Option one')).toBeChecked();
    expect(screen.getByLabelText('Option two')).not.toBeChecked();

    fireEvent.click(screen.getByLabelText('Option two'));
    expect(onChange).toHaveBeenCalledWith('two');
  });
});

describe('ShelfSelect', () => {
  it('renders a placeholder option and all shelf letters up to MAX_SHELF_LETTER', () => {
    const onChange = vi.fn();
    render(<ShelfSelect value="" onChange={onChange} />);

    const select = screen.getByRole('combobox');
    const options = Array.from(select.querySelectorAll('option'));
    const optionValues = options.map((o) => o.value);

    expect(optionValues[0]).toBe('');

    const maxCode = MAX_SHELF_LETTER.charCodeAt(0);
    const expectedLetters = Array.from({ length: maxCode - 'A'.charCodeAt(0) + 1 }, (_, i) =>
      String.fromCharCode('A'.charCodeAt(0) + i),
    );
    expect(optionValues.slice(1)).toEqual(expectedLetters);
  });

  it('reflects the selected value', () => {
    const onChange = vi.fn();
    render(<ShelfSelect value="C" onChange={onChange} />);

    expect(screen.getByRole('combobox')).toHaveValue('C');
  });

  it('calls onChange with the selected letter when an option is chosen', () => {
    const onChange = vi.fn();
    render(<ShelfSelect value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'E' } });
    expect(onChange).toHaveBeenCalledWith('E');
  });

  it('accepts an id prop for label association', () => {
    const onChange = vi.fn();
    render(<ShelfSelect id="shelf-input" value="A" onChange={onChange} />);

    expect(screen.getByRole('combobox')).toHaveAttribute('id', 'shelf-input');
  });
});