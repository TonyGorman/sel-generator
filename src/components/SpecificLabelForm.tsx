import * as React from 'react';
import styles from './LabelApp.module.css';
import alertStyles from './Alert.module.css';
import shellStyles from './FormShell.module.css';
import LabelGenerator from './LabelGenerator';
import {
    SHORT_CODE_PREFIXES,
    MIN_AISLE_VALUE,
    MAX_AISLE_VALUE,
    MAX_BAY_VALUE,
    MAX_SHELF_LETTER,
    SPECIAL_AISLE_VALUES,
    LABEL_SOFT_LIMIT,
    LABEL_HARD_LIMIT,
} from '../config/labelConfig';
import {
    VALIDATION_MESSAGES,
    getLabelHardLimitMessage,
    getLabelSoftLimitMessage,
    getSpecificInvalidLabelMessage,
} from '../config/validationMessages';
import { Button, TextField } from './FormControls';
import { validateSpecificLabelCode } from '../domain/labelCodeDomain';
import { normalizeSpecificInputCodes } from '../domain/labelGenerationUseCases';

const SpecificLabelForm: React.FC = () => {
    const bayRangeText = `01-${MAX_BAY_VALUE.toString().padStart(2, '0')}`;
    const shelfRangeText = `A-${MAX_SHELF_LETTER}`;
    const namedAisleExamples = SPECIAL_AISLE_VALUES.join(', ');

    const [initLabelText, setLabelText] = React.useState("");
    const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [warningMessage, setWarningMessage] = React.useState<string | null>(null);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>):void => {
        setLabelText(e.target.value)
    }

    const isValidSpecificCode = (code: string): boolean => {
        const result = validateSpecificLabelCode(code, {
            minAisleValue: MIN_AISLE_VALUE,
            maxAisleValue: MAX_AISLE_VALUE,
            maxBayValue: MAX_BAY_VALUE,
            maxShelfLetter: MAX_SHELF_LETTER,
        });

        return result.ok;
    };

    const generateLabel = ():void => {
        const labelTexts = normalizeSpecificInputCodes(initLabelText);

        if (labelTexts.length === 0) {
            setErrorMessage(VALIDATION_MESSAGES.specificEmpty);
            setWarningMessage(null);
            setGeneratedLabels(null);
            return;
        }

        if (labelTexts.length > LABEL_HARD_LIMIT) {
            setErrorMessage(getLabelHardLimitMessage(LABEL_HARD_LIMIT));
            setWarningMessage(null);
            setGeneratedLabels(null);
            return;
        }

        const hasInvalidCode = labelTexts.some((code) => !isValidSpecificCode(code));
        if (hasInvalidCode) {
            setErrorMessage(getSpecificInvalidLabelMessage({
                backPrefix: SHORT_CODE_PREFIXES[0],
                frontPrefix: SHORT_CODE_PREFIXES[1],
                namedAisleExamples,
                bayRangeText,
                shelfRangeText,
            }));
            setWarningMessage(null);
            setGeneratedLabels(null);
            return;
        }

        setErrorMessage(null);
        setWarningMessage(labelTexts.length > LABEL_SOFT_LIMIT ? getLabelSoftLimitMessage(LABEL_SOFT_LIMIT) : null);
        setGeneratedLabels(labelTexts);
    }

    return (
        <div className={shellStyles.panel}>
            <h1 className={shellStyles.panelTitle}>Generate Specific Labels</h1>
            <p className={styles.sectionIntro}>Enter one label or a comma-separated list (for example: 01L01A, {SHORT_CODE_PREFIXES[0]}01A, {SHORT_CODE_PREFIXES[1]}01A, {SPECIAL_AISLE_VALUES[0]}). 
                <br/>Labels must have no spaces or dashes.
                <br/>Named aisle values without bay/shelf are supported: {namedAisleExamples}.
            </p>
            {errorMessage && (
                <div role="alert" aria-live="assertive" aria-atomic="true" className={alertStyles.alertError}>
                    <div><span>{errorMessage}</span></div>
                </div>
            )}
            {warningMessage && (
                <div role="status" aria-live="polite" aria-atomic="true" className={alertStyles.alertWarning}>
                    <div><span>{warningMessage}</span></div>
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
                        <LabelGenerator labelCodes={generatedLabels} layoutMode="mini-sel" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecificLabelForm;
