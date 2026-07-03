import * as React from 'react';

export const usePaginatedLabels = (labelCodes: string[], itemsPerPage: number) => {
  const pagedItems = React.useMemo(() => {
    const pages: string[][] = [];

    for (let index = 0; index < labelCodes.length; index += itemsPerPage) {
      pages.push(labelCodes.slice(index, index + itemsPerPage));
    }

    return pages;
  }, [labelCodes, itemsPerPage]);

  const [previewPageIndex, setPreviewPageIndex] = React.useState(0);

  const safePreviewPageIndex = React.useMemo(() => {
    if (pagedItems.length === 0) {
      return 0;
    }

    return Math.min(previewPageIndex, pagedItems.length - 1);
  }, [pagedItems, previewPageIndex]);

  const previewItems = React.useMemo(() => {
    return pagedItems[safePreviewPageIndex] ?? [];
  }, [pagedItems, safePreviewPageIndex]);

  const handlePageChange = React.useCallback((currentItems: string[]): void => {
    const matchingPageIndex = pagedItems.findIndex((pageItems) => {
      if (pageItems.length !== currentItems.length) {
        return false;
      }

      return pageItems.every((item, index) => item === currentItems[index]);
    });

    setPreviewPageIndex(matchingPageIndex >= 0 ? matchingPageIndex : 0);
  }, [pagedItems]);

  return {
    pagedItems,
    previewItems,
    handlePageChange,
  };
};
