import * as React from 'react';
import {
  AISLE_PREFIXES,
  SHORT_CODE_PREFIXES,
  MIN_AISLE_VALUE,
  MAX_AISLE_VALUE,
  MAX_BAY_VALUE,
  MAX_SHELF_LETTER,
  SPECIAL_AISLE_VALUES,
} from '../config/labelConfig';
import { validateSpecificLabelCode } from '../domain/labelCodeDomain';
import { LabelPrintMode } from '../models/ILabelLayoutStrategy';
import { useLabelPrintMode } from './useLabelPrintMode';
import { useLabelGenerationFeedback } from './useLabelGenerationFeedback';
import { getSpecificLabelValidationResult } from '../components/specificLabelGeneration';

interface UseSpecificLabelFormResult {
  content: {
    bayRangeText: string;
    shelfRangeText: string;
    namedAisleExamples: string;
    aislePrefixedExamples: string;
  };
  state: {
    labelText: string;
    generatedLabels: string[] | null;
    errorMessage: string | null;
    warningMessage: string | null;
    labelPrintMode: LabelPrintMode;
    printModeOptions: ReturnType<typeof useLabelPrintMode>['printModeOptions'];
  };
  actions: {
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleModeChange: (key: LabelPrintMode) => void;
    generateLabel: () => void;
    resetGeneratedLabels: () => void;
  };
}

export const useSpecificLabelForm = (): UseSpecificLabelFormResult => {
  const bayRangeText = `01-${MAX_BAY_VALUE.toString().padStart(2, '0')}`;
  const shelfRangeText = `A-${MAX_SHELF_LETTER}`;
  const namedAisleExamples = SPECIAL_AISLE_VALUES.join(', ');
  const aislePrefixedExamples = [`${AISLE_PREFIXES[0]}1L01A`, `${AISLE_PREFIXES[1]}2L02B`].join(', ');

  const [labelText, setLabelText] = React.useState('');
  const {
    state: {
      generatedLabels,
      errorMessage,
      warningMessage,
    },
    actions: {
      resetGeneratedLabels,
      setFailure,
      setSuccess,
    },
  } = useLabelGenerationFeedback();
  const { labelPrintMode, printModeOptions, handleModeChange } = useLabelPrintMode(resetGeneratedLabels);

  const onInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setLabelText(e.target.value);
  }, []);

  const isValidSpecificCode = React.useCallback((code: string): boolean => {
    const result = validateSpecificLabelCode(code, {
      aislePrefixes: AISLE_PREFIXES,
      shortCodePrefixes: SHORT_CODE_PREFIXES,
      minAisleValue: MIN_AISLE_VALUE,
      maxAisleValue: MAX_AISLE_VALUE,
      maxBayValue: MAX_BAY_VALUE,
      maxShelfLetter: MAX_SHELF_LETTER,
    });

    return result.ok;
  }, []);

  const generateLabel = React.useCallback((): void => {
    const validationResult = getSpecificLabelValidationResult({
      labelText,
      labelPrintMode,
      isValidSpecificCode,
      contentTokens: {
        bayRangeText,
        shelfRangeText,
        namedAisleExamples,
        aislePrefixedExamples,
      },
    });

    if (validationResult.errorMessage) {
      setFailure(validationResult.errorMessage);
      return;
    }

    setSuccess(validationResult.labels, validationResult.warningMessage);
  }, [
    aislePrefixedExamples,
    bayRangeText,
    isValidSpecificCode,
    labelPrintMode,
    labelText,
    namedAisleExamples,
    setFailure,
    setSuccess,
    shelfRangeText,
  ]);

  return {
    content: {
      bayRangeText,
      shelfRangeText,
      namedAisleExamples,
      aislePrefixedExamples,
    },
    state: {
      labelText,
      generatedLabels,
      errorMessage,
      warningMessage,
      labelPrintMode,
      printModeOptions,
    },
    actions: {
      onInputChange,
      handleModeChange,
      generateLabel,
      resetGeneratedLabels,
    },
  };
};