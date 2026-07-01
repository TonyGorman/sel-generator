import { fireEvent, render, screen } from '@testing-library/react';
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

  it('switches to aisle tab when Aisle Labels tab is clicked', () => {
    render(<LabelApp />);

    fireEvent.click(screen.getByRole('tab', { name: 'Aisle Labels' }));

    expect(screen.getByText('Aisle Mock')).toBeInTheDocument();
    expect(screen.queryByText('Specific Form Mock')).not.toBeInTheDocument();
  });

  it('switches to back/FOS tab when FOS/Bak Labels tab is clicked', () => {
    render(<LabelApp />);

    fireEvent.click(screen.getByRole('tab', { name: 'FOS/Bak Labels' }));

    expect(screen.getByText('Back Mock')).toBeInTheDocument();
    expect(screen.queryByText('Specific Form Mock')).not.toBeInTheDocument();
  });

  it('switches back to specific tab after visiting another tab', () => {
    render(<LabelApp />);

    fireEvent.click(screen.getByRole('tab', { name: 'Aisle Labels' }));
    expect(screen.getByText('Aisle Mock')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Specific Labels' }));
    expect(screen.getByText('Specific Form Mock')).toBeInTheDocument();
  });
});