import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Buffer } from 'buffer';
import { DEFAULT_BACK_CODE_PREFIX } from './testConstants';

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

test.describe('Label Generator regressions', () => {

  test('loads and shows primary tabs', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('tab', { name: 'Specific Labels' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Aisle Labels' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Back Wall Labels' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Configuration' })).toBeVisible();
  });

  test('Aisle configuration link navigates to configuration tab', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Aisle Labels' }).click();
    await page.getByRole('link', { name: 'configuration section' }).click();

    await expect(page.getByRole('heading', { name: 'Label Configuration' })).toBeVisible();
  });

  test('Specific Labels tab shows validation message for empty submission', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toContainText('Enter at least one label value.');
  });

  test('Specific Labels generation downloads a PDF export', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder('Enter labels').fill(`01L01A,${DEFAULT_BACK_CODE_PREFIX}01A`);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download Labels' })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Labels' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('labels.pdf');
  });

  test('Specific Labels accepts mixed compact, dashed, and spaced inputs', async ({ page }) => {
    await page.goto('/');

    const mixedInput = [
      '01L01A',
      '01-L02-A',
      '01 L03 A',
      `${DEFAULT_BACK_CODE_PREFIX}01A`,
      `${DEFAULT_BACK_CODE_PREFIX}-02-A`,
      `${DEFAULT_BACK_CODE_PREFIX} 03 A`,
    ].join(',');

    await page.getByRole('tab', { name: 'Specific Labels' }).click();
    await page.getByPlaceholder('Enter labels').fill(mixedInput);
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download Labels' })).toBeVisible();

    await expect(page.getByText('01L01A', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('01-L02-A', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('01 L03 A', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${DEFAULT_BACK_CODE_PREFIX}01A`, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${DEFAULT_BACK_CODE_PREFIX}-02-A`, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(`${DEFAULT_BACK_CODE_PREFIX} 03 A`, { exact: true }).first()).toBeVisible();
  });

  test('Back tab shows validation message for missing values', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('tab', { name: 'Back Wall Labels' }).click();
    await page.getByRole('button', { name: 'Generate Labels' }).click();

    await expect(page.getByRole('alert')).toContainText('Please enter start bay, end bay, and shelves using whole numbers.');
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
    await visibleInputs.nth(10).fill('1');

    await expect(page.getByText('Total labels: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Generate Labels' }).click();
    await expect(page.getByRole('button', { name: 'Print Labels' })).toBeVisible();

    await page.getByRole('button', { name: 'Print Labels' }).click();
    await expect.poll(async () => page.evaluate(() => (window as typeof window & { __printCalls?: number }).__printCalls ?? 0)).toBe(1);
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
    await visibleInputs.nth(10).fill('2');

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
    await visibleInputs.nth(10).fill('2');

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

  test('configuration tab preview tile renders at correct 39mm size', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Configuration' }).click();
    await expect(page.getByRole('heading', { name: 'Label Configuration' })).toBeVisible();

    const previewTile = page.locator('[class*="configExampleCard"]').first();
    await expect(previewTile).toHaveScreenshot('config-tab-preview-tile.png', {
      animations: 'disabled',
    });
  });

  test('captures full preview of 35 labels with default configuration', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1400 });
    await page.goto('/');

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
    await expect(previewPage).toHaveScreenshot('default-config-35-labels.png', {
      animations: 'disabled',
    });
  });
});
