import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FormSection from './FormSection';

describe('FormSection', () => {
  it('renders a section heading and content', () => {
    render(
      <FormSection title="Sample Title">
        <p>Sample content</p>
      </FormSection>,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Sample Title' })).toBeInTheDocument();
    expect(screen.getByText('Sample content')).toBeInTheDocument();
  });
});
