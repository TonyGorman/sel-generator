import {
  generateAisleLabelCodes,
  generateShortLabelCodes,
  IAisleLabelInput,
  IShortLabelInput,
  validateAisleLabelInput,
  validateShortLabelInput,
} from '../domain/labelGeneration';
import { getLabelBatchLimitsResult } from './labelBatchLimits';

interface GenerationPipelineResult {
  errorMessage: string | null;
  warningMessage: string | null;
  labels: string[];
}

interface AislePipelineArgs {
  formInput: IAisleLabelInput;
  minAisleValue: number;
  maxAisleValue: number;
  maxBayValue: number;
  softLimit: number;
  hardLimit: number;
  totalLabels: number;
  formatTwoDigitValue: (value: number) => string;
}

interface ShortPipelineArgs {
  formInput: IShortLabelInput;
  minBayValue: number;
  maxBayValue: number;
  softLimit: number;
  hardLimit: number;
  totalLabels: number;
  formatTwoDigitValue: (value: number) => string;
}

export const getAisleGenerationPipelineResult = ({
  formInput,
  minAisleValue,
  maxAisleValue,
  maxBayValue,
  softLimit,
  hardLimit,
  totalLabels,
  formatTwoDigitValue,
}: AislePipelineArgs): GenerationPipelineResult => {
  const validationError = validateAisleLabelInput(formInput, {
    minAisleValue,
    maxAisleValue,
    maxBayValue,
  });
  if (validationError) {
    return {
      errorMessage: validationError,
      warningMessage: null,
      labels: [],
    };
  }

  const batchLimits = getLabelBatchLimitsResult(totalLabels, softLimit, hardLimit);
  if (batchLimits.hardLimitError) {
    return {
      errorMessage: batchLimits.hardLimitError,
      warningMessage: null,
      labels: [],
    };
  }

  return {
    errorMessage: null,
    warningMessage: batchLimits.warningMessage,
    labels: generateAisleLabelCodes(formInput, formatTwoDigitValue),
  };
};

export const getShortGenerationPipelineResult = ({
  formInput,
  minBayValue,
  maxBayValue,
  softLimit,
  hardLimit,
  totalLabels,
  formatTwoDigitValue,
}: ShortPipelineArgs): GenerationPipelineResult => {
  const validationError = validateShortLabelInput(formInput, minBayValue, maxBayValue);
  if (validationError) {
    return {
      errorMessage: validationError,
      warningMessage: null,
      labels: [],
    };
  }

  const batchLimits = getLabelBatchLimitsResult(totalLabels, softLimit, hardLimit);
  if (batchLimits.hardLimitError) {
    return {
      errorMessage: batchLimits.hardLimitError,
      warningMessage: null,
      labels: [],
    };
  }

  return {
    errorMessage: null,
    warningMessage: batchLimits.warningMessage,
    labels: generateShortLabelCodes(formInput, formatTwoDigitValue),
  };
};