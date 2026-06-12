import * as React from 'react';
import styles from './LabelApp.module.css';
import alertStyles from './Alert.module.css';
import shellStyles from './FormShell.module.css';
import LabelGenerator from './LabelGenerator';
import { ILabelConfig } from '../models/ILabelConfig';
import {
    MIN_AISLE_VALUE,
    MAX_AISLE_VALUE,
    MAX_BAY_VALUE,
    MAX_SHELF_LETTER,
    SPECIAL_AISLE_VALUES,
    normalizeBackCodePrefix,
} from '../config/labelConfig';
import { Button, TextField } from './FormControls';
import { validateSpecificLabelCode } from '../domain/labelCodeDomain';

interface ISpecificLabelFormProps {
    config: ILabelConfig;
    onOpenConfiguration: () => void;
}

const SpecificLabelForm: React.FC<ISpecificLabelFormProps> = ({ config, onOpenConfiguration }) => {
    const specialAisleValues = config.specialAisleValues ?? [...SPECIAL_AISLE_VALUES];
    const bayRangeText = `01-${MAX_BAY_VALUE.toString().padStart(2, '0')}`;
    const shelfRangeText = `A-${MAX_SHELF_LETTER}`;
    const namedAisleExamples = specialAisleValues.join(', ');

    const [initLabelText, setLabelText] = React.useState("");
    const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>):void => {
        setLabelText(e.target.value)
    }

    const normalizeSpecificInput = (code: string): string => {
        return code.trim().toUpperCase();
    };

    const backCodePrefix = normalizeBackCodePrefix(config.backCodePrefix);

    const isValidSpecificCode = (code: string): boolean => {
        const result = validateSpecificLabelCode(code, {
            backCodePrefix,
            specialAisleValues,
            minAisleValue: MIN_AISLE_VALUE,
            maxAisleValue: MAX_AISLE_VALUE,
            maxBayValue: MAX_BAY_VALUE,
            maxShelfLetter: MAX_SHELF_LETTER,
        });

        return result.ok;
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
                <br/>Labels must have no spaces or dashes.
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
                        <LabelGenerator aisles={generatedLabels} config={config} layoutMode="mini-sel" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecificLabelForm;
