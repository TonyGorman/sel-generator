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

  const handlePageChange = React.useCallback((pageNumber: number): void => {
    const nextIndex = Math.max(0, pageNumber - 1);
    setPreviewPageIndex(nextIndex);
  }, []);

  return {
    pagedItems,
    previewItems,
    handlePageChange,
  };
};
