import { normalizeLabelCode, getEncodedLabelCode, getMiniThreeRowDisplayParts } from '../labelCodeDisplay';
import { IComposedMiniLabel, IMiniCompositionVariant, IMiniTypographyFitResult, IMiniVariantGeometry } from '../../models/IMiniCompositionVariant';
import { ILabelLayoutStrategy } from '../../models/ILabelLayoutStrategy';
import { fitMiniPrimaryFontSizeMm, getMiniAisleThreeRowGeometry, getMiniBarcodeTopFromTileTopMm } from '../../components/labelLayoutGeometry';

const MINI_THREE_ROW_AUX_FONT_WEIGHT = 600;

const composeMiniThreeRow = (code: string): IComposedMiniLabel => {
  const parts = getMiniThreeRowDisplayParts(code);

  return {
    variantId: 'mini-three-row',
    primaryLineText: parts.main,
    secondaryLineText: parts.top,
    tertiaryLineText: parts.bottom,
    fullSpacedValue: normalizeLabelCode(code),
    encodedBarcodeValue: getEncodedLabelCode(code),
  };
};

const resolveMiniThreeRowGeometry = (layoutStrategy: ILabelLayoutStrategy): IMiniVariantGeometry => {
  const threeRow = getMiniAisleThreeRowGeometry(layoutStrategy);

  return {
    primaryCenterFromContentTopMm: threeRow.mainCenterFromContentTopMm,
    secondaryCenterFromContentTopMm: threeRow.topCenterFromContentTopMm,
    tertiaryCenterFromContentTopMm: threeRow.bottomCenterFromContentTopMm,
    primaryMaxTextSizeMm: threeRow.mainMaxTextSizeMm,
    secondaryMaxTextSizeMm: threeRow.auxTextSizeMm,
    tertiaryTextSizeMm: threeRow.auxTextSizeMm,
    barcodeTopFromTileTopMm: getMiniBarcodeTopFromTileTopMm(layoutStrategy),
  };
};

const fitMiniThreeRowTypography = (
  composedLabel: IComposedMiniLabel,
  layoutStrategy: ILabelLayoutStrategy,
  geometry: IMiniVariantGeometry,
  measureText: (text: string, fontSizeMm: number, letterSpacingMm: number) => number,
): IMiniTypographyFitResult => {
  const primary = Math.min(
    fitMiniPrimaryFontSizeMm(composedLabel.primaryLineText, layoutStrategy, measureText),
    geometry.primaryMaxTextSizeMm,
  );

  return {
    primaryTextSizeMm: primary,
    secondaryTextSizeMm: geometry.secondaryMaxTextSizeMm,
    tertiaryTextSizeMm: geometry.tertiaryTextSizeMm,
    primaryFontWeight: 900,
    secondaryFontWeight: MINI_THREE_ROW_AUX_FONT_WEIGHT,
  };
};

export const miniThreeRowVariant: IMiniCompositionVariant = {
  id: 'mini-three-row',
  displayLabel: 'Stacked ABS',
  composeLabel: composeMiniThreeRow,
  resolveGeometry: resolveMiniThreeRowGeometry,
  fitTypography: fitMiniThreeRowTypography,
};
