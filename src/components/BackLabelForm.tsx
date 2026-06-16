import * as React from 'react';
import styles from './AisleLabelForm.module.css';
import alertStyles from './Alert.module.css';
import shellStyles from './FormShell.module.css';
import LabelGenerator from './LabelGenerator';
import {
    SHORT_CODE_PREFIXES,
    MAX_BAY_VALUE,
    MAX_SHELF_LETTER,
    formatTwoDigitValue,
} from '../config/labelConfig';
import { Button, RadioGroup, ShelfSelect, TextField } from './FormControls';

const SHORT_CODE_PREFIX_OPTIONS = SHORT_CODE_PREFIXES.map((prefix) => ({
    key: prefix,
    text: prefix,
}));

const BackLabelForm: React.FC = () => {
    const bayRangeText = `1-${MAX_BAY_VALUE}`;
    const shelfRangeText = `A-${MAX_SHELF_LETTER}`;
    const bayValidationMessage = `Bays must be between 1 and ${MAX_BAY_VALUE}.`;
    const idPrefix = React.useId();

    const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [labelStruct, setLabelStruct] = React.useState({
        bay_start: null as number | null,
        bay_end: null as number | null,
        shelves: null as string | null,
    });
    const [selectedShortCodePrefix, setSelectedShortCodePrefix] = React.useState<string>(SHORT_CODE_PREFIXES[0]);

    const hasValue = (value: number | null): value is number => value !== null && Number.isInteger(value);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: string): void => {
        const inpVal = e.target.value.trim();
        const numericValue = inpVal === '' || !/^\d+$/.test(inpVal) ? null : Number(inpVal);

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

    const generateLabelText = (): string[] => {
        const labelTexts: string[] = [];
        const shortCodePrefix = selectedShortCodePrefix;

        if (!hasValue(labelStruct.bay_start) || !hasValue(labelStruct.bay_end) || !labelStruct.shelves) {
            return [];
        }

        const shelfCount = labelStruct.shelves.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
        for (let i = labelStruct.bay_start; i <= labelStruct.bay_end; i++) {
            const bayText = formatTwoDigitValue(i);

            for (let k = 0; k < shelfCount; k++) {
                const shelfToken = String.fromCharCode('A'.charCodeAt(0) + k);
                const labelText = `${shortCodePrefix}${bayText}${shelfToken}`;
                labelTexts.push(labelText);
            }
        }

        return labelTexts;
    }

    const validateInput = (): string | null => {
        if (!hasValue(labelStruct.bay_start) || !hasValue(labelStruct.bay_end) || !labelStruct.shelves) {
            return 'Please enter start bay, end bay, and select a last shelf.';
        }

        if (labelStruct.bay_start > labelStruct.bay_end) {
            return 'Start bay cannot be greater than end bay.';
        }

        if (labelStruct.bay_start < 1 || labelStruct.bay_end < 1) {
            return bayValidationMessage;
        }

        if (labelStruct.bay_end > MAX_BAY_VALUE) {
            return bayValidationMessage;
        }

        return null;
    }

    const generateLabel = (): void => {
        const validationError = validateInput();
        if (validationError) {
            setErrorMessage(validationError);
            setGeneratedLabels(null);
            return;
        }

        setErrorMessage(null);
        setGeneratedLabels(generateLabelText());
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
