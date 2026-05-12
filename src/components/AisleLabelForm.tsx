import * as React from 'react';
import styles from './AisleBarcode.module.css';
import LabelGenerator from './LabelGenerator';
import { ILabelConfig } from '../models/ILabelConfig';
import { MAX_AISLE_VALUE, MAX_BAY_VALUE, MAX_SHELF_VALUE, getShelfTokenForConfig } from '../config/barcodeConfig';
import { Button, RadioGroup, RadioOption, TextField } from './FormControls';
import { LabelPrintMode } from '../models/ILabelLayoutStrategy';

interface IAisleBarcodeProps {
    config: ILabelConfig;
    onOpenConfiguration: () => void;
}

const AisleBarcode: React.FC<IAisleBarcodeProps> = ({ config, onOpenConfiguration }) => {
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [showBarcode, setShowBarcode] = React.useState<React.ReactElement>();
    const [labelPrintMode, setLabelPrintMode] = React.useState<LabelPrintMode>('mini-sel');
    const idPrefix = React.useId();
    const [barcodeStruct, setBarcodeStruct] = React.useState({
        aisle_start: null as number | null,
        aisle_end: null as number | null,
        lf_start: null as number | null,
        lf_end: null as number | null,
        ef_start: null as number | null,
        ef_end: null as number | null,
        rf_start: null as number | null,
        rf_end: null as number | null,
        ft_start: null as number | null,
        ft_end: null as number | null,
        shelves: null as number | null
    });


    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: string): void => {
        const inpVal = e.target.value.trim();
        const numericValue = inpVal === '' || !/^\d+$/.test(inpVal) ? null : Number(inpVal);

        switch (type) {
            case 'aisle_start':
                setBarcodeStruct((prevState) => ({ ...prevState, aisle_start: numericValue }));
                break;
            case 'aisle_end':
                setBarcodeStruct((prevState) => ({ ...prevState, aisle_end: numericValue }));
                break;
            case 'lf_start':
                setBarcodeStruct((prevState) => ({ ...prevState, lf_start: numericValue }));
                break;
            case 'lf_end':
                setBarcodeStruct((prevState) => ({ ...prevState, lf_end: numericValue }));
                break;
            case 'ef_start':
                setBarcodeStruct((prevState) => ({ ...prevState, ef_start: numericValue }));
                break;
            case 'ef_end':
                setBarcodeStruct((prevState) => ({ ...prevState, ef_end: numericValue }));
                break;
            case 'rf_start':
                setBarcodeStruct((prevState) => ({ ...prevState, rf_start: numericValue }));
                break;
            case 'rf_end':
                setBarcodeStruct((prevState) => ({ ...prevState, rf_end: numericValue }));
                break;
            case 'ft_start':
                setBarcodeStruct((prevState) => ({ ...prevState, ft_start: numericValue }));
                break;
            case 'ft_end':
                setBarcodeStruct((prevState) => ({ ...prevState, ft_end: numericValue }));
                break;
            case 'shelves':
                setBarcodeStruct((prevState) => ({ ...prevState, shelves: numericValue }));
                break;
        }

    }

    const generateText = (i: number, start: number, end: number, shelfTokens: string[], midText: string): string[] => {
        const barcodes = [];
        for (let j = start; j <= end; j++) {
            for (let k = 0; k < shelfTokens.length; k++) {

                const barcodeText = (i > 9 ? i : "0" + i) + midText + (j > 9 ? j : "0" + j) + shelfTokens[k]
                barcodes.push(barcodeText);
            }
        }
        return barcodes;
    }

    const hasValue = (value: number | null): value is number => value !== null && !Number.isNaN(value);

    const validateInput = (): string | null => {
        if (!hasValue(barcodeStruct.aisle_start) || !hasValue(barcodeStruct.aisle_end) || !hasValue(barcodeStruct.shelves)) {
            return 'Please enter aisle start, aisle end, and shelves using whole numbers.';
        }

        if (barcodeStruct.aisle_start < 1 || barcodeStruct.aisle_end < 1 || barcodeStruct.aisle_end > MAX_AISLE_VALUE) {
            return 'Aisles must be between 1 and 99.';
        }

        if (barcodeStruct.shelves <= 0 || barcodeStruct.shelves > MAX_SHELF_VALUE) {
            return 'Shelves must be between 1 and 20.';
        }

        if (barcodeStruct.aisle_start > barcodeStruct.aisle_end) {
            return 'Aisle start cannot be greater than aisle end.';
        }

        const sideRanges = [
            [barcodeStruct.lf_start, barcodeStruct.lf_end],
            [barcodeStruct.rf_start, barcodeStruct.rf_end],
            [barcodeStruct.ef_start, barcodeStruct.ef_end],
            [barcodeStruct.ft_start, barcodeStruct.ft_end],
        ];

        const completeRanges = sideRanges.filter(([start, end]) => hasValue(start) && hasValue(end));
        if (completeRanges.length === 0) {
            return 'Enter at least one complete side range (both start and end bays).';
        }

        for (const [start, end] of sideRanges) {
            if (hasValue(start) && hasValue(end) && start > end) {
                return 'Side range start cannot be greater than side range end.';
            }

            if (hasValue(end) && end > MAX_BAY_VALUE) {
                return 'Bay values must be between 1 and 99.';
            }
        }

        return null;
    }


    const generateBarcodeText = (): string[] => {

        const barcodeLFTexts: string[] = [];
        const barcodeRFTexts: string[] = [];
        const barcodeEFTexts: string[] = [];
        const barcodeFTTexts: string[] = [];
        const shelfTokens: string[] = [];

        // its for getting the alphabets in uppercase 
        if (!hasValue(barcodeStruct.aisle_start) || !hasValue(barcodeStruct.aisle_end) || !hasValue(barcodeStruct.shelves)) {
            return [];
        }

        for (let i = 0; i < barcodeStruct.shelves; i++) {
            shelfTokens.push(getShelfTokenForConfig(i, config.shelfStyle));
        }

        const selectedSides = [
            { start: barcodeStruct.lf_start, end: barcodeStruct.lf_end, midText: 'L' },
            { start: barcodeStruct.rf_start, end: barcodeStruct.rf_end, midText: 'R' },
            { start: barcodeStruct.ef_start, end: barcodeStruct.ef_end, midText: 'E' },
            { start: barcodeStruct.ft_start, end: barcodeStruct.ft_end, midText: 'F' },
        ].filter((side) => hasValue(side.start) && hasValue(side.end));

        for (let i = barcodeStruct.aisle_start; i <= barcodeStruct.aisle_end; i++) {
            selectedSides.forEach((side) => {
                const sideBarcodes = generateText(i, side.start as number, side.end as number, shelfTokens, side.midText);

                if (side.midText === 'L') {
                    barcodeLFTexts.push(...sideBarcodes);
                }
                if (side.midText === 'R') {
                    barcodeRFTexts.push(...sideBarcodes);
                }
                if (side.midText === 'E') {
                    barcodeEFTexts.push(...sideBarcodes);
                }
                if (side.midText === 'F') {
                    barcodeFTTexts.push(...sideBarcodes);
                }
            });
        }

        return [...barcodeLFTexts, ...barcodeRFTexts, ...barcodeEFTexts, ...barcodeFTTexts];
    }

    const formatTwoDigits = (value: number | null): string => {
        if (!hasValue(value)) {
            return '--';
        }

        return value.toString().padStart(2, '0');
    };

    const formatShelfSummary = (): string => {
        if (!hasValue(barcodeStruct.shelves) || barcodeStruct.shelves <= 0) {
            return '--';
        }

        const firstShelf = getShelfTokenForConfig(0, config.shelfStyle);
        const lastShelf = getShelfTokenForConfig(barcodeStruct.shelves - 1, config.shelfStyle);

        return `${firstShelf} – ${lastShelf}`;
    };

    const sideRows = [
        { label: 'Left', startKey: 'lf_start', endKey: 'lf_end' },
        { label: 'Right', startKey: 'rf_start', endKey: 'rf_end' },
        { label: 'End', startKey: 'ef_start', endKey: 'ef_end' },
        { label: 'Front', startKey: 'ft_start', endKey: 'ft_end' },
    ] as const;
    const printModeOptions: RadioOption[] = [
        { key: 'mini-sel', text: 'Mini SEL' },
        { key: 'large-sel', text: 'Large SEL' },
    ];

    const activeSideRanges = sideRows.filter((side) => hasValue(barcodeStruct[side.startKey]) && hasValue(barcodeStruct[side.endKey]));

    const totalAisles = hasValue(barcodeStruct.aisle_start) && hasValue(barcodeStruct.aisle_end)
        ? barcodeStruct.aisle_end - barcodeStruct.aisle_start + 1
        : 0;

    const totalBayValues = activeSideRanges.reduce((total, side) => {
        const start = barcodeStruct[side.startKey];
        const end = barcodeStruct[side.endKey];

        if (!hasValue(start) || !hasValue(end)) {
            return total;
        }

        return total + (end - start + 1);
    }, 0);

    const totalLabels = totalAisles > 0 && hasValue(barcodeStruct.shelves)
        ? totalAisles * totalBayValues * barcodeStruct.shelves
        : 0;

    const generateBarcode = (): void => {
        const validationError = validateInput();
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        setErrorMessage(null);
        setShowBarcode(<LabelGenerator type='Aisle' aisles={generateBarcodeText()} config={config} layoutMode={labelPrintMode} />)
    }

    const handleConfigurationLinkClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
        event.preventDefault();
        onOpenConfiguration();
    };

    return (
        <div className={styles.panel}>
            <h1 className={styles.panelTitle}>Generate Aisle Barcodes</h1>
            <div className={styles.sectionIntro}>
                <p><strong>Enter values for:</strong> aisles from 1 to 99, Sides (Left, Right, End, Front), Bays from 1 to 99 and Shelves (which can be letters or numbers) from 1 to 20.</p>
                <p>Label formats can be changed in the{' '}
                    <a href="#" onClick={handleConfigurationLinkClick}>configuration section</a>
                </p>
            </div>
            <div className={styles.configLayout}>
                <section className={styles.sectionBox}>
                    <h2 className={styles.sectionTitle}>Aisle Range (1-99)</h2>
                    <div className={styles.twoFieldGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>From</label>
                            <TextField
                                value={barcodeStruct.aisle_start?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'aisle_start')}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>To</label>
                            <TextField
                                value={barcodeStruct.aisle_end?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'aisle_end')}
                            />
                        </div>
                    </div>
                </section>

                <section className={styles.sectionBox}>
                    <h2 className={styles.sectionTitle}>Bay Configuration (1-99)</h2>
                    <div className={styles.sideGrid}>
                        {sideRows.map((side) => (
                            <div key={side.label} className={styles.sideRow}>
                                <div className={styles.sideLabel}>{side.label}</div>
                                <div className={styles.sideInputGroup}>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>From</label>
                                        <TextField
                                            value={barcodeStruct[side.startKey]?.toString() ?? ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, side.startKey)}
                                        />
                                    </div>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>To</label>
                                        <TextField
                                            value={barcodeStruct[side.endKey]?.toString() ?? ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, side.endKey)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
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

                <section className={styles.sectionBox}>
                    <h2 className={styles.sectionTitle}>Label Size</h2>
                    <RadioGroup
                        name={`${idPrefix}-label-print-mode`}
                        options={printModeOptions}
                        selectedKey={labelPrintMode}
                        onChange={(key) => setLabelPrintMode(key as LabelPrintMode)}
                    />
                </section>

                <section className={styles.sectionBox}>
                    <h2 className={styles.sectionTitle}>Summary</h2>
                    <div className={styles.summaryBox}>
                        <div className={styles.summaryRow}>
                            <span>Aisles:</span>
                            <span>{formatTwoDigits(barcodeStruct.aisle_start)} – {formatTwoDigits(barcodeStruct.aisle_end)}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Bays:</span>
                            <span>
                                {activeSideRanges.length > 0
                                    ? activeSideRanges.map((side) => `${side.label} ${formatTwoDigits(barcodeStruct[side.startKey])} – ${formatTwoDigits(barcodeStruct[side.endKey])}`).join(', ')
                                    : '--'}
                            </span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Shelves:</span>
                            <span>{formatShelfSummary()}</span>
                        </div>
                        <div className={styles.summaryTotal}>Total labels: {totalLabels}</div>
                    </div>
                </section>
            </div>

            {errorMessage && <div role="alert" className={styles.alertError}><div><span>{errorMessage}</span></div></div>}

            <div className={styles.actionsRow}>
                <Button className={styles.generateButton} onClick={generateBarcode}>Generate Barcodes</Button>
            </div>

            <div className="App">
                <div>{showBarcode}</div>
            </div>
        </div>
    );
};

export default AisleBarcode;
