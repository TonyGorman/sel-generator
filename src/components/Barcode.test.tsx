import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Barcode from './Barcode';
import { IBarcodeConfig } from '../models/IBarcodeConfig';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/barcodeConfig';

vi.mock('./SpecificBarcode', () => ({
  default: ({ config }: { config: IBarcodeConfig }) => (
    <div>Specific: {config.primaryCodeFormat}</div>
  ),
}));

vi.mock('./AisleBarcode', () => ({
  default: ({ onOpenConfiguration }: { onOpenConfiguration: () => void }) => (
    <button onClick={onOpenConfiguration}>Open config from aisle</button>
  ),
}));

vi.mock('./BackBarcode', () => ({
  default: () => <div>Back Mock</div>,
}));

vi.mock('./Configuration', () => ({
  default: ({ onConfigChange }: { onConfigChange: (config: IBarcodeConfig) => void }) => (
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

describe('Barcode', () => {
  it('shows specific tab by default', () => {
    render(<Barcode />);
    expect(screen.getByText('Specific: sideBay')).toBeInTheDocument();
  });

  it('navigates to configuration tab when aisle requests it', () => {
    render(<Barcode />);

    fireEvent.click(screen.getByRole('tab', { name: 'Aisle barcode' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open config from aisle' }));

    expect(screen.getByRole('button', { name: 'Set new config' })).toBeInTheDocument();
  });

  it('propagates updated config to specific tab content', () => {
    render(<Barcode />);

    fireEvent.click(screen.getByRole('tab', { name: 'Configuration' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set new config' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Specific barcode' }));

    expect(screen.getByText('Specific: shelfOnly')).toBeInTheDocument();
  });
});