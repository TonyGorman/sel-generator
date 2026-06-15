import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SpecificLabelForm from './SpecificLabelForm';
import {SHORT_CODE_PREFIXES} from '../config/labelConfig';

vi.mock('./LabelGenerator', () => ({
  default: ({ labelCodes, layoutMode }: { labelCodes: string[]; layoutMode?: string }) => (
    <div data-testid="generated-labels" data-layout-mode={layoutMode}>{labelCodes.join('|')}</div>
  ),
}));

describe('SpecificLabelForm', () => {
  it('shows error when submitted without input', () => {
    render(<SpecificLabelForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter at least one label value.');
  });

  it('shows error for invalid label values', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: 'ZZZ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('accepts aisle 00 values in compact form', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '00L01A,00L02A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent('00L01A|00L02A');
  });

  it('accepts named aisle values without bay or shelf', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: 'KIOSK,FLORAL' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent('KIOSK|FLORAL');
  });

  it('rejects non-allowlisted named aisle values without bay or shelf', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: 'PRODUCE' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('normalizes valid compact values to uppercase and trims whitespace', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: ` 01l01a , ${SHORT_CODE_PREFIXES[0].toLowerCase()}01a ` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent(`01L01A|${SHORT_CODE_PREFIXES[0]}01A`);
  });

  it('rejects separated input (dashes not allowed)', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01-L01-A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('rejects spaced input (spaces not allowed)', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01 L01 A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('rejects separated short code input (dashes not allowed)', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: `${SHORT_CODE_PREFIXES[0]} 01 A` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('accepts compact back wall values and renders generated list', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: `${SHORT_CODE_PREFIXES[0]}01A` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent(`${SHORT_CODE_PREFIXES[0]}01A`);
  });

  it('rejects values with invalid shelf tokens', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01L01AA' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('accepts Front Of Store compact values in compact form', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: `${SHORT_CODE_PREFIXES[1]}01A` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent(`${SHORT_CODE_PREFIXES[1]}01A`);
  });

  it('rejects separated front-of-store values', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: `${SHORT_CODE_PREFIXES[1]}-01-A` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
  });

  it('accepts both Back and Front wall values in the same submission', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: `${SHORT_CODE_PREFIXES[0]}01A,${SHORT_CODE_PREFIXES[1]}01A` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent(`${SHORT_CODE_PREFIXES[0]}01A|${SHORT_CODE_PREFIXES[1]}01A`);
  });

  it('always renders specific labels using mini-sel mode', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01L01A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByTestId('generated-labels')).toHaveAttribute('data-layout-mode', 'mini-sel');
  });

});