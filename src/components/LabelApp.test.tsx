import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LabelApp from './LabelApp';
import { createLocalStorageShim } from '../test/localStorageShim';

const storageShim = createLocalStorageShim();

vi.mock('./SpecificLabelForm', () => ({
  default: () => <div>Specific Form Mock</div>,
}));

vi.mock('./AisleLabelForm', () => ({
  default: () => <div>Aisle Mock</div>,
}));

vi.mock('./BackLabelForm', () => ({
  default: () => <div>Back Mock</div>,
}));

afterEach(() => {
  storageShim.reset();
  cleanup();
  window.history.replaceState({}, '', '/');
});

storageShim.install();

describe('LabelApp', () => {
  it('shows specific tab by default', () => {
    render(<LabelApp />);

    const specificPanel = document.getElementById('panel-specific');
    const aislePanel = document.getElementById('panel-aisle');
    const bakPanel = document.getElementById('panel-bak');

    expect(screen.getByText('Specific Form Mock')).toBeInTheDocument();
    expect(specificPanel).not.toHaveAttribute('hidden');
    expect(aislePanel).toHaveAttribute('hidden');
    expect(bakPanel).toHaveAttribute('hidden');
  });

  it('switches to aisle tab when Aisle Labels tab is clicked', () => {
    render(<LabelApp />);

    fireEvent.click(screen.getByRole('tab', { name: 'Aisle Labels' }));

    const specificPanel = document.getElementById('panel-specific');
    const aislePanel = document.getElementById('panel-aisle');

    expect(screen.getByText('Aisle Mock')).toBeInTheDocument();
    expect(screen.getByText('Specific Form Mock')).toBeInTheDocument();
    expect(specificPanel).toHaveAttribute('hidden');
    expect(aislePanel).not.toHaveAttribute('hidden');
  });

  it('switches to back/FOS tab when FOS/Bak Labels tab is clicked', () => {
    render(<LabelApp />);

    fireEvent.click(screen.getByRole('tab', { name: 'FOS/Bak Labels' }));

    const specificPanel = document.getElementById('panel-specific');
    const bakPanel = document.getElementById('panel-bak');

    expect(screen.getByText('Back Mock')).toBeInTheDocument();
    expect(screen.getByText('Specific Form Mock')).toBeInTheDocument();
    expect(specificPanel).toHaveAttribute('hidden');
    expect(bakPanel).not.toHaveAttribute('hidden');
  });

  it('switches back to specific tab after visiting another tab', () => {
    render(<LabelApp />);

    fireEvent.click(screen.getByRole('tab', { name: 'Aisle Labels' }));
    expect(screen.getByText('Aisle Mock')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Specific Labels' }));
    expect(screen.getByText('Specific Form Mock')).toBeInTheDocument();
  });

  it('shows mini variant selector with three-row default', () => {
    render(<LabelApp />);

    expect(screen.getByLabelText('Mini Variant')).toHaveValue('mini-three-row');
  });

  it('persists mini variant selection to localStorage when changed', () => {
    render(<LabelApp />);

    fireEvent.change(screen.getByLabelText('Mini Variant'), {
      target: { value: 'mini-shelf-emphasis' },
    });

    expect(window.localStorage.getItem('miniVariant')).toBe('mini-shelf-emphasis');
  });

  it('loads previously saved mini variant from localStorage', () => {
    window.localStorage.setItem('miniVariant', 'mini-three-row');
    window.localStorage.setItem('miniVariant', 'mini-shelf-emphasis');

    render(<LabelApp />);

    expect(screen.getByLabelText('Mini Variant')).toHaveValue('mini-shelf-emphasis');
    expect(screen.getByLabelText('Mini Variant')).not.toBeDisabled();
    expect(window.localStorage.getItem('miniVariant')).toBe('mini-shelf-emphasis');
  });
});