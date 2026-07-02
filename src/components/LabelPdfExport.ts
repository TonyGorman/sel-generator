import { PDF_EXPORT_SCALE, PDF_IMAGE_COMPRESSION } from '../config/labelConfig';
import {
  getEncodedLabelCode,
  getLargeSelDisplayParts,
  getMiniCompositionVariant,
  resolveMiniCompositionVariantId,
} from '../domain/labelCodeDomain';
import { ILabelLayoutStrategy } from '../models/ILabelLayoutStrategy';
import {
  estimatePrimaryTextWidthMm,
  fitMiniPrimaryFontSizeMm,
  getPdfBaselineFromCenterMm,
} from './labelLayoutGeometry';

const MM_TO_PT = 72 / 25.4;
const MM_TO_PX = 96 / 25.4;
const MINI_ENCODED_TEXT_SIZE_MM = 2.4;
const LARGE_ENCODED_TEXT_SIZE_MM = 3;
const ENCODED_TEXT_LETTER_SPACING_MM = 0.02;
const LARGE_SEL_PREFIX_GAP_MM = 0.8;
const LARGE_SEL_SUFFIX_GAP_MM = 1.5;
const MINI_AISLE_AUX_TEXT_GRAY = 74;
const PDF_PRIMARY_FONT = 'helvetica';

export type JsPdfInstance = {
  addPage: (size: [number, number], orientation: 'landscape' | 'portrait') => void;
  rect: (x: number, y: number, width: number, height: number) => void;
  setLineWidth: (width: number) => void;
  setDrawColor: (gray: number) => void;
  setTextColor: (gray: number) => void;
  setFont: (fontName: string, fontStyle: string) => void;
  setFontSize: (size: number) => void;
  setCharSpace: (spacing: number) => void;
  getTextWidth?: (text: string) => number;
  text: (text: string, x: number, y: number, options?: { align?: 'center' | 'left' | 'right' }) => void;
  addImage: (
    imageData: string,
    format: 'PNG',
    x: number,
    y: number,
    width: number,
    height: number,
    alias?: string,
    compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW',
  ) => void;
  save: (filename: string) => void;
};

export type JsBarcodeFn = (
  element: SVGElement,
  value: string,
  options: {
    format: 'CODE128' | 'CODE128B';
    displayValue: boolean;
    width: number;
    height: number;
    margin: number;
  },
) => void;

const mmToPt = (mm: number): number => mm * MM_TO_PT;
const mmToPx = (mm: number): number => mm * MM_TO_PX;

const getTextWidthMm = (pdf: JsPdfInstance, text: string, fontSizeMm: number): number => {
  if (!pdf.getTextWidth) {
    return estimatePrimaryTextWidthMm(text, fontSizeMm, 0);
  }

  return pdf.getTextWidth(text);
};

const setPdfBoldFont = (pdf: JsPdfInstance): void => {
  pdf.setFont(PDF_PRIMARY_FONT, 'bold');
};

const setPdfRegularFont = (pdf: JsPdfInstance): void => {
  pdf.setFont(PDF_PRIMARY_FONT, 'normal');
};

const drawVectorBarcode = async (
  pdf: JsPdfInstance,
  svg2pdf: (element: Element, doc: unknown, options: { x: number; y: number; width: number; height: number }) => Promise<unknown>,
  jsBarcode: JsBarcodeFn,
  barcodeValue: string,
  x: number,
  y: number,
  maxWidth: number,
  height: number,
  moduleWidthMm: number,
): Promise<void> => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  jsBarcode(svg, barcodeValue, {
    format: 'CODE128B',
    displayValue: false,
    width: mmToPx(moduleWidthMm),
    height: mmToPx(height),
    margin: 0,
  });

  // Preserve barcode aspect ratio so modules are not stretched wider than print output.
  const viewBox = svg.viewBox.baseVal;
  const sourceWidth = viewBox && viewBox.width > 0 ? viewBox.width : svg.getBoundingClientRect().width;
  const sourceHeight = viewBox && viewBox.height > 0 ? viewBox.height : svg.getBoundingClientRect().height;
  const aspectRatio = sourceWidth > 0 && sourceHeight > 0 ? sourceWidth / sourceHeight : 1;

  const targetWidth = Math.min(maxWidth, height * aspectRatio);
  const centeredX = x + (maxWidth - targetWidth) / 2;

  await svg2pdf(svg, pdf, { x: centeredX, y, width: targetWidth, height });
};

