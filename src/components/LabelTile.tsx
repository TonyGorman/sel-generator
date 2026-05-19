import * as React from 'react';
import Barcode from 'react-barcode';
import styles from './LabelApp.module.css';
import { ILabelConfig, PrimaryCodeFormat, SecondaryCodeFormat, ShelfStyle } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX, normalizeBackCodePrefix } from '../config/labelConfig';
import { DEFAULT_LABEL_PRINT_MODE, getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { LabelPrintMode } from '../models/ILabelLayoutStrategy';

const MM_TO_PX = 96 / 25.4;
const MINI_LABEL_HEIGHT_MM = 8;
const LARGE_LABEL_HEIGHT_MM = 10;
const LABEL_MODULE_WIDTH_MM = 0.23;

const mmToPx = (mm: number): number => mm * MM_TO_PX;

const convertShelfTokenToNumber = (token: string): string => {
  if (/^\d+$/.test(token)) {
    return String(Number(token));
  }

  if (/^[A-Z]$/i.test(token)) {
    return String(token.toUpperCase().charCodeAt(0) - 64);
  }

  return token;
};

const convertShelfTokenToLetter = (token: string): string => {
  if (/^\d+$/.test(token)) {
    const numericValue = Number(token);
    if (numericValue >= 1 && numericValue <= 26) {
      return String.fromCharCode(64 + numericValue);
    }
  }

  if (/^[A-Z]$/i.test(token)) {
    return token.toUpperCase();
  }

  return token;
};

const formatShelfToken = (token: string, shelfStyle: ShelfStyle): string => {
  return shelfStyle === 'number' ? convertShelfTokenToNumber(token) : convertShelfTokenToLetter(token);
};

const AISLE_CODE_PATTERN = /^(\d{2})([A-Z])(\d{2})([A-Z0-9]+)$/;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildBackCodePattern = (backCodePrefix: string): RegExp => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  return new RegExp(`^${escapeRegExp(normalizedPrefix)}(\\d{2})([A-Z0-9]+)$`, 'i');
};

const parseAisleCode = (code: string): { zone: string; side: string; bay: string; shelf: string } | null => {
  const match = code.match(AISLE_CODE_PATTERN);
  if (!match) {
    return null;
  }

  const [, zone, side, bay, shelf] = match;
  return { zone, side, bay, shelf };
};

const parseBackCode = (code: string, backCodePrefix: string): { bay: string; shelf: string } | null => {
  const match = code.match(buildBackCodePattern(backCodePrefix));
  if (!match) {
    return null;
  }

  const [, bay, shelf] = match;
  return {
    bay,
    shelf,
  };
};

const getSecondaryDisplayValue = (_code: string, dashedCode: string, secondaryCodeFormat: SecondaryCodeFormat, _type?: string): string => {
  const rawSecondaryDisplayValue = secondaryCodeFormat === 'spaces' ? dashedCode.replace(/-/g, ' ') : dashedCode;
  return rawSecondaryDisplayValue;
};

const parseDashedBackCode = (parts: string[], backCodePrefix: string, type?: string): { bay: string; shelf: string } | null => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  if (!(type === 'Back' || parts[0].toUpperCase() === normalizedPrefix)) {
    return null;
  }

  if (parts.length < 3) {
    return null;
  }

  const bay = parts[1];
  const shelf = parts[parts.length - 1];

  if (!/^\d{2}$/.test(bay)) {
    return null;
  }

  return { bay, shelf };
};

const DASHED_AISLE_CODE_PATTERN = /^(\d{2})-([A-Z])(\d{2})-([A-Z0-9]+)$/i;

const normalizeSeparatorsForEncoding = (code: string): string => {
  return code.replace(/ /g, '-');
};

const tryEncodeDashedAisleCode = (dashedCode: string): string | null => {
  const dashedAisleMatch = dashedCode.match(DASHED_AISLE_CODE_PATTERN);
  if (!dashedAisleMatch) {
    return null;
  }

  const [, zone, side, bay, shelf] = dashedAisleMatch;
  return `${zone}${side.toUpperCase()}${bay}${shelf.toUpperCase()}`;
};

