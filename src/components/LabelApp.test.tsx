import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LabelApp from './LabelApp';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/labelConfig';

vi.mock('./SpecificLabelForm', () => ({
  default: ({ config }: { config: ILabelConfig }) => (
    <div>Specific Back prefix: {config.backCodePrefix}</div>
  ),
}));

vi.mock('./AisleLabelForm', () => ({
  default: () => <div>Aisle Mock</div>,
}));

vi.mock('./BackLabelForm', () => ({
  default: () => <div>Back Mock</div>,
}));

vi.mock('./ConfigureLabelForm', () => ({
  default: ({ onConfigChange }: { onConfigChange: (config: ILabelConfig) => void }) => (
    <button
      onClick={() =>
        onConfigChange({
          backCodePrefix: '99',
          specialAisleValues: ['KIOSK'],
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
    expect(screen.getByText(`Specific Back prefix: ${DEFAULT_BACK_CODE_PREFIX}`)).toBeInTheDocument();
  });

  it('propagates updated config to specific tab content', () => {
    render(<LabelApp />);

    fireEvent.click(screen.getByRole('tab', { name: 'Configuration' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set new config' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Specific Labels' }));

    expect(screen.getByText('Specific Back prefix: 99')).toBeInTheDocument();
  });
});