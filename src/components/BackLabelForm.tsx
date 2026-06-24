import * as React from 'react';
import styles from './AisleLabelForm.module.css';
import alertStyles from './Alert.module.css';
import shellStyles from './FormShell.module.css';
import LabelGenerator from './LabelGenerator';
import {
    SHORT_CODE_PREFIXES,
    MIN_BAY_VALUE,
    MAX_BAY_VALUE,
    MAX_SHELF_LETTER,
    LABEL_SOFT_LIMIT,
    LABEL_HARD_LIMIT,
    formatTwoDigitValue,
} from '../config/labelConfig';
import { Button, RadioGroup, ShelfSelect, TextField } from './FormControls';
import { getLabelHardLimitMessage, getLabelSoftLimitMessage } from '../config/validationMessages';
import {
    generateShortLabelCodes,
    parseNumericInput,
    validateShortLabelInput,
} from '../domain/labelGeneration';

const SHORT_CODE_PREFIX_OPTIONS = SHORT_CODE_PREFIXES.map((prefix) => ({
    key: prefix,
    text: prefix,
}));

const BackLabelForm: React.FC = () => {
    const bayRangeText = `1-${MAX_BAY_VALUE}`;
    const shelfRangeText = `A-${MAX_SHELF_LETTER}`;
    const idPrefix = React.useId();

    const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [warningMessage, setWarningMessage] = React.useState<string | null>(null);
    const [labelStruct, setLabelStruct] = React.useState({
        bay_start: null as number | null,
        bay_end: null as number | null,
        shelves: null as string | null,
    });
    const [selectedShortCodePrefix, setSelectedShortCodePrefix] = React.useState<string>(SHORT_CODE_PREFIXES[0]);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'bay_start' | 'bay_end'): void => {
        const numericValue = parseNumericInput(e.target.value);

        switch (type) {
            case 'bay_start':
                setLabelStruct((prevState) => ({ ...prevState, bay_start: numericValue }))
                break;
            case 'bay_end':
                setLabelStruct((prevState) => ({ ...prevState, bay_end: numericValue }))
                break;
        }
    }

    const onShelfChange = (letter: string): void => {
        setLabelStruct((prevState) => ({ ...prevState, shelves: letter || null }));
    }

    const generateLabel = (): void => {
        const validationError = validateShortLabelInput(
            {
                ...labelStruct,
                prefix: selectedShortCodePrefix,
            },
            MIN_BAY_VALUE,
            MAX_BAY_VALUE,
        );
        if (validationError) {
            setErrorMessage(validationError);
            setWarningMessage(null);
            setGeneratedLabels(null);
            return;
        }

        const shelfCount = labelStruct.shelves ? labelStruct.shelves.charCodeAt(0) - 'A'.charCodeAt(0) + 1 : 0;
        const bayCount = (labelStruct.bay_end ?? 0) - (labelStruct.bay_start ?? 0) + 1;
        const totalLabels = bayCount * shelfCount;
        if (totalLabels > LABEL_HARD_LIMIT) {
            setErrorMessage(getLabelHardLimitMessage(LABEL_HARD_LIMIT));
            setWarningMessage(null);
            setGeneratedLabels(null);
            return;
        }

        setErrorMessage(null);
        setWarningMessage(totalLabels > LABEL_SOFT_LIMIT ? getLabelSoftLimitMessage(LABEL_SOFT_LIMIT) : null);
        setGeneratedLabels(
            generateShortLabelCodes(
                {
                    ...labelStruct,
                    prefix: selectedShortCodePrefix,
                },
                formatTwoDigitValue,
            ),
        );
    }

    return (
        <div className={shellStyles.panel}>
            <h1 className={shellStyles.panelTitle}>Generate FOS/BAK Labels</h1>
            <p className={styles.sectionIntro}>Choose BAK (Back Wall) or FOS (Front Of Store) using the prefix selector.
                <br/>Set the start bay, end bay and the last shelf required. 
                <br/>The barcode will <strong>always</strong> be encoded <strong>without</strong> spaces or dashes.
                </p>
            <div className={styles.stackedSections}>
                <section className={shellStyles.sectionBox}>
                    <h2 className={shellStyles.sectionTitle}>Prefix</h2>
                    <RadioGroup
                        name={`${idPrefix}-short-code-type`}
                        options={SHORT_CODE_PREFIX_OPTIONS}
                        selectedKey={selectedShortCodePrefix}
                        onChange={setSelectedShortCodePrefix}
                    />
                </section>

                <section className={shellStyles.sectionBox}>
                    <h2 className={shellStyles.sectionTitle}>Bay Range ({bayRangeText})</h2>
                    <div className={styles.twoFieldGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-bay-start`}>Start</label>
                            <TextField
                                id={`${idPrefix}-bay-start`}
                                value={labelStruct.bay_start?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'bay_start')}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-bay-end`}>End</label>
                            <TextField
                                id={`${idPrefix}-bay-end`}
                                value={labelStruct.bay_end?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'bay_end')}
                            />
                        </div>
                    </div>
                </section>

                <section className={shellStyles.sectionBox}>
                    <h2 className={shellStyles.sectionTitle}>Shelves Per Bay ({shelfRangeText})</h2>
                    <div className={styles.singleField}>
                        <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-shelves`}>Last Shelf</label>
                        <ShelfSelect
                            id={`${idPrefix}-shelves`}
                            value={labelStruct.shelves ?? ''}
                            onChange={onShelfChange}
                        />
                    </div>
                </section>
            </div>

            <div className={styles.actionsRow}>
                <Button className={styles.generateButton} onClick={generateLabel}>Generate Labels</Button>
            </div>

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

export default BackLabelForm;
