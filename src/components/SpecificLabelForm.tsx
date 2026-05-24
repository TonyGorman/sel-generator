import * as React from 'react';
import styles from './LabelApp.module.css';
import LabelGenerator from './LabelGenerator';
import { ILabelConfig } from '../models/ILabelConfig';
import { MAX_AISLE_VALUE, MAX_BAY_VALUE, MAX_SHELF_VALUE, formatShelfTokenForStyle, normalizeBackCodePrefix } from '../config/labelConfig';
import { Button, TextField } from './FormControls';

interface ISpecificLabelFormProps {
    config: ILabelConfig;
    onOpenConfiguration: () => void;
}

const SpecificLabelForm: React.FC<ISpecificLabelFormProps> = ({ config, onOpenConfiguration }) => {
    const bayRangeText = `01-${MAX_BAY_VALUE.toString().padStart(2, '0')}`;
    const maxShelfLetter = MAX_SHELF_VALUE <= 26
        ? String.fromCharCode(64 + MAX_SHELF_VALUE)
        : 'Z';
    const shelfRangeText = `1-${MAX_SHELF_VALUE} or A-${maxShelfLetter}`;

    const [initLabelText, setLabelText] = React.useState("");
    const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null);
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

    const normalizeShelfTokenForConfig = (token: string): string => {
        return formatShelfTokenForStyle(token, config.shelfStyle);
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

    const normalizeSpecificCodeForConfig = (code: string): string => {
        const normalizedCode = code.toUpperCase();

        const compactAisleMatch = normalizedCode.match(/^(\d{2})([A-Z])(\d{2})([A-Z0-9]+)$/);
        if (compactAisleMatch) {
            const [, aisle, side, bay, shelf] = compactAisleMatch;
            return `${aisle}${side}${bay}${normalizeShelfTokenForConfig(shelf)}`;
        }

        const dashedAisleMatch = normalizedCode.match(/^(\d{2})-([A-Z])(\d{2})-([A-Z0-9]+)$/);
        if (dashedAisleMatch) {
            const [, aisle, side, bay, shelf] = dashedAisleMatch;
            return `${aisle}-${side}${bay}-${normalizeShelfTokenForConfig(shelf)}`;
        }

        const compactBackMatch = normalizedCode.match(new RegExp(`^${backCodePrefix}(\\d{2})([A-Z0-9]+)$`));
        if (compactBackMatch) {
            const [, bay, shelf] = compactBackMatch;
            return `${backCodePrefix}${bay}${normalizeShelfTokenForConfig(shelf)}`;
        }

        const dashedBackMatch = normalizedCode.match(new RegExp(`^${backCodePrefix}-(\\d{2})-([A-Z0-9]+)$`));
        if (dashedBackMatch) {
            const [, bay, shelf] = dashedBackMatch;
            return `${backCodePrefix}-${bay}-${normalizeShelfTokenForConfig(shelf)}`;
        }

        return normalizedCode;
    };

    const generateLabel = ():void => {
        const labelTexts = initLabelText
            .split(',')
            .map((text) => text.trim().toUpperCase())
            .filter((text) => text.length > 0);

        if (labelTexts.length === 0) {
            setErrorMessage('Enter at least one label value.');
            setGeneratedLabels(null);
            return;
        }

        const hasInvalidCode = labelTexts.some((code) => !isValidSpecificCode(code));
        if (hasInvalidCode) {
            setErrorMessage(`Use valid label codes only. Supported formats: 01L01A, 01-L01-A, ${backCodePrefix}01A, ${backCodePrefix}-01-A. Bay must be ${bayRangeText} and shelf must be ${shelfRangeText}.`);
            setGeneratedLabels(null);
            return;
        }

        const normalizedLabelTexts = labelTexts.map((code) => normalizeSpecificCodeForConfig(code));

        setErrorMessage(null);
        setGeneratedLabels(normalizedLabelTexts);
    }

    const handleConfigurationLinkClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
        event.preventDefault();
        onOpenConfiguration();
    };

    return (
        <div className={styles.panel}>
            <h1 className={styles.panelTitle}>Generate Specific Labels</h1>
            <p className={styles.sectionIntro}>Enter one label or a comma-separated list without spaces (for example: 01L01A,01-L01-A). 
                <br/>Regardless of what value you enter, the barcode itself will <strong>always</strong> be encoded <strong>without</strong> spaces or dashes. 
                <br/>Label formats can be changed in the <a href="#" onClick={handleConfigurationLinkClick}>configuration section</a>.
            </p>
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
                    <p>Supported formats: 01L01A, 01-L01-A, {backCodePrefix}01A, {backCodePrefix}-01-A. Bay values must be {bayRangeText} and shelves must be {shelfRangeText}.</p>
                </div>
            </section>

            <div className={styles.actionsRow}>
                <Button className={styles.generateButton} onClick={generateLabel}>Generate Labels</Button>
            </div>

            {generatedLabels && (
                <div className="App">
                    <div>
                        <LabelGenerator aisles={generatedLabels} config={config} layoutMode="mini-sel" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecificLabelForm;
