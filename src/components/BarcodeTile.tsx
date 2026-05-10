import * as React from 'react';
import Barcode from 'react-barcode';
import styles from './Barcode.module.css';
import { IBarcodeConfig, PrimaryCodeFormat, SecondaryCodeFormat, ShelfStyle } from '../models/IBarcodeConfig';
import { DEFAULT_BACK_CODE_PREFIX, normalizeBackCodePrefix } from '../config/barcodeConfig';

const MM_TO_PX = 96 / 25.4;
const BARCODE_HEIGHT_MM = 8;
const BARCODE_MODULE_WIDTH_MM = 0.23;

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

export const getDashedCode = (code: string, type?: string, backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX): string => {
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

export const getPrimaryText = (
  code: string,
  primaryCodeFormat: PrimaryCodeFormat,
  shelfStyle: ShelfStyle,
  secondaryCodeFormat: SecondaryCodeFormat,
  type?: string,
  backCodePrefix: string = DEFAULT_BACK_CODE_PREFIX,
): { primary: string; secondary: string } => {
  const normalizedPrefix = normalizeBackCodePrefix(backCodePrefix);
  const dashedCode = getDashedCode(code, type, normalizedPrefix);
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

interface IBarcodeTileProps {
  code: string;
  config: IBarcodeConfig;
  type?: string;
}

const BarcodeTile: React.FC<IBarcodeTileProps> = ({ code, config, type }) => {
  const { primary, secondary } = getPrimaryText(
    code,
    config.primaryCodeFormat,
    config.shelfStyle,
    config.secondaryCodeFormat,
    type,
    config.backCodePrefix,
  );
  const barcodeValue = getDashedCode(code, type, config.backCodePrefix);

  return (
    <div className={styles.barcodeBox}>
      <div className={styles.barcodeText}>
        <div className={styles.primaryCode}>{primary}</div>
        <div className={styles.secondaryCode}>{secondary}</div>
      </div>
      <div className={styles.barcodeGraphic}>
        <Barcode
          value={barcodeValue}
          format="CODE128"
          displayValue={false}
          width={mmToPx(BARCODE_MODULE_WIDTH_MM)}
          height={mmToPx(BARCODE_HEIGHT_MM)}
          margin={0}
        />
      </div>
    </div>
  );
};

export default BarcodeTile;