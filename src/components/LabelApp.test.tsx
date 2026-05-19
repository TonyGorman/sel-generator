import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LabelApp from './LabelApp';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/labelConfig';

vi.mock('./SpecificLabelForm', () => ({
  default: ({ config }: { config: ILabelConfig }) => (
    <div>Specific: {config.primaryCodeFormat}</div>
  ),
}));

vi.mock('./AisleLabelForm', () => ({
  default: ({ onOpenConfiguration }: { onOpenConfiguration: () => void }) => (
    <button onClick={onOpenConfiguration}>Open config from aisle</button>
  ),
}));

vi.mock('./BackLabelForm', () => ({
  default: () => <div>Back Mock</div>,
}));

vi.mock('./ConfigureLabelForm', () => ({
  default: ({ onConfigChange }: { onConfigChange: (config: ILabelConfig) => void }) => (
    <button
      onClick={() =>
        onConfigChange({
          primaryCodeFormat: 'shelfOnly',
          shelfStyle: 'number',
          secondaryCodeFormat: 'spaces',
          backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
        })
      }
    >
      Set new config
    </button>
  ),
}));

describe('LabelApp', () => {
  it('shows specific tab by default', () => {
    render(<LabelApp />);
    expect(screen.getByText('Specific: sideAndBay')).toBeInTheDocument();
  });

  it('navigates to configuration tab when aisle requests it', () => {
    render(<LabelApp />);

    fireEvent.click(screen.getByRole('tab', { name: 'Aisle Labels' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open config from aisle' }));

    expect(screen.getByRole('button', { name: 'Set new config' })).toBeInTheDocument();
  });

  it('propagates updated config to specific tab content', () => {
    render(<LabelApp />);

    fireEvent.click(screen.getByRole('tab', { name: 'Configuration' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set new config' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Specific Labels' }));

    expect(screen.getByText('Specific: shelfOnly')).toBeInTheDocument();
  });
});