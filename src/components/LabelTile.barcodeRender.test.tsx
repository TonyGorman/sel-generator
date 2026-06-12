import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LabelTile from './LabelTile';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/labelConfig';

const defaultConfig: ILabelConfig = {
  shelfStyle: 'alphabetical',
  backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
};

const getBarcodeSignature = (container: HTMLElement): string => {
  const svg = container.querySelector('svg');
  expect(svg).not.toBeNull();

  const rects = Array.from(svg!.querySelectorAll('rect'));
  expect(rects.length).toBeGreaterThan(0);

  const rectSignature = rects
    .map((rect) => `${rect.getAttribute('x')}:${rect.getAttribute('width')}`)
    .join('|');

  return `${svg!.getAttribute('viewBox')}::${rectSignature}`;
};

describe('LabelTile barcode visual encoding', () => {
  it('keeps barcode rendering deterministic while distinguishing different encoded inputs', () => {
    const first = render(<LabelTile code="01L01A" config={defaultConfig} />);
    const firstSignature = getBarcodeSignature(first.container);

    const second = render(<LabelTile code="01L01A" config={defaultConfig} />);
    const secondSignature = getBarcodeSignature(second.container);

    const different = render(<LabelTile code="01L01B" config={defaultConfig} />);
    const differentSignature = getBarcodeSignature(different.container);

    expect(firstSignature).toBe(secondSignature);
    expect(firstSignature).not.toBe(differentSignature);
  });
});
