import * as React from 'react';
import Barcode from 'react-barcode';
import styles from './LabelApp.module.css';
import { DEFAULT_LABEL_PRINT_MODE, getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { ILabelLayoutStrategy, LabelPrintMode } from '../models/ILabelLayoutStrategy';
import {
  DEFAULT_MINI_COMPOSITION_VARIANT_ID,
  getLargeSelDisplayParts,
  getMiniCompositionVariant,
} from '../domain/labelCodeDomain';
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant';
import {
  estimatePrimaryTextWidthMm,
  fitMiniPrimaryFontSizeMm,
} from './labelLayoutGeometry';

const MM_TO_PX = 96 / 25.4;
const PRIMARY_TEXT_FONT_WEIGHT = 800;
const PRIMARY_TEXT_FONT_FAMILY = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const mmToPx = (mm: number): number => mm * MM_TO_PX;

const createPrimaryTextMeasureContext = (): CanvasRenderingContext2D | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const canvas = document.createElement('canvas');
  return canvas.getContext('2d');
};

let cachedMeasureContext: CanvasRenderingContext2D | null | undefined;

const getPrimaryTextMeasureContext = (): CanvasRenderingContext2D | null => {
  if (cachedMeasureContext === undefined) {
    cachedMeasureContext = createPrimaryTextMeasureContext();
  }

  return cachedMeasureContext;
};

const measurePrimaryTextWidthMm = (text: string, fontSizeMm: number, letterSpacingMm: number): number => {
  if (!text) {
    return 0;
  }

  const context = getPrimaryTextMeasureContext();
  if (!context) {
    return estimatePrimaryTextWidthMm(text, fontSizeMm, letterSpacingMm);
  }

  context.font = `${PRIMARY_TEXT_FONT_WEIGHT} ${mmToPx(fontSizeMm)}px ${PRIMARY_TEXT_FONT_FAMILY}`;
  const glyphWidthMm = context.measureText(text).width / MM_TO_PX;
  const spacingWidthMm = Math.max(text.length - 1, 0) * letterSpacingMm;

  return glyphWidthMm + spacingWidthMm;
};

export const getMiniPrimaryFontSizeMm = (primaryText: string, layoutStrategy: ILabelLayoutStrategy): number => {
  return fitMiniPrimaryFontSizeMm(primaryText, layoutStrategy, measurePrimaryTextWidthMm);
};
export {
  normalizeLabelCode,
  getEncodedLabelCode,
  getLargeSelDisplayParts,
} from '../domain/labelCodeDomain';

interface ILabelTileProps {
  code: string;
  layoutMode?: LabelPrintMode;
  miniVariantId?: MiniCompositionVariantId;
}

const DEFAULT_MINI_VARIANT_ID: MiniCompositionVariantId = DEFAULT_MINI_COMPOSITION_VARIANT_ID;

interface IMiniSelTileContentProps {
  primary: string;
  primaryFontSizeMm: number;
  primaryFontWeight?: number;
  primaryCenterFromContentTopMm: number;
}

const MiniSelTileContent: React.FC<IMiniSelTileContentProps> = ({
  primary,
  primaryFontSizeMm,
  primaryFontWeight,
  primaryCenterFromContentTopMm,
}) => {
  const primaryCodeStyle = {
    '--current-mini-primary-text-size-mm': `${primaryFontSizeMm}mm`,
    '--current-mini-primary-font-weight': String(primaryFontWeight ?? 800),
    '--current-mini-primary-center-from-content-top-mm': `${primaryCenterFromContentTopMm}mm`,
  } as React.CSSProperties;

  return (
    <div className={styles.primaryCode} style={primaryCodeStyle}>{primary}</div>
  );
};

interface IMiniSecondaryLineContentProps {
  text: string;
  centerFromContentTopMm: number;
  textSizeMm: number;
  fontWeight?: number;
}

const MiniSecondaryLineContent: React.FC<IMiniSecondaryLineContentProps> = ({
  text,
  centerFromContentTopMm,
  textSizeMm,
  fontWeight,
}) => {
  const secondaryLineStyle = {
    '--current-mini-secondary-center-from-content-top-mm': `${centerFromContentTopMm}mm`,
    '--current-mini-secondary-text-size-mm': `${textSizeMm}mm`,
    '--current-mini-secondary-font-weight': String(fontWeight ?? 700),
  } as React.CSSProperties;

  return (
    <div className={styles.miniShelfFullValue} style={secondaryLineStyle}>{text}</div>
  );
};

interface ILargeSelTileContentProps {
  code: string;
}