const tryEncodeDashedBackCode = (dashedCode: string, backCodePrefix: string): string | null => {
  const dashedBackPattern = new RegExp(`^${escapeRegExp(backCodePrefix)}-(\\d{2})-([A-Z0-9]+)$`, 'i');
  const dashedBackMatch = dashedCode.match(dashedBackPattern);
  if (!dashedBackMatch) {
    return null;
  }

  const [, bay, shelf] = dashedBackMatch;
  return `${backCodePrefix}${bay}${shelf.toUpperCase()}`;
};

export const getDashedLabelCode = (code: string, type?: string, backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX): string => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);

  if (code.includes('-')) {
    return code;
  }

  const aisleCode = parseAisleCode(code);
  if (aisleCode) {
    const { zone, side, bay, shelf } = aisleCode;
    return `${zone}-${side}${bay}-${shelf}`;
  }

  const backCode = parseBackCode(code, normalizedPrefix);
  if (backCode) {
    const { bay, shelf } = backCode;
    return `${normalizedPrefix}-${bay}-${shelf}`;
  }

  if (type === 'Back') {
    const fallbackBackCode = parseBackCode(code, normalizedPrefix);
    if (fallbackBackCode) {
      const { bay, shelf } = fallbackBackCode;
      return `${normalizedPrefix}-${bay}-${shelf}`;
    }

    const prefixLength = normalizedPrefix.length;

    return `${code.slice(0, prefixLength)}-${code.slice(prefixLength, prefixLength + 2)}-${code.slice(prefixLength + 2)}`;
  }

  if (code.length === 6) {
    return `${code.slice(0, 2)}-${code.slice(2, 5)}-${code.slice(5)}`;
  }

  return code;
};

export const getEncodedLabelCode = (code: string, type?: string, backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX): string => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const normalizedCode = normalizeSeparatorsForEncoding(code);
  const dashedCode = getDashedLabelCode(normalizedCode, type, normalizedPrefix);

  const encodedAisleCode = tryEncodeDashedAisleCode(dashedCode);
  if (encodedAisleCode) {
    return encodedAisleCode;
  }

  const encodedBackCode = tryEncodeDashedBackCode(dashedCode, normalizedPrefix);
  if (encodedBackCode) {
    return encodedBackCode;
  }

  return dashedCode;
};

export const getPrimaryLabelText = (
  code: string,
  primaryCodeFormat: PrimaryCodeFormat,
  shelfStyle: ShelfStyle,
  secondaryCodeFormat: SecondaryCodeFormat,
  type?: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
): { primary: string; secondary: string } => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const dashedCode = getDashedLabelCode(code, type, normalizedPrefix);
  const secondaryDisplayValue = getSecondaryDisplayValue(code, dashedCode, secondaryCodeFormat, type);

  if (code.includes('-')) {
    const parts = code.split('-');

    const dashedBackCode = parseDashedBackCode(parts, normalizedPrefix, type);
    if (dashedBackCode) {
      const { bay, shelf } = dashedBackCode;
      return {
        primary: primaryCodeFormat === 'shelfOnly' ? formatShelfToken(shelf, shelfStyle) : `${normalizedPrefix}${bay}`,
        secondary: secondaryDisplayValue,
      };
    }

    if (parts.length >= 3) {
      const shelfToken = parts[parts.length - 1];
      return {
        primary: primaryCodeFormat === 'shelfOnly' ? formatShelfToken(shelfToken, shelfStyle) : parts.slice(1, -1).join('-'),
        secondary: secondaryDisplayValue,
      };
    }
  }

  const aisleCode = parseAisleCode(code);
  if (aisleCode) {
    const { side, bay, shelf } = aisleCode;
    return {
      primary: primaryCodeFormat === 'shelfOnly' ? formatShelfToken(shelf, shelfStyle) : `${side}${bay}`,
      secondary: secondaryDisplayValue,
    };
  }

  const backCode = parseBackCode(code, normalizedPrefix);
  if (backCode) {
    const { bay, shelf } = backCode;
    return {
      primary: primaryCodeFormat === 'shelfOnly' ? formatShelfToken(shelf, shelfStyle) : `${normalizedPrefix}${bay}`,
      secondary: secondaryDisplayValue,
    };
  }

  if (type === 'Back') {
    const fallbackBackCode = parseBackCode(code, normalizedPrefix);
    if (fallbackBackCode) {
      const { bay, shelf } = fallbackBackCode;
      return {
        primary: primaryCodeFormat === 'shelfOnly' ? formatShelfToken(shelf, shelfStyle) : `${normalizedPrefix}${bay}`,
        secondary: secondaryDisplayValue,
      };
    }

    const prefixLength = normalizedPrefix.length;
    const bayToken = code.slice(prefixLength, prefixLength + 2);
    const shelfToken = code.slice(prefixLength + 2);

    return {
      primary: primaryCodeFormat === 'shelfOnly' ? formatShelfToken(shelfToken, shelfStyle) : `${normalizedPrefix}${bayToken}`,
      secondary: secondaryDisplayValue,
    };
  }

  if (code.length === 6) {
    return {
      primary: primaryCodeFormat === 'shelfOnly' ? formatShelfToken(code.slice(5), shelfStyle) : code.slice(2, 5),
      secondary: secondaryDisplayValue,
    };
  }

  return {
    primary: code,
    secondary: secondaryDisplayValue,
  };
};

