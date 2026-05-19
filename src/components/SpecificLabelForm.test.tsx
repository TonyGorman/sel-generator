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
  primaryCodeFormat: 'sideAndBay',
  shelfStyle: 'alphabetical',
  secondaryCodeFormat: 'dashes',
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
      target: { value: '00L01A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('normalizes valid values and coerces shelves to configured format', () => {
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: ` 01l01a , ${DEFAULT_BACK_CODE_PREFIX.toLowerCase()}-01-2 ` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent(`01L01A|${DEFAULT_BACK_CODE_PREFIX}-01-B`);
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

  it('accepts configured back wall prefix values', () => {
    render(<SpecificLabelForm config={{ ...defaultConfig, backCodePrefix: '99' }} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '99-01-A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent('99-01-A');
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

  it('coerces numeric shelf input to alphabetical shelf when configured', () => {
    render(<SpecificLabelForm config={{ ...defaultConfig, shelfStyle: 'alphabetical' }} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01-L22-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent('01-L22-A');
  });

  it('coerces alphabetical shelf input to numeric shelf when configured', () => {
    render(<SpecificLabelForm config={{ ...defaultConfig, shelfStyle: 'number' }} onOpenConfiguration={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01-L22-A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent('01-L22-1');
  });

  it('opens configuration when configuration section link is clicked', () => {
    const onOpenConfiguration = vi.fn();
    render(<SpecificLabelForm config={defaultConfig} onOpenConfiguration={onOpenConfiguration} />);

    fireEvent.click(screen.getByRole('link', { name: 'configuration section' }));

    expect(onOpenConfiguration).toHaveBeenCalledTimes(1);
  });
});