import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LabelApp from './LabelApp';

vi.mock('./SpecificLabelForm', () => ({
  default: () => <div>Specific Form Mock</div>,
}));

vi.mock('./AisleLabelForm', () => ({
  default: () => <div>Aisle Mock</div>,
}));

vi.mock('./BackLabelForm', () => ({
  default: () => <div>Back Mock</div>,
}));

describe('LabelApp', () => {
  it('shows specific tab by default', () => {
    render(<LabelApp />);
    expect(screen.getByText('Specific Form Mock')).toBeInTheDocument();
  });
});