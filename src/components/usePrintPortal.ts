import * as React from 'react';

export const usePrintPortal = (containerId: string = 'label-print-surface'): HTMLElement | null => {
  const [printContainer, setPrintContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    let container = document.getElementById(containerId);
    let createdContainer = false;

    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
      createdContainer = true;
    }

    setPrintContainer(container);

    return () => {
      if (createdContainer && container?.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, [containerId]);

  return printContainer;
};
