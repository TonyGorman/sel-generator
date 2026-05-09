import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('updates rendered slice when data changes and current page is out of range', async () => {
    const onPageChange = vi.fn();
    const fullData = Array.from({ length: 70 }, (_, index) => `item-${index + 1}`);

    const { rerender } = render(<Pagination data={fullData} onPageChange={onPageChange} />);

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(fullData.slice(0, 35));
    });

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(fullData.slice(35, 70));
    });

    const reducedData = fullData.slice(0, 20);
    rerender(<Pagination data={reducedData} onPageChange={onPageChange} />);

    await waitFor(() => {
      expect(onPageChange).toHaveBeenLastCalledWith(reducedData);
    });
  });
});
