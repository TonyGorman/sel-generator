import * as React from 'react';
import { IAisleSideMetadata } from '../config/aisleSideMetadata';
import { getLabelHardLimitMessage, getLabelSoftLimitMessage } from '../config/validationMessages';
import {
  createEmptyAisleSideRanges,
  generateAisleLabelCodes,
  getShelfRangeCount,
  IAisleLabelInput,
  parseNumericInput,
  validateAisleLabelInput,
} from '../domain/labelGeneration';
import { hasValue } from '../domain/numericGuard';
import { AisleSide } from '../models/IAisleCodeParts';

type NumericAisleInputKey = 'aisleStart' | 'aisleEnd';

interface UseAisleLabelFormArgs {
  sideRows: readonly IAisleSideMetadata[];
  minAisleValue: number;
  maxAisleValue: number;
  maxBayValue: number;
  softLimit: number;
  hardLimit: number;
  formatTwoDigitValue: (value: number) => string;
}

interface UseAisleLabelFormResult {
  state: {
    formInput: IAisleLabelInput;
    activeSideRanges: Array<IAisleSideMetadata & { start: number | null; end: number | null }>;
    errorMessage: string | null;
    warningMessage: string | null;
    generatedLabels: string[] | null;
    totalLabels: number;
    shelfSummary: string;
  };
  actions: {
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>, type: NumericAisleInputKey) => void;
    onSideRangeInputChange: (
      e: React.ChangeEvent<HTMLInputElement>,
      side: AisleSide,
      rangeType: 'start' | 'end',
    ) => void;
    onShelfStartChange: (letter: string) => void;
    onShelfEndChange: (letter: string) => void;
    generateLabel: () => void;
    resetGeneratedLabels: () => void;
    formatTwoDigits: (value: number | null) => string;
  };
}

export const useAisleLabelForm = ({
  sideRows,
  minAisleValue,
  maxAisleValue,
  maxBayValue,
  softLimit,
  hardLimit,
  formatTwoDigitValue,
}: UseAisleLabelFormArgs): UseAisleLabelFormResult => {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);
  const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null);
  const [formInput, setFormInput] = React.useState<IAisleLabelInput>({
    aisleStart: null,
    aisleEnd: null,
    sideRanges: createEmptyAisleSideRanges(),
    shelfStart: null,
    shelfEnd: null,
  });

  const resetGeneratedLabels = React.useCallback(() => setGeneratedLabels(null), []);

  const onInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>, type: NumericAisleInputKey): void => {
    const numericValue = parseNumericInput(e.target.value);
    setFormInput((prevState) => ({ ...prevState, [type]: numericValue }));
  }, []);

  const onSideRangeInputChange = React.useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    side: AisleSide,
    rangeType: 'start' | 'end',
  ): void => {
    const numericValue = parseNumericInput(e.target.value);
    setFormInput((prevState) => ({
      ...prevState,
      sideRanges: {
        ...prevState.sideRanges,
        [side]: {
          ...prevState.sideRanges[side],
          [rangeType]: numericValue,
        },
      },
    }));
  }, []);

  const onShelfStartChange = React.useCallback((letter: string): void => {
    setFormInput((prevState) => ({ ...prevState, shelfStart: letter || null }));
  }, []);

  const onShelfEndChange = React.useCallback((letter: string): void => {
    setFormInput((prevState) => ({ ...prevState, shelfEnd: letter || null }));
  }, []);

  const formatTwoDigits = React.useCallback((value: number | null): string => {
    if (!hasValue(value)) {
      return '--';
    }

    return formatTwoDigitValue(value);
  }, [formatTwoDigitValue]);

  const shelfSummary = React.useMemo((): string => {
    if (!formInput.shelfEnd) {
      return '--';
    }
    const start = formInput.shelfStart ?? 'A';
    if (start === formInput.shelfEnd) {
      return formInput.shelfEnd;
    }
    return `${start} – ${formInput.shelfEnd}`;
  }, [formInput.shelfEnd, formInput.shelfStart]);

  const activeSideRanges = React.useMemo(
    () => sideRows
      .map((side) => ({
        ...side,
        start: formInput.sideRanges[side.side].start,
        end: formInput.sideRanges[side.side].end,
      }))
      .filter((side) => hasValue(side.start) && hasValue(side.end)),
    [formInput.sideRanges, sideRows],
  );

  const totalAisles = React.useMemo(() => {
    if (!hasValue(formInput.aisleStart) || !hasValue(formInput.aisleEnd)) {
      return 0;
    }
    return formInput.aisleEnd - formInput.aisleStart + 1;
  }, [formInput.aisleEnd, formInput.aisleStart]);

  const totalBayValues = React.useMemo(() => {
    return activeSideRanges.reduce((total, side) => {
      const start = side.start;
      const end = side.end;

      if (!hasValue(start) || !hasValue(end)) {
        return total;
      }

      return total + (end - start + 1);
    }, 0);
  }, [activeSideRanges]);

  const shelfCount = getShelfRangeCount(formInput.shelfStart, formInput.shelfEnd);
  const totalLabels = totalAisles > 0 && shelfCount > 0
    ? totalAisles * totalBayValues * shelfCount
    : 0;

  const generateLabel = React.useCallback((): void => {
    const validationError = validateAisleLabelInput(formInput, {
      minAisleValue,
      maxAisleValue,
      maxBayValue,
    });
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
    setGeneratedLabels(generateAisleLabelCodes(formInput, formatTwoDigitValue));
  }, [
    formInput,
    formatTwoDigitValue,
    hardLimit,
    maxAisleValue,
    maxBayValue,
    minAisleValue,
    softLimit,
    totalLabels,
  ]);

  return {
    state: {
      formInput,
      activeSideRanges,
      errorMessage,
      warningMessage,
      generatedLabels,
      totalLabels,
      shelfSummary,
    },
    actions: {
      onInputChange,
      onSideRangeInputChange,
      onShelfStartChange,
      onShelfEndChange,
      generateLabel,
      resetGeneratedLabels,
      formatTwoDigits,
    },
  };
};