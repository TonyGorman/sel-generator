import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FormFeedback from './FormFeedback';

describe('FormFeedback', () => {
  it('renders no feedback when both messages are null', () => {
    render(<FormFeedback errorMessage={null} warningMessage={null} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders assertive alert when an error message exists', () => {
    render(<FormFeedback errorMessage="Validation failed" warningMessage={null} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Validation failed');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAttribute('aria-atomic', 'true');
  });

  it('renders polite status when a warning message exists', () => {
    render(<FormFeedback errorMessage={null} warningMessage="Large batch warning" />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Large batch warning');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
  });
});
