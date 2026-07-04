import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('calls onPageChange with empty data and renders no page buttons', async () => {
    const onPageChange = vi.fn();

    render(<Pagination data={[]} onPageChange={onPageChange} />);

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses custom itemsPerPage when provided', async () => {
    const onPageChange = vi.fn();
    const fullData = Array.from({ length: 16 }, (_, index) => `item-${index + 1}`);

    render(<Pagination data={fullData} itemsPerPage={8} onPageChange={onPageChange} />);

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    expect(screen.getAllByRole('button')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  it('resets to first page when data changes and current page is out of range', async () => {
    const onPageChange = vi.fn();
    const fullData = Array.from({ length: 70 }, (_, index) => `item-${index + 1}`);

    const { rerender } = render(<Pagination data={fullData} onPageChange={onPageChange} />);

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    const reducedData = fullData.slice(0, 20);
    rerender(<Pagination data={reducedData} onPageChange={onPageChange} />);

    await waitFor(() => {
      expect(onPageChange).toHaveBeenLastCalledWith(1);
    });
  });

  it('renders navigation landmark with accessible label', () => {
    const onPageChange = vi.fn();
    const data = Array.from({ length: 70 }, (_, i) => `item-${i + 1}`);

    render(<Pagination data={data} onPageChange={onPageChange} />);

    expect(screen.getByRole('navigation', { name: 'Label pages' })).toBeInTheDocument();
  });

  it('marks the active page button with aria-current', async () => {
    const onPageChange = vi.fn();
    const data = Array.from({ length: 70 }, (_, i) => `item-${i + 1}`);

    render(<Pagination data={data} itemsPerPage={35} onPageChange={onPageChange} />);

    const page1Button = screen.getByRole('button', { name: 'Go to page 1' });
    const page2Button = screen.getByRole('button', { name: 'Go to page 2' });

    expect(page1Button).toHaveAttribute('aria-current', 'page');
    expect(page2Button).not.toHaveAttribute('aria-current');

    fireEvent.click(page2Button);

    await waitFor(() => {
      expect(page2Button).toHaveAttribute('aria-current', 'page');
    });
    expect(page1Button).not.toHaveAttribute('aria-current');
  });

  it('renders only the page 1 button for a single page of data', async () => {
    const onPageChange = vi.fn();
    const data = Array.from({ length: 10 }, (_, i) => `item-${i + 1}`);

    render(<Pagination data={data} itemsPerPage={35} onPageChange={onPageChange} />);

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    expect(screen.queryAllByRole('button')).toHaveLength(1);
  });

  it('renders only the page 1 button when data length equals itemsPerPage', async () => {
    const onPageChange = vi.fn();
    const data = Array.from({ length: 35 }, (_, i) => `item-${i + 1}`);

    render(<Pagination data={data} itemsPerPage={35} onPageChange={onPageChange} />);

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    expect(screen.queryAllByRole('button')).toHaveLength(1);
  });

  it('navigates back to first page correctly', async () => {
    const onPageChange = vi.fn();
    const data = Array.from({ length: 105 }, (_, i) => `item-${i + 1}`);

    render(<Pagination data={data} itemsPerPage={35} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Go to page 3' }));

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Go to page 1' }));

    await waitFor(() => {
      expect(onPageChange).toHaveBeenLastCalledWith(1);
    });
  });
});
