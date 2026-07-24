import * as React from 'react';
import {
  getShelfRangeCount,
  IShortLabelInput,
} from '../domain/labelGeneration';
import { updateOptionalLetterField, updateParsedNumericField } from './formStateUpdaters';
import { getShortGenerationPipelineResult } from './labelGenerationPipelines';
import { useLabelGenerationFeedback } from './useLabelGenerationFeedback';

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
  const [selectedShortCodePrefix, setSelectedShortCodePrefix] = React.useState<string>(initialPrefix);
  const [formInput, setFormInput] = React.useState<ShortInputWithoutPrefix>({
    bayStart: null,
    bayEnd: null,
    shelfStart: null,
    shelfEnd: null,
  });

  const onInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>, type: NumericShortInputKey): void => {
    updateParsedNumericField(setFormInput, type, e.target.value);
  }, []);

  const onShelfStartChange = React.useCallback((letter: string): void => {
    updateOptionalLetterField(setFormInput, 'shelfStart', letter);
  }, []);

  const onShelfEndChange = React.useCallback((letter: string): void => {
    updateOptionalLetterField(setFormInput, 'shelfEnd', letter);
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
    const generationResult = getShortGenerationPipelineResult({
      formInput: shortLabelInput,
      minBayValue,
      maxBayValue,
      softLimit,
      hardLimit,
      totalLabels,
      formatTwoDigitValue,
    });
    if (generationResult.errorMessage) {
      setFailure(generationResult.errorMessage);
      return;
    }

    setSuccess(generationResult.labels, generationResult.warningMessage);
  }, [
    formatTwoDigitValue,
    hardLimit,
    maxBayValue,
    minBayValue,
    setFailure,
    setSuccess,
    shortLabelInput,
    softLimit,
    totalLabels,
  ]);

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