const LargeSelTileContent: React.FC<ILargeSelTileContentProps> = ({
  code,
}) => {
  const largeDisplayParts = getLargeSelDisplayParts(code);

  return (
    <div className={styles.largeSelHeading}>
      {largeDisplayParts ? (
        <>
          <span className={styles.largeSelHeadingPrefix}>{largeDisplayParts.prefix}</span>
          <span className={styles.largeSelHeadingMain}>{largeDisplayParts.main}</span>
          <span className={styles.largeSelHeadingSuffix}>{largeDisplayParts.suffix}</span>
        </>
      ) : null}
    </div>
  );
};

const LabelTile: React.FC<ILabelTileProps> = ({
  code,
  layoutMode = DEFAULT_LABEL_PRINT_MODE,
  miniVariantId = DEFAULT_MINI_VARIANT_ID,
}) => {
  const layoutStrategy = getLabelLayoutStrategy(layoutMode);
  const isLargeVariant = layoutStrategy.renderVariant === 'large';
  const selectedMiniVariant = getMiniCompositionVariant(miniVariantId);
  const initialComposedMiniLabel = selectedMiniVariant.composeLabel(code);
  const effectiveMiniVariant = initialComposedMiniLabel.variantId === selectedMiniVariant.id
    ? selectedMiniVariant
    : getMiniCompositionVariant(initialComposedMiniLabel.variantId);
  const composedMiniLabel = effectiveMiniVariant === selectedMiniVariant
    ? initialComposedMiniLabel
    : effectiveMiniVariant.composeLabel(code);
  const miniGeometry = effectiveMiniVariant.resolveGeometry(layoutStrategy);
  const fittedMiniTypography = effectiveMiniVariant.fitTypography(
    composedMiniLabel,
    layoutStrategy,
    miniGeometry,
    measurePrimaryTextWidthMm,
  );
  const primaryFontSizeMm = Math.min(fittedMiniTypography.primaryTextSizeMm, miniGeometry.primaryMaxTextSizeMm);
  const primaryCenterFromContentTopMm = miniGeometry.primaryCenterFromContentTopMm;
  const labelValue = composedMiniLabel.encodedBarcodeValue;
  const isThreeRowMini = composedMiniLabel.variantId === 'mini-three-row';

  return (
    <div className={isLargeVariant ? styles.labelBoxLargeSel : styles.labelBox}>
      <div className={isLargeVariant ? styles.largeSelLabelTextArea : styles.labelText}>
        {isLargeVariant ? (
          <LargeSelTileContent
            code={code}
          />
        ) : (
          <>
            <MiniSelTileContent
              primary={composedMiniLabel.primaryLineText}
              primaryFontSizeMm={primaryFontSizeMm}
              primaryFontWeight={fittedMiniTypography.primaryFontWeight}
              primaryCenterFromContentTopMm={primaryCenterFromContentTopMm}
            />
            {isThreeRowMini ? (
              <>
                <div
                  className={styles.miniAisleTopCode}
                  style={{
                    '--current-mini-aisle-top-center-from-content-top-mm': `${miniGeometry.secondaryCenterFromContentTopMm}mm`,
                    '--current-mini-aisle-aux-text-size-mm': `${fittedMiniTypography.secondaryTextSizeMm}mm`,
                  } as React.CSSProperties}
                >
                  {composedMiniLabel.secondaryLineText}
                </div>
                <div
                  className={styles.miniAisleBottomCode}
                  style={{
                    '--current-mini-aisle-bottom-center-from-content-top-mm': `${miniGeometry.tertiaryCenterFromContentTopMm ?? miniGeometry.secondaryCenterFromContentTopMm}mm`,
                    '--current-mini-aisle-aux-text-size-mm': `${fittedMiniTypography.tertiaryTextSizeMm ?? fittedMiniTypography.secondaryTextSizeMm}mm`,
                  } as React.CSSProperties}
                >
                  {composedMiniLabel.tertiaryLineText ?? ''}
                </div>
              </>
            ) : (
              <MiniSecondaryLineContent
                text={composedMiniLabel.secondaryLineText}
                centerFromContentTopMm={
                  fittedMiniTypography.secondaryCenterFromContentTopMm ?? miniGeometry.secondaryCenterFromContentTopMm
                }
                textSizeMm={fittedMiniTypography.secondaryTextSizeMm}
                fontWeight={fittedMiniTypography.secondaryFontWeight}
              />
            )}
          </>
        )}
      </div>
      <div className={isLargeVariant ? styles.barcodeGraphicLargeSel : styles.barcodeGraphic}>
        <Barcode
          value={labelValue}
          format="CODE128B"
          displayValue={false}
          width={mmToPx(layoutStrategy.typography.barcodeModuleThicknessMm)}
          height={mmToPx(layoutStrategy.typography.barcodeHeightMm)}
          margin={0}
        />
        <div className={isLargeVariant ? styles.encodedValueLargeSel : styles.encodedValue}>{labelValue}</div>
      </div>
    </div>
  );
};

export default LabelTile;
