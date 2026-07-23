import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import AisleLabelForm from './AisleLabelForm';
import BackLabelForm from './BackLabelForm';
import LabelApp from './LabelApp';
import SpecificLabelForm from './SpecificLabelForm';

const expectNoAxeViolations = async (container: HTMLElement): Promise<void> => {
  const results = await axe(container);
  expect(results.violations).toEqual([]);
};

describe('Accessibility checks', () => {
  it('has no axe violations in LabelApp default view', async () => {
    const { container } = render(<LabelApp />);

    await expectNoAxeViolations(container);
  });

  it('has no axe violations in SpecificLabelForm', async () => {
    const { container } = render(
      <SpecificLabelForm />,
    );

    await expectNoAxeViolations(container);
  });

  it('has no axe violations in SpecificLabelForm error state', async () => {
    const { container } = render(
      <SpecificLabelForm />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await expectNoAxeViolations(container);
  });

  it('has no axe violations in SpecificLabelForm generated state', async () => {
    const { container } = render(
      <SpecificLabelForm />,
    );

    fireEvent.change(screen.getByPlaceholderText('Enter labels'), { target: { value: '01L01A' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));
    expect(screen.getByRole('button', { name: 'Print Labels' })).toBeInTheDocument();

    await expectNoAxeViolations(container);
  });

  it('has no axe violations in AisleLabelForm', async () => {
    const { container } = render(
      <AisleLabelForm />,
    );

    await expectNoAxeViolations(container);
  });

  it('has no axe violations in AisleLabelForm generated state', async () => {
    const { container } = render(
      <AisleLabelForm />,
    );

    const numericFields = screen.getAllByRole('textbox');
    fireEvent.change(numericFields[0], { target: { value: '1' } });
    fireEvent.change(numericFields[1], { target: { value: '1' } });
    fireEvent.change(numericFields[2], { target: { value: '1' } });
    fireEvent.change(numericFields[3], { target: { value: '1' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'End Shelf' }), { target: { value: 'A' } });

    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));
    expect(screen.getByRole('button', { name: 'Print Labels' })).toBeInTheDocument();

    await expectNoAxeViolations(container);
  });

  it('has no axe violations in BackLabelForm', async () => {
    const { container } = render(
      <BackLabelForm />,
    );

    await expectNoAxeViolations(container);
  });

  it('has no axe violations in BackLabelForm generated state', async () => {
    const { container } = render(
      <BackLabelForm />,
    );

    const numericFields = screen.getAllByRole('textbox');
    fireEvent.change(numericFields[0], { target: { value: '1' } });
    fireEvent.change(numericFields[1], { target: { value: '1' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'End Shelf' }), { target: { value: 'A' } });

    fireEvent.click(screen.getByRole('button', { name: 'Generate Labels' }));
    expect(screen.getByRole('button', { name: 'Print Labels' })).toBeInTheDocument();

    await expectNoAxeViolations(container);
  });

});
