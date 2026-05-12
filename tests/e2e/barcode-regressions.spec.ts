import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_BACK_CODE_PREFIX } from '../../src/config/barcodeConfig';

const sanitizePdfForSnapshot = (pdfBytes: Buffer): string => {
  return pdfBytes
    .toString('latin1')
    .replace(/\/CreationDate \(D:[^)]+\)/g, '/CreationDate (D:00000000000000+00\'00\')')
    .replace(/\/ModDate \(D:[^)]+\)/g, '/ModDate (D:00000000000000+00\'00\')')
    .replace(/\/ID \[<[^>]+><[^>]+>\]/g, '/ID [<stable-id><stable-id>]');
};

const roundPdfPointValue = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const buildPdfContractSnapshot = (
  pdfBytes: Buffer,
): {
  pageCount: number;
  textTokens: string[];
  pageBoxes: Array<{ widthPt: number; heightPt: number; orientation: 'landscape' | 'portrait' }>;
} => {
  const normalizedPdf = sanitizePdfForSnapshot(pdfBytes);
  const pageCount = (normalizedPdf.match(/\/Type \/Page\b/g) ?? []).length;
  const pageBoxes = Array.from(
    normalizedPdf.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\]/g),
  ).map((match) => {
    const widthPt = roundPdfPointValue(Number.parseFloat(match[1]));
    const heightPt = roundPdfPointValue(Number.parseFloat(match[2]));

    return {
      widthPt,
      heightPt,
      orientation: widthPt >= heightPt ? 'landscape' as const : 'portrait' as const,
    };
  });

  const textTokens = Array.from(
    new Set(
      Array.from(normalizedPdf.matchAll(/\(([^\)\r\n]{1,40})\)\s*Tj/g))
        .map((match) => match[1].trim())
        .filter((token) => /[A-Za-z0-9]/.test(token))
        .filter((token) => token.length <= 20)
        .filter((token) => /^[A-Za-z0-9\-\s]+$/.test(token)),
    ),
  ).sort();

  return {
    pageCount,
    textTokens,
    pageBoxes,
  };
};

const pdfBundlePath = join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.min.mjs');
const pdfWorkerBundlePath = join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs');

let cachedPdfBundleSource: string | null = null;
let cachedPdfWorkerSource: string | null = null;

const getPdfBundleSources = async (): Promise<{ pdfBundleSource: string; pdfWorkerSource: string }> => {
  if (!cachedPdfBundleSource) {
    cachedPdfBundleSource = await readFile(pdfBundlePath, 'utf8');
  }
  if (!cachedPdfWorkerSource) {
    cachedPdfWorkerSource = await readFile(pdfWorkerBundlePath, 'utf8');
  }

  return {
    pdfBundleSource: cachedPdfBundleSource,
    pdfWorkerSource: cachedPdfWorkerSource,
  };
};

const renderFirstPdfPageAsPng = async (page: Page, pdfBytes: Buffer, scale: number = 2): Promise<Buffer> => {
  const { pdfBundleSource, pdfWorkerSource } = await getPdfBundleSources();
  const rendererPage = await page.context().newPage();

  try {
    const pngBase64 = await rendererPage.evaluate(
      async ({ pdfBase64, scale: renderScale, pdfBundleSource: bundle, pdfWorkerSource: workerBundle }) => {
        const createBytes = (base64: string): Uint8Array => {
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
          }
          return bytes;
        };

        const pdfBundleUrl = URL.createObjectURL(new Blob([bundle], { type: 'text/javascript' }));
        const pdfWorkerUrl = URL.createObjectURL(new Blob([workerBundle], { type: 'text/javascript' }));

        try {
          const pdfjs = await import(pdfBundleUrl);
          pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

          const loadingTask = pdfjs.getDocument({ data: createBytes(pdfBase64) });
          const documentProxy = await loadingTask.promise;

          try {
            const firstPage = await documentProxy.getPage(1);
            const viewport = firstPage.getViewport({ scale: renderScale });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);

            const context = canvas.getContext('2d');
            if (!context) {
              throw new Error('Unable to get 2D canvas context for PDF rendering.');
            }

            await firstPage.render({
              canvasContext: context,
              viewport,
            }).promise;

            return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
          } finally {
            await documentProxy.destroy();
          }
        } finally {
          URL.revokeObjectURL(pdfBundleUrl);
          URL.revokeObjectURL(pdfWorkerUrl);
        }
      },
      {
        pdfBase64: pdfBytes.toString('base64'),
        scale,
        pdfBundleSource,
        pdfWorkerSource,
      },
    );

    return Buffer.from(pngBase64, 'base64');
  } finally {
    await rendererPage.close();
  }
};

