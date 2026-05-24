import * as React from 'react';
import styles from './AisleLabelForm.module.css';
import LabelGenerator from './LabelGenerator';
import { ILabelConfig } from '../models/ILabelConfig';
import { MAX_BAY_VALUE, MAX_SHELF_VALUE, formatTwoDigitValue, getShelfTokenForConfig, normalizeBackCodePrefix } from '../config/labelConfig';
import { Button, TextField } from './FormControls';

interface IBackLabelFormProps {
    config: ILabelConfig;
    onOpenConfiguration: () => void;
}

const BackLabelForm: React.FC<IBackLabelFormProps> = ({ config, onOpenConfiguration }) => {
    const bayRangeText = `1-${MAX_BAY_VALUE}`;
    const shelfRangeText = `1-${MAX_SHELF_VALUE}`;
    const bayValidationMessage = `Bays must be between 1 and ${MAX_BAY_VALUE}.`;
    const shelfValidationMessage = `Shelves must be between 1 and ${MAX_SHELF_VALUE}.`;
    const idPrefix = React.useId();

    const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [labelStruct, setLabelStruct] = React.useState({
        bay_start: null as number | null,
        bay_end: null as number | null,
        shelves: null as number | null,
    });

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
            case 'shelves':
                setLabelStruct((prevState) => ({ ...prevState, shelves: numericValue }))
                break;
        }
    }

    const generateLabelText = (): string[] => {
        const labelTexts: string[] = [];
        const backCodePrefix = normalizeBackCodePrefix(config.backCodePrefix);

        if (!hasValue(labelStruct.bay_start) || !hasValue(labelStruct.bay_end) || !hasValue(labelStruct.shelves)) {
            return [];
        }

        for (let i = labelStruct.bay_start; i <= labelStruct.bay_end; i++) {
            const bayText = formatTwoDigitValue(i);

            for (let k = 0; k < labelStruct.shelves; k++) {
                const shelfToken = getShelfTokenForConfig(k, config.shelfStyle);
                const labelText = `${backCodePrefix}${bayText}${shelfToken}`;
                labelTexts.push(labelText);
            }
        }

        return labelTexts;
    }

    const validateInput = (): string | null => {
        if (!hasValue(labelStruct.bay_start) || !hasValue(labelStruct.bay_end) || !hasValue(labelStruct.shelves)) {
            return 'Please enter start bay, end bay, and shelves using whole numbers.';
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

        if (labelStruct.shelves < 1 || labelStruct.shelves > MAX_SHELF_VALUE) {
            return shelfValidationMessage;
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

    const handleConfigurationLinkClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
        event.preventDefault();
        onOpenConfiguration();
    };

    return (
        <div className={styles.panel}>
            <h1 className={styles.panelTitle}>Generate Back Wall Labels</h1>
            <p className={styles.sectionIntro}>Set the start bay, end bay and the amount of shelves required for the back wall. 
                <br/>The barcode will <strong>always</strong> be encoded <strong>without</strong> spaces or dashes.</p>
                <p>The prefix can be customized in the{' '}
                    <a href="#" onClick={handleConfigurationLinkClick}>configuration section</a></p>
            <div className={styles.stackedSections}>
                <section className={styles.sectionBox}>
                    <h2 className={styles.sectionTitle}>Bay Range ({bayRangeText})</h2>
                    <div className={styles.twoFieldGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor={`${idPrefix}-bay-start`}>Start</label>
                            <TextField
                                id={`${idPrefix}-bay-start`}
                                value={labelStruct.bay_start?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'bay_start')}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel} htmlFor={`${idPrefix}-bay-end`}>End</label>
                            <TextField
                                id={`${idPrefix}-bay-end`}
                                value={labelStruct.bay_end?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'bay_end')}
                            />
                        </div>
                    </div>
                </section>

                <section className={styles.sectionBox}>
                    <h2 className={styles.sectionTitle}>Shelves Per Bay ({shelfRangeText})</h2>
                    <div className={styles.singleField}>
                        <label className={styles.fieldLabel} htmlFor={`${idPrefix}-shelves`}>Shelves</label>
                        <TextField
                            id={`${idPrefix}-shelves`}
                            value={labelStruct.shelves?.toString() ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'shelves')}
                        />
                    </div>
                </section>
            </div>

            <div className={styles.actionsRow}>
                <Button className={styles.generateButton} onClick={generateLabel}>Generate Labels</Button>
            </div>

            {errorMessage && (
                <div role="alert" aria-live="assertive" aria-atomic="true" className={styles.alertError}>
                    <div><span>{errorMessage}</span></div>
                </div>
            )}

            {generatedLabels && (
                <div className="App">
                    <div>
                        <LabelGenerator type='Back' aisles={generatedLabels} config={config} layoutMode="mini-sel" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BackLabelForm;
