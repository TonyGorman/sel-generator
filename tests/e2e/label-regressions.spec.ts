import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Buffer } from 'buffer';
import {SHORT_CODE_PREFIXES} from './testConstants';

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
    pdfBundleSource: cachedPdfBundleSource!,
    pdfWorkerSource: cachedPdfWorkerSource!,
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
            // pdfjs-dist API differs by version/build: documentProxy.destroy may be absent.
            if (typeof documentProxy.destroy === 'function') {
              await documentProxy.destroy();
            } else if (typeof loadingTask.destroy === 'function') {
              await loadingTask.destroy();
            }
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

const selectMiniVariant = async (page: Page, variant: 'mini-three-row' | 'mini-shelf-emphasis'): Promise<void> => {
  await page.getByLabel('Mini Variant').selectOption(variant);
};

test.describe('Label Generator regressions', () => {

  test('loads and shows primary tabs', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('tab')).toHaveCount(3);
    await expect(page.getByRole('tab', { name: 'Specific Labels' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Aisle Labels' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'FOS/Bak Labels' })).toBeVisible();
  });

  test('Specific Labels tab shows validation message for empty submission', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toContainText('Enter at least one label value.');
  });

  test('Specific Labels generation downloads a PDF export', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Enter labels').fill(`01L01A,${SHORT_CODE_PREFIXES[0]}01A`);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download Labels' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Labels' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('labels.pdf');
  });

  test('Specific Labels shows a clear error when vector export and raster fallback both fail', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Enter labels').fill('01L01A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Download Labels' })).toBeVisible();

    await page.evaluate(() => {
      const originalCreateElementNS = document.createElementNS.bind(document);
      document.createElementNS = ((namespace: string | null, qualifiedName: string, options?: ElementCreationOptions) => {
        if (qualifiedName.toLowerCase() === 'svg') {
          throw new Error('forced vector export failure');
        }
        return originalCreateElementNS(namespace, qualifiedName, options);
      }) as typeof document.createElementNS;

      HTMLCanvasElement.prototype.toDataURL = (() => {
        throw new Error('forced raster fallback failure');
      }) as typeof HTMLCanvasElement.prototype.toDataURL;
    });

    await page.getByRole('button', { name: 'Download Labels' }).click();

    await expect(page.getByRole('alert')).toContainText('Download failed: both vector export and raster fallback failed.');
  });

  test('Specific Labels accepts compact input and rejects non-compact formats', async ({ page }) => {
    await page.goto('/');

    const compactInput = [
      '01L01A',
      `${SHORT_CODE_PREFIXES[0]}01A`,
    ].join(',');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByPlaceholder('Enter labels').fill(compactInput);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download Labels' })).toBeVisible();

    await expect(page.getByText('01L01A', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[0]}01A`, { exact: true }).first()).toBeVisible();

    // Separated and spaced inputs are rejected
    await page.getByPlaceholder('Enter labels').fill('01-L01-A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('alert')).toHaveCount(1);

    await page.getByPlaceholder('Enter labels').fill('01 L01 A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('alert')).toHaveCount(1);
  });

  test('Specific Labels accepts both Back and Front Of Store compact short code prefixes', async ({ page }) => {
    await page.goto('/');

    const mixedShortCodeInput = [
      `${SHORT_CODE_PREFIXES[0]}01A`,
      `${SHORT_CODE_PREFIXES[1]}01A`,
    ].join(',');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByPlaceholder('Enter labels').fill(mixedShortCodeInput);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[0]}01A`, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[1]}01A`, { exact: true }).first()).toBeVisible();
  });

  test('Back tab shows validation message for missing values', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'FOS/Bak Labels' }).click();
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toContainText('Please enter start bay, end bay, and select a last shelf.');
  });

  test('Back/FOS tab short code type selector generates Front Of Store compact codes', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'FOS/Bak Labels' }).click();
    await page.getByRole('radio', { name: 'FOS' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await page.getByRole('combobox', { name: 'Last Shelf' }).selectOption('B');
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[1]}01A`, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${SHORT_CODE_PREFIXES[1]}01B`, { exact: true }).first()).toBeVisible();
  });

  test('Aisle Labels generation updates the summary and invokes print', async ({ page }) => {
    await page.addInitScript(() => {
      (window as typeof window & { __printCalls?: number }).__printCalls = 0;
      window.print = () => {
        (window as typeof window & { __printCalls?: number }).__printCalls = ((window as typeof window & { __printCalls?: number }).__printCalls ?? 0) + 1;
      };
    });

    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('1');
    await page.getByRole('combobox', { name: 'Last Shelf' }).selectOption('A');

    await expect(page.getByText('Total labels: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    await page.getByRole('button', { name: 'Print Labels' }).click();
    await expect.poll(async () => page.evaluate(() => (window as typeof window & { __printCalls?: number }).__printCalls ?? 0)).toBe(1);
  });

  test('Mini SEL default route renders three-row layout for aisle values', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('1');
    await page.getByRole('combobox', { name: 'Last Shelf' }).selectOption('A');

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const firstLabelTile = page.locator('[class*="labelBox"]').first();
    await expect(firstLabelTile.getByText('01', { exact: true })).toBeVisible();
    await expect(firstLabelTile.getByText('L01', { exact: true })).toBeVisible();
    await expect(firstLabelTile.getByText('A', { exact: true })).toBeVisible();
    await expect(firstLabelTile.getByText('01 L01 A', { exact: true })).toHaveCount(0);
  });

  test('Mini SEL shelf-emphasis layout renders shelf and full spaced value lines', async ({ page }) => {
    await page.goto('/');
    await selectMiniVariant(page, 'mini-shelf-emphasis');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('1');
    await page.getByRole('combobox', { name: 'Last Shelf' }).selectOption('A');

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const firstLabelTile = page.locator('[class*="labelBox"]').first();
    await expect(firstLabelTile.getByText('A', { exact: true })).toBeVisible();
    await expect(firstLabelTile.getByText('01 L01 A', { exact: true })).toBeVisible();
  });

  test('Mini variant selection persists across reload', async ({ page }) => {
    await page.goto('/');
    await selectMiniVariant(page, 'mini-shelf-emphasis');

    await page.reload();

    await expect(page.getByLabel('Mini Variant')).toHaveValue('mini-shelf-emphasis');
  });

  test('Mini SEL shelf-emphasis PDF download keeps mini page contract stable', async ({ page }) => {
    await page.goto('/');
    await selectMiniVariant(page, 'mini-shelf-emphasis');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('1');
    await page.getByRole('combobox', { name: 'Last Shelf' }).selectOption('A');

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Download Labels' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Labels' }).click();
    const download = await downloadPromise;

    const filePath = await download.path();
    expect(filePath).not.toBeNull();

    const pdfBytes = await readFile(filePath as string);
    const contractSnapshot = buildPdfContractSnapshot(pdfBytes);

    expect(contractSnapshot.pageCount).toBe(1);
    expect(contractSnapshot.pageBoxes[0]?.orientation).toBe('landscape');
  });

  test('Large SEL mode is only available from Aisle tab', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await expect(page.getByLabel('Large SEL')).toHaveCount(0);

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();
    await expect(page.getByLabel('Large SEL')).toBeVisible();
    await expect(page.getByLabel('Mini SEL')).toBeVisible();
  });

  test('Aisle Large SEL preview remains visually stable for one full 8-label page', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1600 });
    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();
    await page.getByLabel('Large SEL').click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('2');
    await visibleInputs.nth(4).fill('1');
    await visibleInputs.nth(5).fill('2');
    await page.getByRole('combobox', { name: 'Last Shelf' }).selectOption('B');

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const labelAppRoot = page.locator('[class*="labelAppRoot"]').first();
    await labelAppRoot.evaluate((element) => {
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

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();
    await page.getByLabel('Large SEL').click();

    const visibleInputs = page.getByRole('textbox');
    await visibleInputs.nth(0).fill('1');
    await visibleInputs.nth(1).fill('1');
    await visibleInputs.nth(2).fill('1');
    await visibleInputs.nth(3).fill('2');
    await visibleInputs.nth(4).fill('1');
    await visibleInputs.nth(5).fill('2');
    await page.getByRole('combobox', { name: 'Last Shelf' }).selectOption('B');

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Download Labels' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Labels' }).click();
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

  test('Specific Labels download remains stable for regression snapshot', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByPlaceholder('Enter labels').fill('01L01A');
    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Download Labels' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Labels' }).click();
    const download = await downloadPromise;

    const filePath = await download.path();
    expect(filePath).not.toBeNull();

    const pdfBytes = await readFile(filePath as string);
    const contractSnapshot = buildPdfContractSnapshot(pdfBytes);

    expect(JSON.stringify(contractSnapshot, null, 2)).toMatchSnapshot('specific-download.contract.json');
  });

  test('Specific Labels download first page remains visually stable', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    const labelValues = Array.from({ length: 35 }, (_, index) => `01L${String(index + 1).padStart(2, '0')}A`).join(',');
    await page.getByPlaceholder('Enter labels').fill(labelValues);
    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Download Labels' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Labels' }).click();
    const download = await downloadPromise;

    const filePath = await download.path();
    expect(filePath).not.toBeNull();

    const pdfBytes = await readFile(filePath as string);
    const firstPagePng = await renderFirstPdfPageAsPng(page, pdfBytes);

    expect(firstPagePng).toMatchSnapshot('specific-download-first-page.visual.png');
  });

  test('captures Mini SEL shelf-emphasis aisle preview baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1400 });
    await page.goto('/');
    await selectMiniVariant(page, 'mini-shelf-emphasis');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();

    // Generate a range of aisle labels to show shelf-emphasis layout
    const labelValues = [
      '01L01A', '01L02A', '01L03A', '01L04A', '01L05A',
      '02L01A', '02L02A', '02L03A', '02L04A', '02L05A',
      '03L01A', '03L02A', '03L03A', '03L04A', '03L05A',
      '04L01A', '04L02A', '04L03A', '04L04A', '04L05A',
      '05L01A', '05L02A', '05L03A', '05L04A', '05L05A',
      '06L01A', '06L02A', '06L03A', '06L04A', '06L05A',
      '07L01A', '07L02A', '07L03A', '07L04A', '07L05A',
    ].join(',');
    
    await page.getByPlaceholder('Enter labels').fill(labelValues);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const labelAppRoot = page.locator('[class*="labelAppRoot"]').first();
    await labelAppRoot.evaluate((element) => {
      element.scrollLeft = 0;
    });

    const previewPage = page.locator('[class*="previewPage"]').first();
    await expect(previewPage).toHaveScreenshot('mini-sel-shelf-emphasis-aisle-preview.png', {
      animations: 'disabled',
    });
  });

  test('captures full preview of 35 labels with shelf-emphasis UI selection', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1400 });
    await page.goto('/');
    await selectMiniVariant(page, 'mini-shelf-emphasis');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();

    const labelValues = Array.from({ length: 35 }, (_, index) => `01L${String(index + 1).padStart(2, '0')}A`).join(',');
    await page.getByPlaceholder('Enter labels').fill(labelValues);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    const labelAppRoot = page.locator('[class*="labelAppRoot"]').first();
    await labelAppRoot.evaluate((element) => {
      element.scrollLeft = 0;
    });

    const previewPage = page.locator('[class*="previewPage"]').first();
    await expect(previewPage).toHaveScreenshot('default-mini-shelf-emphasis-35-labels.png', {
      animations: 'disabled',
    });
  });
});
