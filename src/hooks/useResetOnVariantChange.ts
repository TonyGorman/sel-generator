import * as React from 'react';
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant';

/**
 * Resets generated label output when the mini variant selection changes.
 * Shared across all form components to avoid duplicating the same effect.
 * Uses a ref guard to skip the initial-mount invocation (miniVariantId hasn't changed from initial undefined).
 */
export const useResetOnVariantChange = (
  miniVariantId: MiniCompositionVariantId | undefined,
  resetFn: () => void,
): void => {
  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    resetFn();
  }, [miniVariantId, resetFn]);
};
