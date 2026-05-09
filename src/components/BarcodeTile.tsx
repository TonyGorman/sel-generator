import * as React from 'react';
import Barcode from 'react-barcode';
import styles from './Barcode.module.scss';
import { IBarcodeConfig, PrimaryCodeFormat, SecondaryCodeFormat, ShelfStyle } from '../models/IBarcodeConfig';

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

export const getDashedCode = (code: string, type?: string): string => {
  if (code.includes('-')) {
    return code;
  }

  const aisleMatch = code.match(/^(\d{2})([A-Z])(\d{2})([A-Z0-9]+)$/);
  if (aisleMatch) {
    const [, zone, side, bay, shelf] = aisleMatch;
    return `${zone}-${side}${bay}-${shelf}`;
  }

  const bakMatch = code.match(/^BAK(\d{2})([A-Z0-9]+)$/);
  if (bakMatch) {
    const [, bay, shelf] = bakMatch;
    return `BAK-${bay}-${shelf}`;
  }

  if (type === 'BAK') {
    return `${code.slice(0, 3)}-${code.slice(3, 5)}-${code.slice(5)}`;
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
): { primary: string; secondary: string } => {
  const dashedCode = getDashedCode(code, type);
  const secondaryDisplayValue = secondaryCodeFormat === 'spaces' ? dashedCode.replace(/-/g, ' ') : dashedCode;

  if (code.includes('-')) {
    const parts = code.split('-');

    if (parts.length >= 3) {
      const shelfToken = parts[parts.length - 1];
      return {
        primary: primaryCodeFormat === 'shelfOnly' ? formatShelfToken(shelfToken, shelfStyle) : parts.slice(1, -1).join('-'),
        secondary: secondaryDisplayValue,
      };
    }
  }

  const aisleMatch = code.match(/^(\d{2})([A-Z])(\d{2})([A-Z0-9]+)$/);
  if (aisleMatch) {
    const [, zone, side, bay, shelf] = aisleMatch;
    return {
      primary: primaryCodeFormat === 'shelfOnly' ? formatShelfToken(shelf, shelfStyle) : `${side}${bay}`,
      secondary: secondaryDisplayValue,
    };
  }

  const bakMatch = code.match(/^BAK(\d{2})([A-Z0-9]+)$/);
  if (bakMatch) {
    const [, bay, shelf] = bakMatch;
    return {
      primary: primaryCodeFormat === 'shelfOnly' ? formatShelfToken(shelf, shelfStyle) : `BAK${bay}`,
      secondary: secondaryDisplayValue,
    };
  }

  if (type === 'BAK') {
    return {
      primary: primaryCodeFormat === 'shelfOnly' ? formatShelfToken(code.slice(5), shelfStyle) : code.slice(0, 5),
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
  const { primary, secondary } = getPrimaryText(code, config.primaryCodeFormat, config.shelfStyle, config.secondaryCodeFormat, type);
  const barcodeValue = getDashedCode(code, type);

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