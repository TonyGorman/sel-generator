import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LabelTile from './LabelTile';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/labelConfig';

const defaultConfig: ILabelConfig = {
  shelfStyle: 'alphabetical',
  secondaryCodeFormat: 'dashes',
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
  it('renders identical barcode bars for compact, dashed, and spaced aisle values', () => {
    const compact = render(<LabelTile code="01L01A" config={defaultConfig} type="Specific" />);
    const compactSignature = getBarcodeSignature(compact.container);

    const dashed = render(<LabelTile code="01-L01-A" config={defaultConfig} type="Specific" />);
    const dashedSignature = getBarcodeSignature(dashed.container);

    const spaced = render(<LabelTile code="01 L01 A" config={defaultConfig} type="Specific" />);
    const spacedSignature = getBarcodeSignature(spaced.container);

    expect(dashedSignature).toBe(compactSignature);
    expect(spacedSignature).toBe(compactSignature);
  });

  it('renders identical barcode bars for compact and dashed back-wall values', () => {
    const compact = render(<LabelTile code={`${DEFAULT_BACK_CODE_PREFIX}01A`} config={defaultConfig} type="Specific" />);
    const compactSignature = getBarcodeSignature(compact.container);

    const dashed = render(<LabelTile code={`${DEFAULT_BACK_CODE_PREFIX}-01-A`} config={defaultConfig} type="Specific" />);
    const dashedSignature = getBarcodeSignature(dashed.container);

    expect(dashedSignature).toBe(compactSignature);
  });

  it('renders a different barcode pattern for different encoded values', () => {
    const first = render(<LabelTile code="01L01A" config={defaultConfig} type="Specific" />);
    const firstSignature = getBarcodeSignature(first.container);

    const second = render(<LabelTile code="01L01B" config={defaultConfig} type="Specific" />);
    const secondSignature = getBarcodeSignature(second.container);

    expect(firstSignature).not.toBe(secondSignature);
  });
});
