import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GenerateLabelsButton from './GenerateLabelsButton';

describe('GenerateLabelsButton', () => {
  it('renders the generate label text and icon', () => {
    render(<GenerateLabelsButton onClick={() => {}} />);

    expect(screen.getByRole('button', { name: 'Generate Labels' })).toBeInTheDocument();
    expect(screen.getByText('Generate Labels')).toBeInTheDocument();
    expect(screen.getByText('⚡')).toHaveAttribute('aria-hidden', 'true');
  });

  it('invokes onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<GenerateLabelsButton onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
