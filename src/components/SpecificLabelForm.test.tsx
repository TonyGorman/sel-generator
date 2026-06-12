import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SpecificLabelForm from './SpecificLabelForm';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/labelConfig';

vi.mock('./LabelGenerator', () => ({
  default: ({ aisles, layoutMode }: { aisles: string[]; layoutMode?: string }) => (
    <div data-testid="generated-labels" data-layout-mode={layoutMode}>{aisles.join('|')}</div>
  ),
}));

const defaultConfig: ILabelConfig = {
  backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
};

describe('SpecificLabelForm', () => {
  it('shows error when submitted without input', () => {
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter at least one label value.');
  });

  it('shows error for invalid label values', () => {
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: 'ZZZ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('accepts aisle 00 values in compact form', () => {
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '00L01A,00L02A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent('00L01A|00L02A');
  });

  it('accepts named aisle values without bay or shelf', () => {
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: 'KIOSK,FLORAL' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent('KIOSK|FLORAL');
  });

  it('rejects non-allowlisted named aisle values without bay or shelf', () => {
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: 'PRODUCE' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('normalizes valid compact values to uppercase and trims whitespace', () => {
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: ` 01l01a , ${DEFAULT_BACK_CODE_PREFIX.toLowerCase()}01a ` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent(`01L01A|${DEFAULT_BACK_CODE_PREFIX}01A`);
  });

  it('rejects separated input (dashes not allowed)', () => {
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01-L01-A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('rejects spaced input (spaces not allowed)', () => {
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01 L01 A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('rejects separated back wall input (dashes not allowed)', () => {
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: `${DEFAULT_BACK_CODE_PREFIX} 01 A` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('accepts compact back wall values and renders generated list', () => {
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: `${DEFAULT_BACK_CODE_PREFIX}01A` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent(`${DEFAULT_BACK_CODE_PREFIX}01A`);
  });

  it('rejects values with invalid shelf tokens', () => {
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01L01AA' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('accepts configured back wall prefix values in compact form', () => {
    render(<SpecificLabelForm config={{ ...defaultConfig, backCodePrefix: '99' }} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '9901A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent('9901A');
  });

  it('rejects separated back wall values even when prefix matches', () => {
    render(<SpecificLabelForm config={{ ...defaultConfig, backCodePrefix: '99' }} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '99-01-A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('rejects back wall values when Back prefix is configured differently', () => {
    render(<SpecificLabelForm config={{ ...defaultConfig, backCodePrefix: '99' }} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: `${DEFAULT_BACK_CODE_PREFIX}01A` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('always renders specific labels using mini-sel mode', () => {
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01L01A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByTestId('generated-labels')).toHaveAttribute('data-layout-mode', 'mini-sel');
  });

  it('opens configuration when configuration section link is clicked', () => {
    const onOpenConfiguration = vi.fn();
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={onOpenConfiguration} />);

    fireEvent.click(screen.getByRole('link', { name: 'configuration section' }));

    expect(onOpenConfiguration).toHaveBeenCalledTimes(1);
  });

});