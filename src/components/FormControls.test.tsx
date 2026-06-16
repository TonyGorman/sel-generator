import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button, RadioGroup, TextField } from './FormControls';

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