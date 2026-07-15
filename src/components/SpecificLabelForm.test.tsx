import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SpecificLabelForm from './SpecificLabelForm';
import { AISLE_PREFIXES, SHORT_CODE_PREFIXES } from '../config/labelConfig';

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

  it('accepts configured prefixed aisle values in compact form', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: `${AISLE_PREFIXES[0]}10L01A,${AISLE_PREFIXES[1]}2L02B` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveTextContent(`${AISLE_PREFIXES[0]}10L01A|${AISLE_PREFIXES[1]}2L02B`);
  });

  it('rejects unsupported prefixed aisle values', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: 'PR1L01A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Use valid label codes only.');
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

  it('accepts compact short code values and renders generated list', () => {
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

  it('defaults to mini-sel mode', () => {
    render(<SpecificLabelForm />);

    expect(screen.getByRole('radio', { name: 'Mini SEL' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Large SEL' })).not.toBeChecked();
  });

  it('renders specific labels using mini-sel mode by default', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01L01A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByTestId('generated-labels')).toHaveAttribute('data-layout-mode', 'mini-sel');
  });

  it('renders large-sel labels when Large SEL mode is selected', () => {
    render(<SpecificLabelForm />);

    fireEvent.click(screen.getByRole('radio', { name: 'Large SEL' }));
    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01L01A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveAttribute('data-layout-mode', 'large-sel');
  });

  it('allows shortcode values (e.g. BAK01A) on large-sel mode', () => {
    render(<SpecificLabelForm />);

    fireEvent.click(screen.getByRole('radio', { name: 'Large SEL' }));
    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: `${SHORT_CODE_PREFIXES[0]}01A` },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('generated-labels')).toHaveAttribute('data-layout-mode', 'large-sel');
  });

  it('blocks special codes (e.g. KIOSK) when large-sel mode is selected', () => {
    render(<SpecificLabelForm />);

    fireEvent.click(screen.getByRole('radio', { name: 'Large SEL' }));
    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: 'KIOSK' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Special label values');
    expect(screen.queryByTestId('generated-labels')).not.toBeInTheDocument();
  });

  it('blocks a mix of valid and special codes on large-sel mode', () => {
    render(<SpecificLabelForm />);

    fireEvent.click(screen.getByRole('radio', { name: 'Large SEL' }));
    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01L01A,FLORAL' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Special label values');
    expect(screen.queryByTestId('generated-labels')).not.toBeInTheDocument();
  });

  it('blocks generation when specific labels exceed hard limit', () => {
    render(<SpecificLabelForm />);

    const labels = Array.from({ length: 2001 }, (_, index) => `01L${String((index % 99) + 1).padStart(2, '0')}A`).join(',');
    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: labels },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Too many labels requested.');
    expect(screen.queryByTestId('generated-labels')).not.toBeInTheDocument();
  });

  it('clears generated output when mini variant changes', () => {
    const { rerender } = render(<SpecificLabelForm miniVariantId="mini-three-row" />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01L01A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByTestId('generated-labels')).toBeInTheDocument();

    rerender(<SpecificLabelForm miniVariantId="mini-shelf-emphasis" />);

    expect(screen.queryByTestId('generated-labels')).not.toBeInTheDocument();
  });

  it('clears generated output when label size mode changes', () => {
    render(<SpecificLabelForm />);

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: '01L01A' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));

    expect(screen.getByTestId('generated-labels')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Large SEL' }));

    expect(screen.queryByTestId('generated-labels')).not.toBeInTheDocument();
  });

  it('does not show stale mini output for special values after switching to large mode', () => {
    render(<SpecificLabelForm />);

    // Generate KIOSK in mini mode (valid)
    fireEvent.change(screen.getByPlaceholderText('Enter labels'), {
      target: { value: 'KIOSK' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));
    expect(screen.getByTestId('generated-labels')).toBeInTheDocument();

    // Switch to large mode — output must be cleared immediately
    fireEvent.click(screen.getByRole('radio', { name: 'Large SEL' }));
    expect(screen.queryByTestId('generated-labels')).not.toBeInTheDocument();
  });

});