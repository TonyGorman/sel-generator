import * as React from 'react';
import styles from './AisleLabelForm.module.css';
import LabelGenerator from './LabelGenerator';
import { ILabelConfig } from '../models/ILabelConfig';
import { MAX_AISLE_VALUE, MAX_BAY_VALUE, MAX_SHELF_VALUE, getShelfTokenForConfig } from '../config/labelConfig';
import { Button, RadioGroup, RadioOption, TextField } from './FormControls';
import { LabelPrintMode } from '../models/ILabelLayoutStrategy';

interface IAisleLabelFormProps {
    config: ILabelConfig;
    onOpenConfiguration: () => void;
}

const AisleLabelForm: React.FC<IAisleLabelFormProps> = ({ config, onOpenConfiguration }) => {
    const aisleRangeText = `1-${MAX_AISLE_VALUE}`;
    const bayRangeText = `1-${MAX_BAY_VALUE}`;
    const shelfRangeText = `1-${MAX_SHELF_VALUE}`;
    const aisleValidationMessage = `Aisles must be between 1 and ${MAX_AISLE_VALUE}.`;
    const bayValidationMessage = `Bay values must be between 1 and ${MAX_BAY_VALUE}.`;
    const shelfValidationMessage = `Shelves must be between 1 and ${MAX_SHELF_VALUE}.`;

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
        shelves: null as number | null
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
            case 'shelves':
                setLabelStruct((prevState) => ({ ...prevState, shelves: numericValue }));
                break;
        }

    }

    const generateText = (i: number, start: number, end: number, shelfTokens: string[], midText: string): string[] => {
        const barcodes = [];
        for (let j = start; j <= end; j++) {
            for (let k = 0; k < shelfTokens.length; k++) {

                const labelText = (i > 9 ? i : "0" + i) + midText + (j > 9 ? j : "0" + j) + shelfTokens[k]
                barcodes.push(labelText);
            }
        }
        return barcodes;
    }

    const hasValue = (value: number | null): value is number => value !== null && !Number.isNaN(value);

    const validateInput = (): string | null => {
        if (!hasValue(labelStruct.aisle_start) || !hasValue(labelStruct.aisle_end) || !hasValue(labelStruct.shelves)) {
            return 'Please enter aisle start, aisle end, and shelves using whole numbers.';
        }

        if (labelStruct.aisle_start < 1 || labelStruct.aisle_end < 1 || labelStruct.aisle_end > MAX_AISLE_VALUE) {
            return aisleValidationMessage;
        }

        if (labelStruct.shelves < 1 || labelStruct.shelves > MAX_SHELF_VALUE) {
            return shelfValidationMessage;
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
        if (!hasValue(labelStruct.aisle_start) || !hasValue(labelStruct.aisle_end) || !hasValue(labelStruct.shelves)) {
            return [];
        }

        for (let i = 0; i < labelStruct.shelves; i++) {
            shelfTokens.push(getShelfTokenForConfig(i, config.shelfStyle));
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

        return value.toString().padStart(2, '0');
    };

    const formatShelfSummary = (): string => {
        if (!hasValue(labelStruct.shelves) || labelStruct.shelves <= 0) {
            return '--';
        }

        const firstShelf = getShelfTokenForConfig(0, config.shelfStyle);
        const lastShelf = getShelfTokenForConfig(labelStruct.shelves - 1, config.shelfStyle);

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

    const totalLabels = totalAisles > 0 && hasValue(labelStruct.shelves)
        ? totalAisles * totalBayValues * labelStruct.shelves
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

    const handleConfigurationLinkClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
        event.preventDefault();
        onOpenConfiguration();
    };

    return (
        <div className={styles.panel}>
            <h1 className={styles.panelTitle}>Generate Aisle Labels</h1>
            <div className={styles.sectionIntro}>
                <p><strong>Enter values for:</strong> aisles from 1 to {MAX_AISLE_VALUE}, Sides (Left, Right, End, Front), Bays from 1 to {MAX_BAY_VALUE} and Shelves (which can be letters or numbers) from 1 to {MAX_SHELF_VALUE}.</p>
                <p>The barcode will <strong>always</strong> be encoded <strong>without</strong> spaces or dashes.</p>
                <p>Label formats can be changed in the{' '}
                    <a href="#" onClick={handleConfigurationLinkClick}>configuration section</a>
                </p>
            </div>
            <div className={styles.configLayout}>
                <section className={styles.sectionBox}>
                    <h2 className={styles.sectionTitle}>Aisle Range ({aisleRangeText})</h2>
                    <div className={styles.twoFieldGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>From</label>
                            <TextField
                                value={labelStruct.aisle_start?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'aisle_start')}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>To</label>
                            <TextField
                                value={labelStruct.aisle_end?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'aisle_end')}
                            />
                        </div>
                    </div>
                </section>

                <section className={styles.sectionBox}>
                    <h2 className={styles.sectionTitle}>Bay Configuration ({bayRangeText})</h2>
                    <div className={styles.sideGrid}>
                        {sideRows.map((side) => (
                            <div key={side.label} className={styles.sideRow}>
                                <div className={styles.sideLabel}>{side.label}</div>
                                <div className={styles.sideInputGroup}>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>From</label>
                                        <TextField
                                            value={labelStruct[side.startKey]?.toString() ?? ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, side.startKey)}
                                        />
                                    </div>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>To</label>
                                        <TextField
                                            value={labelStruct[side.endKey]?.toString() ?? ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, side.endKey)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.sectionBox}>
                    <h2 className={styles.sectionTitle}>Shelves Per Bay ({shelfRangeText})</h2>
                    <div className={styles.singleField}>
                        <TextField
                            value={labelStruct.shelves?.toString() ?? ''}
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

            {errorMessage && <div role="alert" className={styles.alertError}><div><span>{errorMessage}</span></div></div>}

            <div className={styles.actionsRow}>
                <Button className={styles.generateButton} onClick={generateLabel}>Generate Labels</Button>
            </div>

            {generatedLabels && (
                <div className="App">
                    <div>
                        <LabelGenerator type='Aisle' aisles={generatedLabels} config={config} layoutMode={labelPrintMode} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AisleLabelForm;
