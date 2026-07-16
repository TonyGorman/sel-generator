import * as React from 'react';
import { LabelPrintMode } from '../models/ILabelLayoutStrategy';
import { RadioOption } from './FormControls';

interface UseLabelPrintModeOptions {
  onModeChange?: (newMode: LabelPrintMode) => void;
}

export const useLabelPrintMode = (options?: UseLabelPrintModeOptions) => {
  const [labelPrintMode, setLabelPrintMode] = React.useState<LabelPrintMode>('mini-sel');

  const printModeOptions: RadioOption<LabelPrintMode>[] = [
    { key: 'mini-sel', text: 'Mini SEL' },
    { key: 'large-sel', text: 'Large SEL' },
  ];

  const handleModeChange = React.useCallback((key: LabelPrintMode) => {
    setLabelPrintMode(key);
    options?.onModeChange?.(key);
  }, [options]);

  return { labelPrintMode, printModeOptions, handleModeChange };
};
