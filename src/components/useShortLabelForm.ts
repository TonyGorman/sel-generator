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
type NumericShortInputKey = 'bayStart' | 'bayEnd';

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
    formInput: ShortInputWithoutPrefix;
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
  const [formInput, setFormInput] = React.useState<ShortInputWithoutPrefix>({
    bayStart: null,
    bayEnd: null,
    shelfStart: null,
    shelfEnd: null,
  });

  const resetGeneratedLabels = React.useCallback(() => setGeneratedLabels(null), []);

  const onInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>, type: NumericShortInputKey): void => {
    const numericValue = parseNumericInput(e.target.value);
    setFormInput((prevState) => ({ ...prevState, [type]: numericValue }));
  }, []);

  const onShelfStartChange = React.useCallback((letter: string): void => {
    setFormInput((prevState) => ({ ...prevState, shelfStart: letter || null }));
  }, []);

  const onShelfEndChange = React.useCallback((letter: string): void => {
    setFormInput((prevState) => ({ ...prevState, shelfEnd: letter || null }));
  }, []);

  const shelfCount = getShelfRangeCount(formInput.shelfStart, formInput.shelfEnd);
  const bayCount = React.useMemo(() => {
    if (formInput.bayStart === null || formInput.bayEnd === null) {
      return 0;
    }

    return formInput.bayEnd - formInput.bayStart + 1;
  }, [formInput.bayEnd, formInput.bayStart]);
  const totalLabels = bayCount * shelfCount;

  const shortLabelInput = React.useMemo<IShortLabelInput>(() => {
    return {
      ...formInput,
      prefix: selectedShortCodePrefix,
    };
  }, [formInput, selectedShortCodePrefix]);

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
      formInput,
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