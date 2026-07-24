import * as React from 'react';

interface UseLabelGenerationFeedbackResult {
  state: {
    generatedLabels: string[] | null;
    errorMessage: string | null;
    warningMessage: string | null;
  };
  actions: {
    resetGeneratedLabels: () => void;
    setFailure: (errorMessage: string) => void;
    setSuccess: (generatedLabels: string[], warningMessage: string | null) => void;
  };
}

export const useLabelGenerationFeedback = (): UseLabelGenerationFeedbackResult => {
  const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);

  const resetGeneratedLabels = React.useCallback(() => {
    setGeneratedLabels(null);
  }, []);

  const setFailure = React.useCallback((nextErrorMessage: string) => {
    setErrorMessage(nextErrorMessage);
    setWarningMessage(null);
    setGeneratedLabels(null);
  }, []);

  const setSuccess = React.useCallback((nextGeneratedLabels: string[], nextWarningMessage: string | null) => {
    setErrorMessage(null);
    setWarningMessage(nextWarningMessage);
    setGeneratedLabels(nextGeneratedLabels);
  }, []);

  return {
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
  };
};