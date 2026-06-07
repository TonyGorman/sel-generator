import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import AisleLabelForm from './AisleLabelForm';
import BackLabelForm from './BackLabelForm';
import ConfigureLabelForm from './ConfigureLabelForm';
import LabelApp from './LabelApp';
import SpecificLabelForm from './SpecificLabelForm';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/labelConfig';

const defaultConfig: ILabelConfig = {
  shelfStyle: 'alphabetical',
  secondaryCodeFormat: 'dashes',
  backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
};

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
      <SpecificLabelForm config={defaultConfig} onOpenConfiguration={() => undefined} />,
    );

    await expectNoAxeViolations(container);
  });

  it('has no axe violations in AisleLabelForm', async () => {
    const { container } = render(
      <AisleLabelForm config={defaultConfig} onOpenConfiguration={() => undefined} />,
    );

    await expectNoAxeViolations(container);
  });

  it('has no axe violations in BackLabelForm', async () => {
    const { container } = render(
      <BackLabelForm config={defaultConfig} onOpenConfiguration={() => undefined} />,
    );

    await expectNoAxeViolations(container);
  });

  it('has no axe violations in ConfigureLabelForm', async () => {
    const { container } = render(
      <ConfigureLabelForm config={defaultConfig} onConfigChange={() => undefined} />,
    );

    await expectNoAxeViolations(container);
  });
});
