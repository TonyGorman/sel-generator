import { describe, expect, it } from 'vitest';
import {
  getAisleGenerationPipelineResult,
  getShortGenerationPipelineResult,
} from './labelGenerationPipelines';

const formatTwoDigits = (value: number): string => value.toString().padStart(2, '0');

describe('labelGenerationPipelines', () => {
  it('returns aisle validation errors before generation', () => {
    const result = getAisleGenerationPipelineResult({
      formInput: {
        aisleStart: null,
        aisleEnd: null,
        sideRanges: {
          L: { start: null, end: null },
          R: { start: null, end: null },
          E: { start: null, end: null },
          F: { start: null, end: null },
        },
        shelfStart: null,
        shelfEnd: null,
      },
      minAisleValue: 0,
      maxAisleValue: 99,
      maxBayValue: 99,
      softLimit: 100,
      hardLimit: 200,
      totalLabels: 0,
      formatTwoDigitValue: formatTwoDigits,
    });

    expect(result.errorMessage).toBe('Please enter aisle start, aisle end, and select a shelf.');
    expect(result.warningMessage).toBeNull();
    expect(result.labels).toEqual([]);
  });

  it('returns short hard-limit error before generation', () => {
    const result = getShortGenerationPipelineResult({
      formInput: {
        bayStart: 1,
        bayEnd: 1,
        shelfStart: null,
        shelfEnd: 'A',
        prefix: 'BAK',
      },
      minBayValue: 1,
      maxBayValue: 99,
      softLimit: 100,
      hardLimit: 0,
      totalLabels: 1,
      formatTwoDigitValue: formatTwoDigits,
    });

    expect(result.errorMessage).toContain('Too many labels requested.');
    expect(result.warningMessage).toBeNull();
    expect(result.labels).toEqual([]);
  });

  it('returns generated labels and warning for short soft-limit batches', () => {
    const result = getShortGenerationPipelineResult({
      formInput: {
        bayStart: 1,
        bayEnd: 1,
        shelfStart: null,
        shelfEnd: 'C',
        prefix: 'BAK',
      },
      minBayValue: 1,
      maxBayValue: 99,
      softLimit: 2,
      hardLimit: 10,
      totalLabels: 3,
      formatTwoDigitValue: formatTwoDigits,
    });

    expect(result.errorMessage).toBeNull();
    expect(result.warningMessage).toContain('Large batch warning');
    expect(result.labels).toEqual(['BAK01A', 'BAK01B', 'BAK01C']);
  });
});
