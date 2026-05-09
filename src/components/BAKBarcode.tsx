import * as React from 'react';
import styles from './AisleBarcode.module.scss';
import BarcodeGenerator from './BarcodeGenerator';
import { IBarcodeConfig } from '../models/IBarcodeConfig';
import { MAX_BAY_VALUE, MAX_SHELF_VALUE, getShelfTokenForConfig } from '../config/barcodeConfig';
import { Button, TextField } from './FormControls';

interface IBAKBarcodeProps {
    config: IBarcodeConfig;
}

const BAKBarcode: React.FC<IBAKBarcodeProps> = ({ config }) => {
    const [showBarcode, setShowBarcode] = React.useState<React.ReactElement>();
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [barcodeStruct, setBarcodeStruct] = React.useState({
        bay_start: null as number | null,
        bay_end: null as number | null,
        shelves: null as number | null,
    });

    const hasValue = (value: number | null): value is number => value !== null && Number.isInteger(value);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: string): void => {
        const inpVal = e.target.value.trim();
        const numericValue = inpVal === '' ? null : Number(inpVal);

        switch (type) {
            case 'bay_start':
                setBarcodeStruct((prevState) => ({ ...prevState, bay_start: numericValue }))
                break;
            case 'bay_end':
                setBarcodeStruct((prevState) => ({ ...prevState, bay_end: numericValue }))
                break;
            case 'shelves':
                setBarcodeStruct((prevState) => ({ ...prevState, shelves: numericValue }))
                break;
        }
    }

    const generateBarcodeText = (): string[] => {
        const barcodeTexts: string[] = [];

        if (!hasValue(barcodeStruct.bay_start) || !hasValue(barcodeStruct.bay_end) || !hasValue(barcodeStruct.shelves)) {
            return [];
        }

        for (let i = barcodeStruct.bay_start; i <= barcodeStruct.bay_end; i++) {
            for (let k = 0; k < barcodeStruct.shelves; k++) {
                const shelfToken = getShelfTokenForConfig(k, config.shelfStyle);
                const barcodeText = "BAK" + (i > 9 ? i : "0" + i) + shelfToken;
                barcodeTexts.push(barcodeText);
            }
        }

        return barcodeTexts;
    }

    const validateInput = (): string | null => {
        if (!hasValue(barcodeStruct.bay_start) || !hasValue(barcodeStruct.bay_end) || !hasValue(barcodeStruct.shelves)) {
            return 'Please enter start bay, end bay, and shelves using whole numbers.';
        }

        if (barcodeStruct.bay_start > barcodeStruct.bay_end) {
            return 'Start bay cannot be greater than end bay.';
        }

        if (barcodeStruct.bay_start < 1 || barcodeStruct.bay_end < 1) {
            return 'Bays must be between 1 and 99.';
        }

        if (barcodeStruct.bay_end > MAX_BAY_VALUE) {
            return 'Bays must be between 1 and 99.';
        }

        if (barcodeStruct.shelves < 1 || barcodeStruct.shelves > MAX_SHELF_VALUE) {
            return 'Shelves must be between 1 and 20.';
        }

        return null;
    }

    const generateBarcode = (): void => {
        const validationError = validateInput();
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        setErrorMessage(null);
        setShowBarcode(<BarcodeGenerator type='BAK' aisles={generateBarcodeText()} config={config} />)
    }

    return (
        <div className={styles.panel}>
            <h1 className={styles.panelTitle}>Generate BAK Barcodes</h1>
            <p>Set the start bay, end bay and the amount of shelves required.</p>
            <div className={styles.stackedSections}>
                <section className={styles.sectionBox}>
                    <h2 className={styles.sectionTitle}>Bay Range (1-99)</h2>
                    <div className={styles.twoFieldGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Start</label>
                            <TextField
                                value={barcodeStruct.bay_start?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'bay_start')}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>End</label>
                            <TextField
                                value={barcodeStruct.bay_end?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'bay_end')}
                            />
                        </div>
                    </div>
                </section>

                <section className={styles.sectionBox}>
                    <h2 className={styles.sectionTitle}>Shelves Per Bay (1-20)</h2>
                    <div className={styles.singleField}>
                        <TextField
                            value={barcodeStruct.shelves?.toString() ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'shelves')}
                        />
                    </div>
                </section>
            </div>

            <div className={styles.actionsRow}>
                <Button className={styles.generateButton} onClick={generateBarcode}>Generate BAK barcodes</Button>
            </div>

            {errorMessage && (
                <div role="alert" aria-live="assertive" aria-atomic="true" className={styles.alertError}>
                    <div><span>{errorMessage}</span></div>
                </div>
            )}

            <div className="App">
                <div>
                    {showBarcode}
                </div>

            </div>
        </div>
    );
};

export default BAKBarcode;
