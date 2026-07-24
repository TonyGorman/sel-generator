import * as React from 'react';
import { LabelPrintMode } from '../models/ILabelLayoutStrategy';
import { RadioOption } from './FormControls';

const PRINT_MODE_OPTIONS: RadioOption<LabelPrintMode>[] = [
  { key: 'mini-sel', text: 'Mini SEL' },
  { key: 'large-sel', text: 'Large SEL' },
];

export const useLabelPrintMode = (onModeChange?: (newMode: LabelPrintMode) => void) => {
  const [labelPrintMode, setLabelPrintMode] = React.useState<LabelPrintMode>('mini-sel');
  const onModeChangeRef = React.useRef(onModeChange);
  onModeChangeRef.current = onModeChange;

  const handleModeChange = React.useCallback((key: LabelPrintMode) => {
    setLabelPrintMode((currentMode) => {
      if (currentMode === key) {
        return currentMode;
      }

      onModeChangeRef.current?.(key);
      return key;
    });
  }, []);

  return { labelPrintMode, printModeOptions: PRINT_MODE_OPTIONS, handleModeChange };
};
