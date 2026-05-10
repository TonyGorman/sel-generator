import * as React from 'react';
import styles from './Barcode.module.css';
import BarcodeGenerator from './BarcodeGenerator';
import { IBarcodeConfig } from '../models/IBarcodeConfig';
import { MAX_AISLE_VALUE, MAX_BAY_VALUE, MAX_SHELF_VALUE, normalizeBackCodePrefix } from '../config/barcodeConfig';
import { Button, TextField } from './FormControls';

interface ISpecificBarcodeProps {
    config: IBarcodeConfig;
}

const SpecificBarcode: React.FC<ISpecificBarcodeProps> = ({ config }) => {
    const [initBarcodeText, setBarcodeText] = React.useState("");
    const [showBarcode, setShowBarcode] = React.useState<React.ReactElement>();
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>):void => {
        setBarcodeText(e.target.value)
    }

    const isShelfTokenValid = (token: string): boolean => {
        if (/^\d+$/.test(token)) {
            const numericShelf = Number(token);
            return numericShelf >= 1 && numericShelf <= MAX_SHELF_VALUE;
        }

        if (/^[A-Z]$/.test(token)) {
            const shelfIndex = token.charCodeAt(0) - 64;
            return shelfIndex >= 1 && shelfIndex <= MAX_SHELF_VALUE;
        }

        return false;
    };

    const isBoundedTwoDigitNumber = (value: string, max: number): boolean => {
        const numericValue = Number(value);
        return numericValue >= 1 && numericValue <= max;
    };

    const backCodePrefix = normalizeBackCodePrefix(config.backCodePrefix);

    const isValidSpecificCode = (code: string): boolean => {
        const normalizedCode = code.toUpperCase();

        const compactAisleMatch = normalizedCode.match(/^(\d{2})([A-Z])(\d{2})([A-Z0-9]+)$/);
        if (compactAisleMatch) {
            const [, aisle, , bay, shelf] = compactAisleMatch;
            return isBoundedTwoDigitNumber(aisle, MAX_AISLE_VALUE)
                && isBoundedTwoDigitNumber(bay, MAX_BAY_VALUE)
                && isShelfTokenValid(shelf);
        }

        const dashedAisleMatch = normalizedCode.match(/^(\d{2})-([A-Z])(\d{2})-([A-Z0-9]+)$/);
        if (dashedAisleMatch) {
            const [, aisle, , bay, shelf] = dashedAisleMatch;
            return isBoundedTwoDigitNumber(aisle, MAX_AISLE_VALUE)
                && isBoundedTwoDigitNumber(bay, MAX_BAY_VALUE)
                && isShelfTokenValid(shelf);
        }

        const compactBackMatch = normalizedCode.match(new RegExp(`^${backCodePrefix}(\\d{2})([A-Z0-9]+)$`));
        if (compactBackMatch) {
            const [, bay, shelf] = compactBackMatch;
            return isBoundedTwoDigitNumber(bay, MAX_BAY_VALUE) && isShelfTokenValid(shelf);
        }

        const dashedBackMatch = normalizedCode.match(new RegExp(`^${backCodePrefix}-(\\d{2})-([A-Z0-9]+)$`));
        if (dashedBackMatch) {
            const [, bay, shelf] = dashedBackMatch;
            return isBoundedTwoDigitNumber(bay, MAX_BAY_VALUE) && isShelfTokenValid(shelf);
        }

        return false;
    };

    const generateBarcode = ():void => {
        const barcodeTexts = initBarcodeText
            .split(',')
            .map((text) => text.trim().toUpperCase())
            .filter((text) => text.length > 0);

        if (barcodeTexts.length === 0) {
            setErrorMessage('Enter at least one barcode value.');
            return;
        }

        const hasInvalidCode = barcodeTexts.some((code) => !isValidSpecificCode(code));
        if (hasInvalidCode) {
            setErrorMessage(`Use valid codes only. Supported formats: 01L01A, 01-L01-A, ${backCodePrefix}01A, ${backCodePrefix}-01-A. Bay must be 01-99 and shelf must be 1-20 or A-T.`);
            return;
        }

        setErrorMessage(null);
        setShowBarcode(<BarcodeGenerator aisles={barcodeTexts} config={config} />)
    }

    return (
        <div className={styles.panel}>
            <h1 className={styles.panelTitle}>Generate Specific Barcodes</h1>
            <p className={styles.sectionIntro}>Enter one barcode or a comma-separated list without spaces (for example: FRF03A,FRF047).</p>
            {errorMessage && (
                <div role="alert" aria-live="assertive" aria-atomic="true" className={styles.alertError}>
                    <div><span>{errorMessage}</span></div>
                </div>
            )}

            <section className={styles.sectionBox}>
                <h2 className={styles.sectionTitle}>Barcode Input</h2>
                <div className={styles.formStack}>
                    <TextField
                        value={initBarcodeText}
                        placeholder="Enter barcodes"
                        onChange={onInputChange}
                    />
                    <p>Supported formats: 01L01A, 01-L01-A, {backCodePrefix}01A, {backCodePrefix}-01-A. Bay values must be 01-99 and shelves must be 1-20 or A-T.</p>
                </div>
            </section>

            <div className={styles.actionsRow}>
                <Button className={styles.generateButton} onClick={generateBarcode}>Generate Barcodes</Button>
            </div>

            <div className="App">
                <div>
                    {showBarcode}
                </div>

            </div>
        </div>
    );
};

export default SpecificBarcode;
