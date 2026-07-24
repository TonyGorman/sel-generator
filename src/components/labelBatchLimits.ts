import { getLabelHardLimitMessage, getLabelSoftLimitMessage } from '../config/validationMessages';

interface LabelBatchLimitsResult {
  hardLimitError: string | null;
  warningMessage: string | null;
}

export const getLabelBatchLimitsResult = (
  labelCount: number,
  softLimit: number,
  hardLimit: number,
): LabelBatchLimitsResult => {
  if (labelCount > hardLimit) {
    return {
      hardLimitError: getLabelHardLimitMessage(hardLimit),
      warningMessage: null,
    };
  }

  return {
    hardLimitError: null,
    warningMessage: labelCount > softLimit ? getLabelSoftLimitMessage(softLimit) : null,
  };
};