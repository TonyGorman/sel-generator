import * as React from 'react';
import styles from './LabelApp.module.css';
import LabelGenerator from './LabelGenerator';
import { ILabelConfig } from '../models/ILabelConfig';
import { MAX_AISLE_VALUE, MAX_BAY_VALUE, MAX_SHELF_VALUE, normalizeBackCodePrefix } from '../config/labelConfig';
import { Button, TextField } from './FormControls';

interface ISpecificLabelFormProps {
    config: ILabelConfig;
}

const SpecificLabelForm: React.FC<ISpecificLabelFormProps> = ({ config }) => {
    const [initLabelText, setLabelText] = React.useState("");
    const [showLabel, setShowLabels] = React.useState<React.ReactElement>();
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>):void => {
        setLabelText(e.target.value)
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

    const generateLabel = ():void => {
        const labelTexts = initLabelText
            .split(',')
            .map((text) => text.trim().toUpperCase())
            .filter((text) => text.length > 0);

        if (labelTexts.length === 0) {
            setErrorMessage('Enter at least one label value.');
            return;
        }

        const hasInvalidCode = labelTexts.some((code) => !isValidSpecificCode(code));
        if (hasInvalidCode) {
            setErrorMessage(`Use valid label codes only. Supported formats: 01L01A, 01-L01-A, ${backCodePrefix}01A, ${backCodePrefix}-01-A. Bay must be 01-99 and shelf must be 1-20 or A-T.`);
            return;
        }

        setErrorMessage(null);
        setShowLabels(<LabelGenerator aisles={labelTexts} config={config} layoutMode="mini-sel" />)
    }

    return (
        <div className={styles.panel}>
            <h1 className={styles.panelTitle}>Generate Specific Labels</h1>
            <p className={styles.sectionIntro}>Enter one label or a comma-separated list without spaces (for example: 01L01A,01-L01-A).</p>
            {errorMessage && (
                <div role="alert" aria-live="assertive" aria-atomic="true" className={styles.alertError}>
                    <div><span>{errorMessage}</span></div>
                </div>
            )}

            <section className={styles.sectionBox}>
                <h2 className={styles.sectionTitle}>Label Input</h2>
                <div className={styles.formStack}>
                    <TextField
                        value={initLabelText}
                        placeholder="Enter labels"
                        onChange={onInputChange}
                    />
                    <p>Supported formats: 01L01A, 01-L01-A, {backCodePrefix}01A, {backCodePrefix}-01-A. Bay values must be 01-99 and shelves must be 1-20 or A-T.</p>
                </div>
            </section>

            <div className={styles.actionsRow}>
                <Button className={styles.generateButton} onClick={generateLabel}>Generate Labels</Button>
            </div>

            <div className="App">
                <div>
                    {showLabel}
                </div>

            </div>
        </div>
    );
};

export default SpecificLabelForm;