const drawLargeSelHeading = (
  pdf: JsPdfInstance,
  xCenter: number,
  topY: number,
  topAreaHeight: number,
  layoutStrategy: ILabelLayoutStrategy,
  code: string,
): void => {
  const { largePrefixTextSizeMm, largeMainTextSizeMm, largeSuffixTextSizeMm } = layoutStrategy.typography;
  const baselineOffsetFactor = layoutStrategy.typography.pdfTextBaselineOffsetFactor;
  const displayParts = getLargeSelDisplayParts(code);

  const mainBaselineY = topY + topAreaHeight / 2 + largeMainTextSizeMm * baselineOffsetFactor;

  if (!displayParts) {
    return;
  }

  const { prefix, main, suffix } = displayParts;

  setPdfBoldFont(pdf);
  pdf.setFontSize(mmToPt(largePrefixTextSizeMm));
  const prefixWidth = getTextWidthMm(pdf, prefix, largePrefixTextSizeMm);

  setPdfBoldFont(pdf);
  pdf.setFontSize(mmToPt(largeMainTextSizeMm));
  const mainWidth = getTextWidthMm(pdf, main, largeMainTextSizeMm);

  setPdfBoldFont(pdf);
  pdf.setFontSize(mmToPt(largeSuffixTextSizeMm));
  const suffixWidth = getTextWidthMm(pdf, suffix, largeSuffixTextSizeMm);

  const totalWidth = prefixWidth + LARGE_SEL_PREFIX_GAP_MM + mainWidth + LARGE_SEL_SUFFIX_GAP_MM + suffixWidth;
  const startX = xCenter - totalWidth / 2;

  const prefixBaselineY = topY + topAreaHeight / 2 + largePrefixTextSizeMm * baselineOffsetFactor;
  const suffixBaselineY = topY + topAreaHeight / 2 + largeSuffixTextSizeMm * baselineOffsetFactor;

  setPdfBoldFont(pdf);
  pdf.setFontSize(mmToPt(largePrefixTextSizeMm));
  pdf.text(prefix, startX, prefixBaselineY, { align: 'left' });

  setPdfBoldFont(pdf);
  pdf.setFontSize(mmToPt(largeMainTextSizeMm));
  pdf.text(main, startX + prefixWidth + LARGE_SEL_PREFIX_GAP_MM, mainBaselineY, { align: 'left' });

  setPdfBoldFont(pdf);
  pdf.setFontSize(mmToPt(largeSuffixTextSizeMm));
  pdf.text(
    suffix,
    startX + prefixWidth + LARGE_SEL_PREFIX_GAP_MM + mainWidth + LARGE_SEL_SUFFIX_GAP_MM,
    suffixBaselineY,
    { align: 'left' },
  );
};

interface IVectorTileContext {
  pdf: JsPdfInstance;
  code: string;
  x: number;
  y: number;
  layoutStrategy: ILabelLayoutStrategy;
  jsBarcode: JsBarcodeFn;
  svg2pdf: (element: Element, doc: unknown, options: { x: number; y: number; width: number; height: number }) => Promise<unknown>;
}

