import * as React from 'react';
import {
  AISLE_PREFIXES,
  SHORT_CODE_PREFIXES,
  MIN_AISLE_VALUE,
  MAX_AISLE_VALUE,
  MAX_BAY_VALUE,
  MAX_SHELF_LETTER,
  SPECIAL_AISLE_VALUES,
  LABEL_SOFT_LIMIT,
  LABEL_HARD_LIMIT,
} from '../config/labelConfig';
import {
  VALIDATION_MESSAGES,
  getLabelHardLimitMessage,
  getLabelSoftLimitMessage,
  getSpecificInvalidLabelMessage,
} from '../config/validationMessages';
import { validateSpecificLabelCode } from '../domain/labelCodeDomain';
import { normalizeSpecificInputCodes } from '../domain/labelGeneration';
import { LabelPrintMode } from '../models/ILabelLayoutStrategy';
import { useLabelPrintMode } from './useLabelPrintMode';

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
  const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);

  const resetGeneratedLabels = React.useCallback(() => setGeneratedLabels(null), []);
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
    const labelTexts = normalizeSpecificInputCodes(labelText);

    if (labelTexts.length === 0) {
      setErrorMessage(VALIDATION_MESSAGES.specificEmpty);
      setWarningMessage(null);
      setGeneratedLabels(null);
      return;
    }

    if (labelTexts.length > LABEL_HARD_LIMIT) {
      setErrorMessage(getLabelHardLimitMessage(LABEL_HARD_LIMIT));
      setWarningMessage(null);
      setGeneratedLabels(null);
      return;
    }

    const hasInvalidCode = labelTexts.some((code) => !isValidSpecificCode(code));
    if (hasInvalidCode) {
      setErrorMessage(getSpecificInvalidLabelMessage({
        aislePrefixedExamples,
        backPrefix: SHORT_CODE_PREFIXES[0],
        frontPrefix: SHORT_CODE_PREFIXES[1],
        namedAisleExamples,
        bayRangeText,
        shelfRangeText,
      }));
      setWarningMessage(null);
      setGeneratedLabels(null);
      return;
    }

    if (labelPrintMode === 'large-sel' && labelTexts.some((code) => (SPECIAL_AISLE_VALUES as ReadonlyArray<string>).includes(code))) {
      setErrorMessage(VALIDATION_MESSAGES.specificLargeSelSpecialCode);
      setWarningMessage(null);
      setGeneratedLabels(null);
      return;
    }

    setErrorMessage(null);
    setWarningMessage(labelTexts.length > LABEL_SOFT_LIMIT ? getLabelSoftLimitMessage(LABEL_SOFT_LIMIT) : null);
    setGeneratedLabels(labelTexts);
  }, [aislePrefixedExamples, bayRangeText, isValidSpecificCode, labelPrintMode, labelText, namedAisleExamples, shelfRangeText]);

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