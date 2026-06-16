import { describe, expect, it, vi } from 'vitest';

vi.mock('jspdf', () => ({ jsPDF: vi.fn() }));
vi.mock('jsbarcode', () => ({ default: vi.fn() }));
vi.mock('svg2pdf.js', () => {
  throw new Error('module load failed');
});

describe('exportLabelPdf dependency load failures', () => {
  it('returns dependency-load-failed when import dependencies cannot be loaded', async () => {
    const { exportLabelPdf } = await import('./labelPdfExporter');
    const { getLabelLayoutStrategy } = await import('../config/labelLayoutStrategies');

    const exportRoot = document.createElement('div');
    const page = document.createElement('div');
    page.className = 'print-page';
    exportRoot.appendChild(page);

    await expect(
      exportLabelPdf({
        exportRoot,
        printPageClassName: 'print-page',
        pagedItems: [['01L01A']],
        layoutStrategy: getLabelLayoutStrategy('mini-sel'),
      }),
    ).rejects.toMatchObject({ code: 'dependency-load-failed' });
  });
});