const drawMiniSelTile = async ({
  pdf,
  code,
  x,
  y,
  layoutStrategy,
  jsBarcode,
  svg2pdf,
}: IVectorTileContext): Promise<void> => {
  const { page, typography, barcodeGeometry } = layoutStrategy;
  const miniVariant = getMiniCompositionVariant(resolveMiniCompositionVariantId(layoutStrategy.mode));
  const composedMiniLabel = miniVariant.composeLabel(code);
  const miniGeometry = miniVariant.resolveGeometry(layoutStrategy);
  const encodedValue = composedMiniLabel.encodedBarcodeValue;

  const measurePdfPrimaryTextWidthMm = (text: string, fontSizeMm: number, letterSpacingMm: number): number => {
    if (!text) {
      return 0;
    }

    if (!pdf.getTextWidth) {
      return estimatePrimaryTextWidthMm(text, fontSizeMm, letterSpacingMm);
    }

    setPdfBoldFont(pdf);
    pdf.setFontSize(mmToPt(fontSizeMm));
    const glyphWidth = pdf.getTextWidth(text);
    const spacingWidth = Math.max(text.length - 1, 0) * letterSpacingMm;
    return glyphWidth + spacingWidth;
  };
  const fittedTypography = miniVariant.fitTypography(
    composedMiniLabel,
    layoutStrategy,
    miniGeometry,
    measurePdfPrimaryTextWidthMm,
  );
  const legacyPrimaryFitMm = fitMiniPrimaryFontSizeMm(
    composedMiniLabel.primaryLineText,
    layoutStrategy,
    measurePdfPrimaryTextWidthMm,
  );
  const primaryFontSizeMm = Math.min(
    fittedTypography.primaryTextSizeMm,
    miniGeometry.primaryMaxTextSizeMm,
    legacyPrimaryFitMm,
  );

  setPdfBoldFont(pdf);
  pdf.setFontSize(mmToPt(primaryFontSizeMm));
  pdf.setCharSpace(typography.primaryLetterSpacingMm);
  const primaryCenterFromTileTopMm = typography.tilePaddingTopMm + miniGeometry.primaryCenterFromContentTopMm;
  const primaryBaselineY = y + getPdfBaselineFromCenterMm(
    primaryCenterFromTileTopMm,
    primaryFontSizeMm,
    typography.pdfTextBaselineOffsetFactor,
  );
  pdf.text(composedMiniLabel.primaryLineText, x + page.labelWidthMm / 2, primaryBaselineY, { align: 'center' });

  const isThreeRow = composedMiniLabel.variantId === 'mini-three-row';
  const secondaryCenterFromContentTopMm = isThreeRow
    ? miniGeometry.secondaryCenterFromContentTopMm
    : (fittedTypography.secondaryCenterFromContentTopMm ?? miniGeometry.secondaryCenterFromContentTopMm);
  setPdfRegularFont(pdf);
  pdf.setFontSize(mmToPt(fittedTypography.secondaryTextSizeMm));
  pdf.setCharSpace(0);
  pdf.setTextColor(isThreeRow ? MINI_AISLE_AUX_TEXT_GRAY : 0);
  const topBaselineY = y + getPdfBaselineFromCenterMm(
    typography.tilePaddingTopMm + secondaryCenterFromContentTopMm,
    fittedTypography.secondaryTextSizeMm,
    typography.pdfTextBaselineOffsetFactor,
  );
  pdf.text(composedMiniLabel.secondaryLineText, x + page.labelWidthMm / 2, topBaselineY, { align: 'center' });
  if (isThreeRow && composedMiniLabel.tertiaryLineText) {
    const tertiaryTextSizeMm = fittedTypography.tertiaryTextSizeMm ?? fittedTypography.secondaryTextSizeMm;
    pdf.setFontSize(mmToPt(tertiaryTextSizeMm));
    const bottomBaselineY = y + getPdfBaselineFromCenterMm(
      typography.tilePaddingTopMm + (miniGeometry.tertiaryCenterFromContentTopMm ?? miniGeometry.secondaryCenterFromContentTopMm),
      tertiaryTextSizeMm,
      typography.pdfTextBaselineOffsetFactor,
    );
    pdf.text(composedMiniLabel.tertiaryLineText, x + page.labelWidthMm / 2, bottomBaselineY, { align: 'center' });
  }
  pdf.setTextColor(0);

  const barcodeY =
    y +
    page.labelHeightMm -
    typography.tilePaddingBottomMm -
    barcodeGeometry.marginBottomMm -
    barcodeGeometry.heightMm;
  const centeredBarcodeX = x + (page.labelWidthMm - barcodeGeometry.widthMm) / 2;
  await drawVectorBarcode(
    pdf,
    svg2pdf,
    jsBarcode,
    encodedValue,
    centeredBarcodeX,
    barcodeY,
    barcodeGeometry.widthMm,
    barcodeGeometry.heightMm,
    typography.barcodeModuleThicknessMm,
  );

  // Keep encoded payload visible under the barcode for print/download parity.
  setPdfBoldFont(pdf);
  pdf.setFontSize(mmToPt(MINI_ENCODED_TEXT_SIZE_MM));
  pdf.setCharSpace(ENCODED_TEXT_LETTER_SPACING_MM);
  pdf.text(
    encodedValue,
    x + page.labelWidthMm / 2,
    barcodeY +
    barcodeGeometry.heightMm +
    barcodeGeometry.marginBottomMm / 2 +
    MINI_ENCODED_TEXT_SIZE_MM * typography.pdfEncodedTextBaselineOffsetFactor,
    { align: 'center' },
  );
};

