import * as React from 'react';
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant';

/**
 * Resets generated label output when the mini variant selection changes.
 * Shared across all form components to avoid duplicating the same effect.
 */
export const useResetOnVariantChange = (
  miniVariantId: MiniCompositionVariantId | undefined,
  resetFn: () => void,
): void => {
  React.useEffect(() => {
    resetFn();
  }, [miniVariantId, resetFn]);
};
