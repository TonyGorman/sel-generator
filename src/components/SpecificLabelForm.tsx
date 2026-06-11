import * as React from 'react';
import styles from './LabelApp.module.css';
import alertStyles from './Alert.module.css';
import shellStyles from './FormShell.module.css';
import LabelGenerator from './LabelGenerator';
import {
    buildCompactLabelCodePattern,
    buildCompactBackCodePattern,
} from './labelCodePatterns';
import { ILabelConfig } from '../models/ILabelConfig';
import {
    MIN_AISLE_VALUE,
    MAX_AISLE_VALUE,
    MAX_BAY_VALUE,
    MAX_SHELF_VALUE,
    SPECIAL_AISLE_VALUES,
    normalizeSpecialAisleValue,
    normalizeBackCodePrefix,
} from '../config/labelConfig';
import { Button, TextField } from './FormControls';

interface ISpecificLabelFormProps {
    config: ILabelConfig;
    onOpenConfiguration: () => void;
}

const SpecificLabelForm: React.FC<ISpecificLabelFormProps> = ({ config, onOpenConfiguration }) => {
    const specialAisleValues = config.specialAisleValues ?? [...SPECIAL_AISLE_VALUES];
    const bayRangeText = `01-${MAX_BAY_VALUE.toString().padStart(2, '0')}`;
    const maxShelfLetter = MAX_SHELF_VALUE <= 26
        ? String.fromCharCode(64 + MAX_SHELF_VALUE)
        : 'Z';
    const shelfRangeText = `1-${MAX_SHELF_VALUE} or A-${maxShelfLetter}`;
    const namedAisleExamples = specialAisleValues.join(', ');

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

    const isBoundedTwoDigitNumber = (value: string, max: number, min: number = 1): boolean => {
        const numericValue = Number(value);
        return numericValue >= min && numericValue <= max;
    };

    const normalizeSpecificInput = (code: string): string => {
        return code.trim().toUpperCase();
    };

    const backCodePrefix = normalizeBackCodePrefix(config.backCodePrefix);
    const compactAislePattern = buildCompactLabelCodePattern();
    const compactBackPattern = buildCompactBackCodePattern(backCodePrefix);

    const isAisleTokenValid = (aisleToken: string): boolean => {
        if (/^\d{2}$/.test(aisleToken)) {
            return isBoundedTwoDigitNumber(aisleToken, MAX_AISLE_VALUE, MIN_AISLE_VALUE);
        }

        return false;
    };

    const isValidSpecificCode = (code: string): boolean => {
        const normalizedCode = code.toUpperCase();

        if (normalizeSpecialAisleValue(normalizedCode, specialAisleValues)) {
            return true;
        }

        const compactAisleMatch = normalizedCode.match(compactAislePattern);
        if (compactAisleMatch) {
            const [, aisleToken, , bay, shelf] = compactAisleMatch;
            return isAisleTokenValid(aisleToken)
                && isBoundedTwoDigitNumber(bay, MAX_BAY_VALUE)
                && isShelfTokenValid(shelf);
        }

        const compactBackMatch = normalizedCode.match(compactBackPattern);
        if (compactBackMatch) {
            const [, bay, shelf] = compactBackMatch;
            return isBoundedTwoDigitNumber(bay, MAX_BAY_VALUE) && isShelfTokenValid(shelf);
        }

        return false;
    };

    const generateLabel = ():void => {
        const labelTexts = initLabelText
            .split(',')
            .map((text) => normalizeSpecificInput(text))
            .filter((text) => text.length > 0);

        if (labelTexts.length === 0) {
            setErrorMessage('Enter at least one label value.');
            setGeneratedLabels(null);
            return;
        }

        const hasInvalidCode = labelTexts.some((code) => !isValidSpecificCode(code));
        if (hasInvalidCode) {
            setErrorMessage(`Use valid label codes only. Supported formats: 01L01A, ${backCodePrefix}01A, or named aisle values (${namedAisleExamples}) with no bay or shelf. Bay must be ${bayRangeText} and shelf must be ${shelfRangeText}.`);
            setGeneratedLabels(null);
            return;
        }

        setErrorMessage(null);
        setGeneratedLabels(labelTexts);
    }

    const handleConfigurationLinkClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
        event.preventDefault();
        onOpenConfiguration();
    };

    return (
        <div className={shellStyles.panel}>
            <h1 className={shellStyles.panelTitle}>Generate Specific Labels</h1>
            <p className={styles.sectionIntro}>Enter one label or a comma-separated list (for example: 01L01A, {backCodePrefix}01A, {SPECIAL_AISLE_VALUES[0]}). 
                <br/>Labels must be in compact format — no spaces or dashes.
                <br/>Named aisle values without bay/shelf are supported: {namedAisleExamples}.
                <br/>Back prefix and named aisle values can be changed in the <a href="#" onClick={handleConfigurationLinkClick}>configuration section</a>.
            </p>
            {errorMessage && (
                <div role="alert" aria-live="assertive" aria-atomic="true" className={alertStyles.alertError}>
                    <div><span>{errorMessage}</span></div>
                </div>
            )}

            <section className={shellStyles.sectionBox}>
                <h2 className={shellStyles.sectionTitle}>Label Input</h2>
                <div className={styles.formStack}>
                    <TextField
                        value={initLabelText}
                        placeholder="Enter labels"
                        onChange={onInputChange}
                    />
                    <p>Bay values must be {bayRangeText} and shelves must be {shelfRangeText}.</p>
                </div>
            </section>

            <div className={styles.actionsRow}>
                <Button className={styles.generateButton} onClick={generateLabel}>Generate Labels</Button>
            </div>

            {generatedLabels && (
                <div className="App">
                    <div>
                        <LabelGenerator type='Specific' aisles={generatedLabels} config={config} layoutMode="mini-sel" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecificLabelForm;
