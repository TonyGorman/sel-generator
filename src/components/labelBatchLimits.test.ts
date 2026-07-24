import { describe, expect, it } from 'vitest';
import { getLabelBatchLimitsResult } from './labelBatchLimits';

describe('getLabelBatchLimitsResult', () => {
  it('returns no warning or error when count is within limits', () => {
    expect(getLabelBatchLimitsResult(10, 100, 200)).toEqual({
      hardLimitError: null,
      warningMessage: null,
    });
  });

  it('returns warning when count exceeds soft limit but not hard limit', () => {
    const result = getLabelBatchLimitsResult(101, 100, 200);

    expect(result.hardLimitError).toBeNull();
    expect(result.warningMessage).toContain('Large batch warning');
    expect(result.warningMessage).toContain('100 labels');
  });

  it('returns hard limit error and no warning when count exceeds hard limit', () => {
    const result = getLabelBatchLimitsResult(201, 100, 200);

    expect(result.hardLimitError).toContain('Too many labels requested');
    expect(result.hardLimitError).toContain('200 or fewer');
    expect(result.warningMessage).toBeNull();
  });
});