export interface ILargeLabelDisplayParts {
  prefix: string;
  main: string;
  suffix: string;
}

export const getLargeSelDisplayParts = (
  code: string,
  type?: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
): ILargeLabelDisplayParts | null => {
  const dashedCode = getDashedLabelCode(code, type, backCodePrefix);
  const dashedAisleMatch = dashedCode.match(/^(\d{2})-([A-Z]\d{2})-([A-Z0-9]+)$/);

  if (dashedAisleMatch) {
    const [, aisle, sideBay, shelf] = dashedAisleMatch;
    return {
      prefix: `${aisle}-`,
      main: sideBay,
      suffix: `-${shelf}`,
    };
  }

  return null;
};

interface ILabelTileProps {
  code: string;
  config: ILabelConfig;
  type?: string;
  layoutMode?: LabelPrintMode;
}

const LabelTile: React.FC<ILabelTileProps> = ({ code, config, type, layoutMode = DEFAULT_LABEL_PRINT_MODE }) => {
  const layoutStrategy = getLabelLayoutStrategy(layoutMode);
  const { primary, secondary } = getPrimaryLabelText(
    code,
    config.primaryCodeFormat,
    config.shelfStyle,
    config.secondaryCodeFormat,
    type,
    config.backCodePrefix,
  );
  const labelValue = getEncodedLabelCode(code, type, config.backCodePrefix);
  const largeDisplayParts = getLargeSelDisplayParts(code, type, config.backCodePrefix);
  const isLargeSel = layoutMode === 'large-sel';

  return (
    <div className={isLargeSel ? styles.labelBoxLargeSel : styles.labelBox}>
      <div className={isLargeSel ? styles.largeSelLabelTextArea : styles.labelText}>
        {isLargeSel ? (
          <div className={styles.largeSelHeading}>
            {largeDisplayParts ? (
              <>
                <span className={styles.largeSelHeadingPrefix}>{largeDisplayParts.prefix}</span>
                <span className={styles.largeSelHeadingMain}>{largeDisplayParts.main}</span>
                <span className={styles.largeSelHeadingSuffix}>{largeDisplayParts.suffix}</span>
              </>
            ) : (
              <span className={styles.largeSelHeadingFallback}>{secondary}</span>
            )}
          </div>
        ) : (
          <>
            <div className={styles.primaryCode}>{primary}</div>
            <div className={styles.secondaryCode}>{secondary}</div>
          </>
        )}
      </div>
      <div className={isLargeSel ? styles.barcodeGraphicLargeSel : styles.barcodeGraphic}>
        <Barcode
          value={labelValue}
          format="CODE128B"
          displayValue={false}
          width={mmToPx(layoutStrategy.typography.barcodeModuleThicknessMm)}
          height={mmToPx(layoutStrategy.typography.barcodeHeightMm)}
          margin={0}
        />
      </div>
    </div>
  );
};

export default LabelTile;
