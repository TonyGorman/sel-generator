import * as React from 'react';
import styles from './AisleLabelForm.module.css';
import alertStyles from './Alert.module.css';
import shellStyles from './FormShell.module.css';
import LabelGenerator from './LabelGenerator';
import { ILabelConfig } from '../models/ILabelConfig';
import { MIN_AISLE_VALUE, MAX_AISLE_VALUE, MAX_BAY_VALUE, MAX_SHELF_LETTER, formatTwoDigitValue } from '../config/labelConfig';
import { Button, RadioGroup, RadioOption, ShelfSelect, TextField } from './FormControls';
import { LabelPrintMode } from '../models/ILabelLayoutStrategy';

interface IAisleLabelFormProps {
    config: ILabelConfig;
}

const AisleLabelForm: React.FC<IAisleLabelFormProps> = ({ config }) => {
    const aisleRangeText = `${MIN_AISLE_VALUE}-${MAX_AISLE_VALUE}`;
    const bayRangeText = `1-${MAX_BAY_VALUE}`;
    const shelfRangeText = `A-${MAX_SHELF_LETTER}`;
    const aisleValidationMessage = `Aisles must be between ${MIN_AISLE_VALUE} and ${MAX_AISLE_VALUE}.`;
    const bayValidationMessage = `Bay values must be between 1 and ${MAX_BAY_VALUE}.`;

    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null);
    const [labelPrintMode, setLabelPrintMode] = React.useState<LabelPrintMode>('mini-sel');
    const idPrefix = React.useId();
    const [labelStruct, setLabelStruct] = React.useState({
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
        shelves: null as string | null
    });


    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: string): void => {
        const inpVal = e.target.value.trim();
        const numericValue = inpVal === '' || !/^\d+$/.test(inpVal) ? null : Number(inpVal);

        switch (type) {
            case 'aisle_start':
                setLabelStruct((prevState) => ({ ...prevState, aisle_start: numericValue }));
                break;
            case 'aisle_end':
                setLabelStruct((prevState) => ({ ...prevState, aisle_end: numericValue }));
                break;
            case 'lf_start':
                setLabelStruct((prevState) => ({ ...prevState, lf_start: numericValue }));
                break;
            case 'lf_end':
                setLabelStruct((prevState) => ({ ...prevState, lf_end: numericValue }));
                break;
            case 'ef_start':
                setLabelStruct((prevState) => ({ ...prevState, ef_start: numericValue }));
                break;
            case 'ef_end':
                setLabelStruct((prevState) => ({ ...prevState, ef_end: numericValue }));
                break;
            case 'rf_start':
                setLabelStruct((prevState) => ({ ...prevState, rf_start: numericValue }));
                break;
            case 'rf_end':
                setLabelStruct((prevState) => ({ ...prevState, rf_end: numericValue }));
                break;
            case 'ft_start':
                setLabelStruct((prevState) => ({ ...prevState, ft_start: numericValue }));
                break;
            case 'ft_end':
                setLabelStruct((prevState) => ({ ...prevState, ft_end: numericValue }));
                break;

        }

    }

    const onShelfChange = (letter: string): void => {
        setLabelStruct((prevState) => ({ ...prevState, shelves: letter || null }));
    };

    const generateText = (i: number, start: number, end: number, shelfTokens: string[], midText: string): string[] => {
        const barcodes = [];
        const aisleText = formatTwoDigitValue(i);

        for (let j = start; j <= end; j++) {
            const bayText = formatTwoDigitValue(j);

            for (let k = 0; k < shelfTokens.length; k++) {
                const labelText = `${aisleText}${midText}${bayText}${shelfTokens[k]}`;
                barcodes.push(labelText);
            }
        }

        return barcodes;
    }

    const hasValue = (value: number | null): value is number => value !== null && !Number.isNaN(value);

    const validateInput = (): string | null => {
        if (!hasValue(labelStruct.aisle_start) || !hasValue(labelStruct.aisle_end) || !labelStruct.shelves) {
            return 'Please enter aisle start, aisle end, and select a shelf.';
        }

        if (labelStruct.aisle_start < MIN_AISLE_VALUE || labelStruct.aisle_end < MIN_AISLE_VALUE || labelStruct.aisle_end > MAX_AISLE_VALUE) {
            return aisleValidationMessage;
        }

        if (labelStruct.aisle_start > labelStruct.aisle_end) {
            return 'Aisle start cannot be greater than aisle end.';
        }

        const sideRanges = [
            [labelStruct.lf_start, labelStruct.lf_end],
            [labelStruct.rf_start, labelStruct.rf_end],
            [labelStruct.ef_start, labelStruct.ef_end],
            [labelStruct.ft_start, labelStruct.ft_end],
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
                return bayValidationMessage;
            }
        }

        return null;
    }


    const generateLabelText = (): string[] => {

        const labelLFTexts: string[] = [];
        const labelRFTexts: string[] = [];
        const labelEFTexts: string[] = [];
        const labelFTTexts: string[] = [];
        const shelfTokens: string[] = [];

        // its for getting the alphabets in uppercase 
        if (!hasValue(labelStruct.aisle_start) || !hasValue(labelStruct.aisle_end) || !labelStruct.shelves) {
            return [];
        }

        const shelfCount = labelStruct.shelves.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
        for (let i = 0; i < shelfCount; i++) {
            shelfTokens.push(String.fromCharCode('A'.charCodeAt(0) + i));
        }

        const selectedSides = [
            { start: labelStruct.lf_start, end: labelStruct.lf_end, midText: 'L' },
            { start: labelStruct.rf_start, end: labelStruct.rf_end, midText: 'R' },
            { start: labelStruct.ef_start, end: labelStruct.ef_end, midText: 'E' },
            { start: labelStruct.ft_start, end: labelStruct.ft_end, midText: 'F' },
        ].filter((side) => hasValue(side.start) && hasValue(side.end));

        for (let i = labelStruct.aisle_start; i <= labelStruct.aisle_end; i++) {
            selectedSides.forEach((side) => {
                const sideBarcodes = generateText(i, side.start as number, side.end as number, shelfTokens, side.midText);

                if (side.midText === 'L') {
                    labelLFTexts.push(...sideBarcodes);
                }
                if (side.midText === 'R') {
                    labelRFTexts.push(...sideBarcodes);
                }
                if (side.midText === 'E') {
                    labelEFTexts.push(...sideBarcodes);
                }
                if (side.midText === 'F') {
                    labelFTTexts.push(...sideBarcodes);
                }
            });
        }

        return [...labelLFTexts, ...labelRFTexts, ...labelEFTexts, ...labelFTTexts];
    }

    const formatTwoDigits = (value: number | null): string => {
        if (!hasValue(value)) {
            return '--';
        }

        return formatTwoDigitValue(value);
    };

    const formatShelfSummary = (): string => {
        if (!labelStruct.shelves) {
            return '--';
        }

        return `A – ${labelStruct.shelves}`;
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

    const activeSideRanges = sideRows.filter((side) => hasValue(labelStruct[side.startKey]) && hasValue(labelStruct[side.endKey]));

    const totalAisles = hasValue(labelStruct.aisle_start) && hasValue(labelStruct.aisle_end)
        ? labelStruct.aisle_end - labelStruct.aisle_start + 1
        : 0;

    const totalBayValues = activeSideRanges.reduce((total, side) => {
        const start = labelStruct[side.startKey];
        const end = labelStruct[side.endKey];

        if (!hasValue(start) || !hasValue(end)) {
            return total;
        }

        return total + (end - start + 1);
    }, 0);

    const shelfCount = labelStruct.shelves ? labelStruct.shelves.charCodeAt(0) - 'A'.charCodeAt(0) + 1 : 0;
    const totalLabels = totalAisles > 0 && shelfCount > 0
        ? totalAisles * totalBayValues * shelfCount
        : 0;

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
            <h1 className={shellStyles.panelTitle}>Generate Aisle Labels</h1>
            <div className={styles.sectionIntro}>
                <p><strong>Enter values for:</strong> aisles from {MIN_AISLE_VALUE} to {MAX_AISLE_VALUE}, Sides (Left, Right, End, Front), Bays from 1 to {MAX_BAY_VALUE} and Shelves (alphabetical only) within {shelfRangeText}.</p>
                <p>The barcode will <strong>always</strong> be encoded <strong>without</strong> spaces or dashes.</p>
            </div>
            <div className={styles.configLayout}>
                <section className={shellStyles.sectionBox}>
                    <h2 className={shellStyles.sectionTitle}>Aisle Range ({aisleRangeText})</h2>
                    <div className={styles.twoFieldGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-aisle-start`}>From</label>
                            <TextField
                                id={`${idPrefix}-aisle-start`}
                                value={labelStruct.aisle_start?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'aisle_start')}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-aisle-end`}>To</label>
                            <TextField
                                id={`${idPrefix}-aisle-end`}
                                value={labelStruct.aisle_end?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'aisle_end')}
                            />
                        </div>
                    </div>
                </section>

                <section className={shellStyles.sectionBox}>
                    <h2 className={shellStyles.sectionTitle}>Bay Configuration ({bayRangeText})</h2>
                    <div className={styles.sideGrid}>
                        {sideRows.map((side) => (
                            <div key={side.label} className={styles.sideRow}>
                                <div className={styles.sideLabel}>{side.label}</div>
                                <div className={styles.sideInputGroup}>
                                    <div className={styles.fieldGroup}>
                                        <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-${side.startKey}`}>From</label>
                                        <TextField
                                            id={`${idPrefix}-${side.startKey}`}
                                            value={labelStruct[side.startKey]?.toString() ?? ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, side.startKey)}
                                        />
                                    </div>
                                    <div className={styles.fieldGroup}>
                                        <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-${side.endKey}`}>To</label>
                                        <TextField
                                            id={`${idPrefix}-${side.endKey}`}
                                            value={labelStruct[side.endKey]?.toString() ?? ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, side.endKey)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
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

                <section className={shellStyles.sectionBox}>
                    <h2 className={shellStyles.sectionTitle}>Label Size</h2>
                    <RadioGroup
                        name={`${idPrefix}-label-print-mode`}
                        options={printModeOptions}
                        selectedKey={labelPrintMode}
                        onChange={(key) => setLabelPrintMode(key as LabelPrintMode)}
                    />
                </section>

                <section className={shellStyles.sectionBox}>
                    <h2 className={shellStyles.sectionTitle}>Summary</h2>
                    <div className={styles.summaryBox}>
                        <div className={styles.summaryRow}>
                            <span>Aisles:</span>
                            <span>{formatTwoDigits(labelStruct.aisle_start)} – {formatTwoDigits(labelStruct.aisle_end)}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Bays:</span>
                            <span>
                                {activeSideRanges.length > 0
                                    ? activeSideRanges.map((side) => `${side.label} ${formatTwoDigits(labelStruct[side.startKey])} – ${formatTwoDigits(labelStruct[side.endKey])}`).join(', ')
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

            {errorMessage && <div role="alert" className={alertStyles.alertError}><div><span>{errorMessage}</span></div></div>}

            <div className={styles.actionsRow}>
                <Button className={styles.generateButton} onClick={generateLabel}>Generate Labels</Button>
            </div>

            {generatedLabels && (
                <div className="App">
                    <div>
                        <LabelGenerator aisles={generatedLabels} config={config} layoutMode={labelPrintMode} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AisleLabelForm;
