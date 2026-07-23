import * as React from 'react';
import {
  generateShortLabelCodes,
  getShelfRangeCount,
  IShortLabelInput,
  parseNumericInput,
  validateShortLabelInput,
} from '../domain/labelGeneration';
import { getLabelHardLimitMessage, getLabelSoftLimitMessage } from '../config/validationMessages';

type ShortInputWithoutPrefix = Omit<IShortLabelInput, 'prefix'>;
type NumericShortInputKey = 'bay_start' | 'bay_end';

interface UseShortLabelFormArgs {
  initialPrefix: string;
  minBayValue: number;
  maxBayValue: number;
  softLimit: number;
  hardLimit: number;
  formatTwoDigitValue: (value: number) => string;
}

interface UseShortLabelFormResult {
  state: {
    labelStruct: ShortInputWithoutPrefix;
    selectedShortCodePrefix: string;
    errorMessage: string | null;
    warningMessage: string | null;
    generatedLabels: string[] | null;
  };
  actions: {
    setSelectedShortCodePrefix: React.Dispatch<React.SetStateAction<string>>;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>, type: NumericShortInputKey) => void;
    onShelfStartChange: (letter: string) => void;
    onShelfEndChange: (letter: string) => void;
    generateLabel: () => void;
    resetGeneratedLabels: () => void;
  };
}

export const useShortLabelForm = ({
  initialPrefix,
  minBayValue,
  maxBayValue,
  softLimit,
  hardLimit,
  formatTwoDigitValue,
}: UseShortLabelFormArgs): UseShortLabelFormResult => {
  const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);
  const [selectedShortCodePrefix, setSelectedShortCodePrefix] = React.useState<string>(initialPrefix);
  const [labelStruct, setLabelStruct] = React.useState<ShortInputWithoutPrefix>({
    bay_start: null,
    bay_end: null,
    shelf_start: null,
    shelf_end: null,
  });

  const resetGeneratedLabels = React.useCallback(() => setGeneratedLabels(null), []);

  const onInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>, type: NumericShortInputKey): void => {
    const numericValue = parseNumericInput(e.target.value);
    setLabelStruct((prevState) => ({ ...prevState, [type]: numericValue }));
  }, []);

  const onShelfStartChange = React.useCallback((letter: string): void => {
    setLabelStruct((prevState) => ({ ...prevState, shelf_start: letter || null }));
  }, []);

  const onShelfEndChange = React.useCallback((letter: string): void => {
    setLabelStruct((prevState) => ({ ...prevState, shelf_end: letter || null }));
  }, []);

  const shelfCount = getShelfRangeCount(labelStruct.shelf_start, labelStruct.shelf_end);
  const bayCount = React.useMemo(() => {
    if (labelStruct.bay_start === null || labelStruct.bay_end === null) {
      return 0;
    }

    return labelStruct.bay_end - labelStruct.bay_start + 1;
  }, [labelStruct.bay_end, labelStruct.bay_start]);
  const totalLabels = bayCount * shelfCount;

  const shortLabelInput = React.useMemo<IShortLabelInput>(() => {
    return {
      ...labelStruct,
      prefix: selectedShortCodePrefix,
    };
  }, [labelStruct, selectedShortCodePrefix]);

  const generateLabel = React.useCallback((): void => {
    const validationError = validateShortLabelInput(shortLabelInput, minBayValue, maxBayValue);
    if (validationError) {
      setErrorMessage(validationError);
      setWarningMessage(null);
      setGeneratedLabels(null);
      return;
    }

    if (totalLabels > hardLimit) {
      setErrorMessage(getLabelHardLimitMessage(hardLimit));
      setWarningMessage(null);
      setGeneratedLabels(null);
      return;
    }

    setErrorMessage(null);
    setWarningMessage(totalLabels > softLimit ? getLabelSoftLimitMessage(softLimit) : null);
    setGeneratedLabels(generateShortLabelCodes(shortLabelInput, formatTwoDigitValue));
  }, [formatTwoDigitValue, hardLimit, maxBayValue, minBayValue, shortLabelInput, softLimit, totalLabels]);

  return {
    state: {
      labelStruct,
      selectedShortCodePrefix,
      errorMessage,
      warningMessage,
      generatedLabels,
    },
    actions: {
      setSelectedShortCodePrefix,
      onInputChange,
      onShelfStartChange,
      onShelfEndChange,
      generateLabel,
      resetGeneratedLabels,
    },
  };
};