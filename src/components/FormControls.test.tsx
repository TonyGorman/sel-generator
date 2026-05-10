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