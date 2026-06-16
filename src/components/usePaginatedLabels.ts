import * as React from 'react';

export const usePaginatedLabels = (labelCodes: string[], itemsPerPage: number) => {
  const pagedItems = React.useMemo(() => {
    const pages: string[][] = [];

    for (let index = 0; index < labelCodes.length; index += itemsPerPage) {
      pages.push(labelCodes.slice(index, index + itemsPerPage));
    }

    return pages;
  }, [labelCodes, itemsPerPage]);

  const [previewItems, setPreviewItems] = React.useState<string[]>(() => labelCodes.slice(0, itemsPerPage));

  React.useEffect(() => {
    setPreviewItems(labelCodes.slice(0, itemsPerPage));
  }, [labelCodes, itemsPerPage]);

  const handlePageChange = React.useCallback((currentItems: string[]): void => {
    setPreviewItems(currentItems);
  }, []);

  return {
    pagedItems,
    previewItems,
    handlePageChange,
  };
};
