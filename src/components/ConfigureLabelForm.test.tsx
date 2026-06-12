import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ConfigureLabelForm from './ConfigureLabelForm';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX, MAX_SHELF_LETTER } from '../config/labelConfig';

vi.mock('./LabelTile', () => ({
  default: ({ code }: { code: string }) => <div data-testid="preview-code">{code}</div>,
}));

const defaultConfig: ILabelConfig = {
  backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
  specialAisleValues: ['KIOSK', 'FLORAL', 'BACKWALL'],
};

describe('ConfigureLabelForm', () => {
  it('shows alpha shelf preview code', () => {
    render(<ConfigureLabelForm config={defaultConfig} onConfigChange={vi.fn()} />);

    expect(screen.getByTestId('preview-code')).toHaveTextContent(`01R02${MAX_SHELF_LETTER}`);
  });

  it('emits sanitized Back code prefix updates', () => {
    const onConfigChange = vi.fn();
    render(<ConfigureLabelForm config={defaultConfig} onConfigChange={onConfigChange} />);

    fireEvent.change(screen.getByLabelText('Prefix (letters or numbers)'), {
      target: { value: '99' },
    });

    expect(onConfigChange).toHaveBeenCalledWith({
      ...defaultConfig,
      backCodePrefix: '99',
    });
  });

  it('commits special aisle values from a comma-delimited field on blur', () => {
    const onConfigChange = vi.fn();
    render(<ConfigureLabelForm config={defaultConfig} onConfigChange={onConfigChange} />);

    const input = screen.getByLabelText('Comma-separated names (letters only, max 8 chars each)');
    expect(input.tagName).toBe('TEXTAREA');
    fireEvent.change(input, { target: { value: 'kiosk, floral123, producezone' } });
    fireEvent.blur(input);

    expect(onConfigChange).toHaveBeenCalledWith({
      ...defaultConfig,
      specialAisleValues: ['KIOSK', 'FLORAL', 'PRODUCEZ'],
    });
  });
});