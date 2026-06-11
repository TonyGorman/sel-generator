import { PDF_EXPORT_SCALE, PDF_IMAGE_COMPRESSION } from '../config/labelConfig';
import { getEncodedLabelCode, getLargeSelDisplayParts, getPrimaryLabelText } from '../domain/labelCodeDomain';
import { ILabelLayoutStrategy } from '../models/ILabelLayoutStrategy';
import { ILabelGenerator } from '../models/ILabelGenerator';
import { estimatePrimaryTextWidthMm, fitMiniPrimaryFontSizeMm, getPdfBaselineFromCenterMm } from './labelLayoutGeometry';

const MM_TO_PT = 72 / 25.4;
const MM_TO_PX = 96 / 25.4;
const MINI_ENCODED_TEXT_SIZE_MM = 2.4;
const LARGE_ENCODED_TEXT_SIZE_MM = 3;
const ENCODED_TEXT_LETTER_SPACING_MM = 0.02;
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
  secondary: string,
  xCenter: number,
  topY: number,
  topAreaHeight: number,
  layoutStrategy: ILabelLayoutStrategy,
  code: string,
  backCodePrefix: string,
  specialAisleValues?: readonly string[],
): void => {
  const { largePrefixTextSizeMm, largeMainTextSizeMm, largeSuffixTextSizeMm } = layoutStrategy.typography;
  const baselineOffsetFactor = layoutStrategy.typography.pdfTextBaselineOffsetFactor;
  const displayParts = getLargeSelDisplayParts(code, backCodePrefix, specialAisleValues);

  const mainBaselineY = topY + topAreaHeight / 2 + largeMainTextSizeMm * baselineOffsetFactor;

  if (!displayParts) {
    setPdfBoldFont(pdf);
    pdf.setFontSize(mmToPt(largeMainTextSizeMm));
    pdf.text(secondary, xCenter, mainBaselineY, { align: 'center' });
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

  const totalWidth = prefixWidth + mainWidth + suffixWidth;
  const startX = xCenter - totalWidth / 2;

  const prefixBaselineY = topY + topAreaHeight / 2 + largePrefixTextSizeMm * baselineOffsetFactor;
  const suffixBaselineY = topY + topAreaHeight / 2 + largeSuffixTextSizeMm * baselineOffsetFactor;

  setPdfBoldFont(pdf);
  pdf.setFontSize(mmToPt(largePrefixTextSizeMm));
  pdf.text(prefix, startX, prefixBaselineY, { align: 'left' });

  setPdfBoldFont(pdf);
  pdf.setFontSize(mmToPt(largeMainTextSizeMm));
  pdf.text(main, startX + prefixWidth, mainBaselineY, { align: 'left' });

  setPdfBoldFont(pdf);
  pdf.setFontSize(mmToPt(largeSuffixTextSizeMm));
  pdf.text(suffix, startX + prefixWidth + mainWidth, suffixBaselineY, { align: 'left' });
};

export const drawVectorPage = async (
  pdf: JsPdfInstance,
  pageItems: string[],
  config: ILabelGenerator['config'],
  layoutStrategy: ILabelLayoutStrategy,
  jsBarcode: JsBarcodeFn,
  svg2pdf: (element: Element, doc: unknown, options: { x: number; y: number; width: number; height: number }) => Promise<unknown>,
): Promise<void> => {
  const { page, typography } = layoutStrategy;
  const { barcodeGeometry } = layoutStrategy;

  pdf.setLineWidth(0.2);
  pdf.setDrawColor(140);
  pdf.setTextColor(0);

  for (let index = 0; index < pageItems.length; index += 1) {
    const code = pageItems[index];
    const row = Math.floor(index / page.columns);
    const column = index % page.columns;

    const x = page.pagePadLeftMm + column * page.labelWidthMm;
    const y = page.pagePadTopMm + row * page.labelHeightMm;

    const { primary, secondary } = getPrimaryLabelText(
      code,
      config.backCodePrefix,
      config.specialAisleValues,
    );

    pdf.rect(x, y, page.labelWidthMm, page.labelHeightMm);
    const encodedValue = getEncodedLabelCode(code, config.backCodePrefix, config.specialAisleValues);

    if (layoutStrategy.mode === 'large-sel') {
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
        secondary,
        x + page.labelWidthMm / 2,
        topAreaStartY,
        topAreaHeight,
        layoutStrategy,
        code,
        config.backCodePrefix,
        config.specialAisleValues,
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

      continue;
    }

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
    const primaryFontSizeMm = fitMiniPrimaryFontSizeMm(primary, layoutStrategy, measurePdfPrimaryTextWidthMm);

    setPdfBoldFont(pdf);
    pdf.setFontSize(mmToPt(primaryFontSizeMm));
    pdf.setCharSpace(typography.primaryLetterSpacingMm);
    const primaryBaselineY = y + getPdfBaselineFromCenterMm(
      typography.primaryCenterFromTileTopMm,
      primaryFontSizeMm,
      typography.pdfTextBaselineOffsetFactor,
    );
    pdf.text(primary, x + page.labelWidthMm / 2, primaryBaselineY, { align: 'center' });

    setPdfBoldFont(pdf);
    pdf.setFontSize(mmToPt(typography.secondaryTextSizeMm));
    pdf.setCharSpace(0);
    pdf.text(secondary, x + page.labelWidthMm / 2, y + typography.secondaryBaselineFromTileTopMm, { align: 'center' });

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
