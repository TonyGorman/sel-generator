import * as React from 'react';
import { parseNumericInput } from '../domain/labelGeneration';

type StateWithNullableNumber<K extends string> = Record<K, number | null>;
type StateWithNullableString<K extends string> = Record<K, string | null>;

export const setParsedNumericField = <K extends string, T extends StateWithNullableNumber<K>>(
  prevState: T,
  key: K,
  rawValue: string,
): T => {
  return {
    ...prevState,
    [key]: parseNumericInput(rawValue),
  };
};

export const setOptionalLetterField = <K extends string, T extends StateWithNullableString<K>>(
  prevState: T,
  key: K,
  value: string,
): T => {
  return {
    ...prevState,
    [key]: value || null,
  };
};

export const updateParsedNumericField = <K extends string, T extends StateWithNullableNumber<K>>(
  setState: React.Dispatch<React.SetStateAction<T>>,
  key: K,
  rawValue: string,
): void => {
  setState((prevState) => setParsedNumericField(prevState, key, rawValue));
};

export const updateOptionalLetterField = <K extends string, T extends StateWithNullableString<K>>(
  setState: React.Dispatch<React.SetStateAction<T>>,
  key: K,
  value: string,
): void => {
  setState((prevState) => setOptionalLetterField(prevState, key, value));
};