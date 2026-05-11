import { PDF_EXPORT_SCALE, PDF_IMAGE_COMPRESSION } from '../config/barcodeConfig';
import { getDashedLabelCode, getLargeSelDisplayParts, getPrimaryLabelText } from './LabelTile';
import { ILabelLayoutStrategy } from '../models/ILabelLayoutStrategy';
import { IBarcodeGenerator } from '../models/IBarcodeGenerator';

const MM_TO_PT = 72 / 25.4;
const MM_TO_PX = 96 / 25.4;

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
    format: 'CODE128';
    displayValue: boolean;
    width: number;
    height: number;
    margin: number;
  },
) => void;

const mmToPt = (mm: number): number => mm * MM_TO_PT;
const mmToPx = (mm: number): number => mm * MM_TO_PX;

const estimateTextWidthMm = (text: string, fontSizeMm: number): number => {
  return text.length * fontSizeMm * 0.42;
};

const getTextWidthMm = (pdf: JsPdfInstance, text: string, fontSizeMm: number): number => {
  if (!pdf.getTextWidth) {
    return estimateTextWidthMm(text, fontSizeMm);
  }

  return pdf.getTextWidth(text);
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
    format: 'CODE128',
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
  type: string | undefined,
  backCodePrefix: string,
): void => {
  const { largePrefixTextSizeMm, largeMainTextSizeMm, largeSuffixTextSizeMm } = layoutStrategy.typography;
  const displayParts = getLargeSelDisplayParts(code, type, backCodePrefix);

  const mainBaselineY = topY + topAreaHeight / 2 + largeMainTextSizeMm * 0.34;

  if (!displayParts) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(mmToPt(largeMainTextSizeMm));
    pdf.text(secondary, xCenter, mainBaselineY, { align: 'center' });
    return;
  }

  const { prefix, main, suffix } = displayParts;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(mmToPt(largePrefixTextSizeMm));
  const prefixWidth = getTextWidthMm(pdf, prefix, largePrefixTextSizeMm);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(mmToPt(largeMainTextSizeMm));
  const mainWidth = getTextWidthMm(pdf, main, largeMainTextSizeMm);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(mmToPt(largeSuffixTextSizeMm));
  const suffixWidth = getTextWidthMm(pdf, suffix, largeSuffixTextSizeMm);

  const totalWidth = prefixWidth + mainWidth + suffixWidth;
  const startX = xCenter - totalWidth / 2;

  const prefixBaselineY = topY + topAreaHeight / 2 + largePrefixTextSizeMm * 0.34;
  const suffixBaselineY = topY + topAreaHeight / 2 + largeSuffixTextSizeMm * 0.34;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(mmToPt(largePrefixTextSizeMm));
  pdf.text(prefix, startX, prefixBaselineY, { align: 'left' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(mmToPt(largeMainTextSizeMm));
  pdf.text(main, startX + prefixWidth, mainBaselineY, { align: 'left' });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(mmToPt(largeSuffixTextSizeMm));
  pdf.text(suffix, startX + prefixWidth + mainWidth, suffixBaselineY, { align: 'left' });
};

export const drawVectorPage = async (
  pdf: JsPdfInstance,
  pageItems: string[],
  type: string | undefined,
  config: IBarcodeGenerator['config'],
  layoutStrategy: ILabelLayoutStrategy,
  jsBarcode: JsBarcodeFn,
  svg2pdf: (element: Element, doc: unknown, options: { x: number; y: number; width: number; height: number }) => Promise<unknown>,
): Promise<void> => {
  const { page, typography } = layoutStrategy;

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
      config.primaryCodeFormat,
      config.shelfStyle,
      config.secondaryCodeFormat,
      type,
      config.backCodePrefix,
    );

    pdf.rect(x, y, page.labelWidthMm, page.labelHeightMm);

    if (layoutStrategy.mode === 'large-sel') {
      const barcodeContainerWidth = (page.labelWidthMm - typography.tilePaddingHorizontalMm * 2) * typography.barcodeMaxWidthRatio;
      const barcodeX = x + (page.labelWidthMm - barcodeContainerWidth) / 2;
      const barcodeY = y + page.labelHeightMm - typography.tilePaddingBottomMm - typography.barcodeBottomMarginMm - typography.barcodeHeightMm;
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
        type,
        config.backCodePrefix,
      );

      await drawVectorBarcode(
        pdf,
        svg2pdf,
        jsBarcode,
        getDashedLabelCode(code, type, config.backCodePrefix),
        barcodeX,
        barcodeY,
        barcodeContainerWidth,
        typography.barcodeHeightMm,
        typography.barcodeModuleWidthMm,
      );
      continue;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(mmToPt(typography.primaryTextSizeMm));
    pdf.setCharSpace(typography.primaryLetterSpacingMm);
    pdf.text(primary, x + page.labelWidthMm / 2, y + typography.tilePaddingTopMm + typography.primaryBaselineFromContentTopMm, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(mmToPt(typography.secondaryTextSizeMm));
    pdf.setCharSpace(0);
    pdf.text(secondary, x + page.labelWidthMm / 2, y + typography.tilePaddingTopMm + typography.secondaryBaselineFromContentTopMm, { align: 'center' });

    const barcodeY = y + page.labelHeightMm - typography.tilePaddingBottomMm - typography.barcodeBottomMarginMm - typography.barcodeHeightMm;
    const barcodeWidth = (page.labelWidthMm - typography.tilePaddingHorizontalMm * 2) * typography.barcodeMaxWidthRatio;
    const centeredBarcodeX = x + (page.labelWidthMm - barcodeWidth) / 2;
    await drawVectorBarcode(
      pdf,
      svg2pdf,
      jsBarcode,
      getDashedLabelCode(code, type, config.backCodePrefix),
      centeredBarcodeX,
      barcodeY,
      barcodeWidth,
      typography.barcodeHeightMm,
      typography.barcodeModuleWidthMm,
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