const drawLargeSelTile = async ({
  pdf,
  code,
  x,
  y,
  layoutStrategy,
  jsBarcode,
  svg2pdf,
}: IVectorTileContext): Promise<void> => {
  const { page, typography, barcodeGeometry } = layoutStrategy;
  const encodedValue = getEncodedLabelCode(code);
  const barcodeX = x + (page.labelWidthMm - barcodeGeometry.widthMm) / 2;
  const barcodeY =
    y +
    page.labelHeightMm -
    typography.tilePaddingBottomMm -
    barcodeGeometry.marginBottomMm -
    barcodeGeometry.heightMm;
  const topAreaStartY = y + typography.tilePaddingTopMm;
  const topAreaHeight = barcodeY - topAreaStartY;

  drawLargeSelHeading(
    pdf,
    x + page.labelWidthMm / 2,
    topAreaStartY,
    topAreaHeight,
    layoutStrategy,
    code,
  );

  await drawVectorBarcode(
    pdf,
    svg2pdf,
    jsBarcode,
    encodedValue,
    barcodeX,
    barcodeY,
    barcodeGeometry.widthMm,
    barcodeGeometry.heightMm,
    typography.barcodeModuleThicknessMm,
  );

  // Keep encoded payload visible under the barcode for print/download parity.
  setPdfBoldFont(pdf);
  pdf.setFontSize(mmToPt(LARGE_ENCODED_TEXT_SIZE_MM));
  pdf.setCharSpace(ENCODED_TEXT_LETTER_SPACING_MM);
  pdf.text(
    encodedValue,
    x + page.labelWidthMm / 2,
    barcodeY +
    barcodeGeometry.heightMm +
    barcodeGeometry.marginBottomMm / 2 +
    LARGE_ENCODED_TEXT_SIZE_MM * typography.pdfEncodedTextBaselineOffsetFactor,
    { align: 'center' },
  );
};

export const drawVectorPage = async (
  pdf: JsPdfInstance,
  pageItems: string[],
  layoutStrategy: ILabelLayoutStrategy,
  jsBarcode: JsBarcodeFn,
  svg2pdf: (element: Element, doc: unknown, options: { x: number; y: number; width: number; height: number }) => Promise<unknown>,
): Promise<void> => {
  const { page } = layoutStrategy;

  pdf.setLineWidth(0.2);
  pdf.setDrawColor(140);
  pdf.setTextColor(0);

  for (let index = 0; index < pageItems.length; index += 1) {
    const code = pageItems[index];
    const row = Math.floor(index / page.columns);
    const column = index % page.columns;

    const x = page.pagePadLeftMm + column * page.labelWidthMm;
    const y = page.pagePadTopMm + row * page.labelHeightMm;

    pdf.rect(x, y, page.labelWidthMm, page.labelHeightMm);
    const drawTile = layoutStrategy.tileLayout === 'large-heading' ? drawLargeSelTile : drawMiniSelTile;
    await drawTile({
      pdf,
      code,
      x,
      y,
      layoutStrategy,
      jsBarcode,
      svg2pdf,
    });
  }
};

export const drawRasterPage = async (
  pdf: JsPdfInstance,
  pageElement: HTMLElement,
  pageWidthMm: number,
  pageHeightMm: number,
): Promise<void> => {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(pageElement, {
    scale: PDF_EXPORT_SCALE,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });
  const imageData = canvas.toDataURL('image/png');
  pdf.addImage(imageData, 'PNG', 0, 0, pageWidthMm, pageHeightMm, undefined, PDF_IMAGE_COMPRESSION);
};