test.describe('Barcode Generator regressions', () => {

  test('loads and shows primary tabs', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('tab', { name: 'Specific barcode' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Aisle barcode' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Back barcode' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Configuration' })).toBeVisible();
  });

  test('Aisle configuration link navigates to configuration tab', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle barcode' }).click();
    await page.getByRole('link', { name: 'configuration section' }).click();

    await expect(page.getByRole('heading', { name: 'Label Configuration' })).toBeVisible();
  });

  test('Specific barcode tab shows validation message for empty submission', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific barcode' }).click();
    await page.getByRole('button', { name: 'Generate Barcodes' }).click();

    await expect(page.getByRole('alert')).toContainText('Enter at least one barcode value.');
  });

  test('Specific barcode generation downloads a PDF export', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Enter barcodes').fill(`01L01A,${DEFAULT_BACK_CODE_PREFIX}01A`);
    await page.getByRole('button', { name: 'Generate Barcodes' }).click();

    await expect(page.getByRole('button', { name: 'Print Barcodes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download Barcodes' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Barcodes' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('barcodes.pdf');
  });

  test('Back tab shows validation message for missing values', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Back barcode' }).click();
    await page.getByRole('button', { name: 'Generate Barcodes' }).click();

    await expect(page.getByRole('alert')).toContainText('Please enter start bay, end bay, and shelves using whole numbers.');
  });

  test('Aisle barcode generation updates the summary and invokes print', async ({ page }) => {
    await page.addInitScript(() => {
      (window as typeof window & { __printCalls?: number }).__printCalls = 0;
      window.print = () => {
        (window as typeof window & { __printCalls?: number }).__printCalls = ((window as typeof window & { __printCalls?: number }).__printCalls ?? 0) + 1;
      };
    });

    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle barcode' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('1');
    await visibleInputs.nth(10).fill('1');

    await expect(page.getByText('Total labels: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Generate Barcodes' }).click();
    await expect(page.getByRole('button', { name: 'Print Barcodes' })).toBeVisible();

    await page.getByRole('button', { name: 'Print Barcodes' }).click();
    await expect.poll(async () => page.evaluate(() => (window as typeof window & { __printCalls?: number }).__printCalls ?? 0)).toBe(1);
  });

  test('Large SEL mode is only available from Aisle tab', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific barcode' }).click();
    await expect(page.getByLabel('Large SEL')).toHaveCount(0);

    await page.getByRole('tab', { name: 'Aisle barcode' }).click();
    await expect(page.getByLabel('Large SEL')).toBeVisible();
    await expect(page.getByLabel('Mini SEL')).toBeVisible();
  });

  test('Aisle Large SEL preview remains visually stable for one full 8-label page', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1600 });
    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle barcode' }).click();
    await page.getByLabel('Large SEL').click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('2');
    await visibleInputs.nth(4).fill('1');
    await visibleInputs.nth(5).fill('2');
    await visibleInputs.nth(10).fill('2');

    await page.getByRole('button', { name: 'Generate Barcodes' }).click();
    await expect(page.getByRole('button', { name: 'Print Barcodes' })).toBeVisible();

    const barcodeRoot = page.locator('[class*="barcodeRoot"]').first();
    await barcodeRoot.evaluate((element) => {
      element.scrollLeft = 0;
    });

    const previewPage = page.locator('[class*="previewPage"]').first();
    await expect(previewPage).toHaveScreenshot('aisle-large-sel-8-labels.png', {
      animations: 'disabled',
      // Allow minor cross-platform anti-aliasing/font rasterization drift (macOS vs Linux).
      maxDiffPixelRatio: 0.05,
    });
  });

  test('Aisle Large SEL download remains stable for regression snapshots', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle barcode' }).click();
    await page.getByLabel('Large SEL').click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('2');
    await visibleInputs.nth(4).fill('1');
    await visibleInputs.nth(5).fill('2');
    await visibleInputs.nth(10).fill('2');

    await page.getByRole('button', { name: 'Generate Barcodes' }).click();
    await expect(page.getByRole('button', { name: 'Download Barcodes' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Barcodes' }).click();
    const download = await downloadPromise;

    const filePath = await download.path();
    expect(filePath).not.toBeNull();

    const pdfBytes = await readFile(filePath as string);
    const contractSnapshot = buildPdfContractSnapshot(pdfBytes);

    expect(contractSnapshot.pageBoxes).toEqual([
      {
        widthPt: 595.28,
        heightPt: 841.89,
        orientation: 'portrait',
      },
    ]);

    expect(JSON.stringify(contractSnapshot, null, 2)).toMatchSnapshot('aisle-large-sel-download.contract.json');

    const firstPagePng = await renderFirstPdfPageAsPng(page, pdfBytes);
    expect(firstPagePng).toMatchSnapshot('aisle-large-sel-download-first-page.visual.png');
  });

  test('Specific barcode download remains stable for regression snapshot', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific barcode' }).click();
    await page.getByPlaceholder('Enter barcodes').fill('01L01A');
    await page.getByRole('button', { name: 'Generate Barcodes' }).click();
    await expect(page.getByRole('button', { name: 'Download Barcodes' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Barcodes' }).click();
    const download = await downloadPromise;

    const filePath = await download.path();
    expect(filePath).not.toBeNull();

    const pdfBytes = await readFile(filePath as string);
    const contractSnapshot = buildPdfContractSnapshot(pdfBytes);

    expect(JSON.stringify(contractSnapshot, null, 2)).toMatchSnapshot('specific-download.contract.json');
  });

  test('Specific barcode download first page remains visually stable', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific barcode' }).click();
    const barcodeValues = Array.from({ length: 35 }, (_, index) => `01L${String(index + 1).padStart(2, '0')}A`).join(',');
    await page.getByPlaceholder('Enter barcodes').fill(barcodeValues);
    await page.getByRole('button', { name: 'Generate Barcodes' }).click();
    await expect(page.getByRole('button', { name: 'Download Barcodes' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Barcodes' }).click();
    const download = await downloadPromise;

    const filePath = await download.path();
    expect(filePath).not.toBeNull();

    const pdfBytes = await readFile(filePath as string);
    const firstPagePng = await renderFirstPdfPageAsPng(page, pdfBytes);

    expect(firstPagePng).toMatchSnapshot('specific-download-first-page.visual.png');
  });

  test('captures full preview of 35 barcodes with default configuration', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1400 });
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific barcode' }).click();

    const barcodeValues = Array.from({ length: 35 }, (_, index) => `01L${String(index + 1).padStart(2, '0')}A`).join(',');
    await page.getByPlaceholder('Enter barcodes').fill(barcodeValues);
    await page.getByRole('button', { name: 'Generate Barcodes' }).click();

    await expect(page.getByRole('button', { name: 'Print Barcodes' })).toBeVisible();

    const barcodeRoot = page.locator('[class*="barcodeRoot"]').first();
    await barcodeRoot.evaluate((element) => {
      element.scrollLeft = 0;
    });

    const previewPage = page.locator('[class*="previewPage"]').first();
    await expect(previewPage).toHaveScreenshot('default-config-35-barcodes.png', {
      animations: 'disabled',
    });
  });
});
