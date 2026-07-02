import { ILabelLayoutStrategy } from './ILabelLayoutStrategy';

export type MiniCompositionVariantId = 'mini-three-row' | 'mini-shelf-emphasis';

export interface IComposedMiniLabel {
  variantId: MiniCompositionVariantId;
  primaryLineText: string;
  secondaryLineText: string;
  tertiaryLineText?: string;
  fullSpacedValue: string;
  encodedBarcodeValue: string;
}

export interface IMiniVariantGeometry {
  primaryCenterFromContentTopMm: number;
  secondaryCenterFromContentTopMm: number;
  tertiaryCenterFromContentTopMm?: number;
  primaryMaxTextSizeMm: number;
  secondaryMaxTextSizeMm: number;
  tertiaryTextSizeMm?: number;
  barcodeTopFromTileTopMm: number;
}

export interface IMiniTypographyFitResult {
  primaryTextSizeMm: number;
  secondaryTextSizeMm: number;
  secondaryCenterFromContentTopMm?: number;
  tertiaryTextSizeMm?: number;
  primaryFontWeight: number;
  secondaryFontWeight: number;
}

export type MiniTextMeasureFn = (text: string, fontSizeMm: number, letterSpacingMm: number) => number;

export interface IMiniCompositionVariant {
  id: MiniCompositionVariantId;
  composeLabel: (code: string, shortCodePrefix?: string) => IComposedMiniLabel;
  resolveGeometry: (layoutStrategy: ILabelLayoutStrategy) => IMiniVariantGeometry;
  fitTypography: (
    composedLabel: IComposedMiniLabel,
    layoutStrategy: ILabelLayoutStrategy,
    geometry: IMiniVariantGeometry,
    measureText: MiniTextMeasureFn,
  ) => IMiniTypographyFitResult;
}
