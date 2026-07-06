import * as React from 'react';
import styles from './AisleLabelForm.module.css';
import alertStyles from './Alert.module.css';
import shellStyles from './FormShell.module.css';
import controlStyles from './FormControls.module.css';
import LabelGenerator from './LabelGenerator';
import {
    MIN_AISLE_VALUE,
    MAX_AISLE_VALUE,
    MAX_BAY_VALUE,
    MAX_SHELF_LETTER,
    LABEL_SOFT_LIMIT,
    LABEL_HARD_LIMIT,
    formatTwoDigitValue,
} from '../config/labelConfig';
import { getLabelHardLimitMessage, getLabelSoftLimitMessage } from '../config/validationMessages';
import { Button, RadioGroup, RadioOption, ShelfSelect, TextField } from './FormControls';
import { LabelPrintMode } from '../models/ILabelLayoutStrategy';
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant';
import {
    generateAisleLabelCodes,
    IAisleLabelInput,
    parseNumericInput,
    validateAisleLabelInput,
} from '../domain/labelGeneration';
import { useResetOnVariantChange } from './useResetOnVariantChange';

type NumericAisleInputKey = Exclude<keyof IAisleLabelInput, 'shelves'>;

interface AisleLabelFormProps {
    miniVariantId?: MiniCompositionVariantId;
}

const AisleLabelForm: React.FC<AisleLabelFormProps> = ({ miniVariantId }) => {
    const aisleRangeText = `${MIN_AISLE_VALUE}-${MAX_AISLE_VALUE}`;
    const bayRangeText = `1-${MAX_BAY_VALUE}`;
    const shelfRangeText = `A-${MAX_SHELF_LETTER}`;

    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [warningMessage, setWarningMessage] = React.useState<string | null>(null);
    const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null);
    const [labelPrintMode, setLabelPrintMode] = React.useState<LabelPrintMode>('mini-sel');
    const idPrefix = React.useId();
    const [labelStruct, setLabelStruct] = React.useState<IAisleLabelInput>({
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

    const resetGeneratedLabels = React.useCallback(() => setGeneratedLabels(null), []);
    useResetOnVariantChange(miniVariantId, resetGeneratedLabels);


    const onInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>, type: NumericAisleInputKey): void => {
        const numericValue = parseNumericInput(e.target.value);
        setLabelStruct((prevState) => ({ ...prevState, [type]: numericValue }));
    }, []);

    const onShelfChange = React.useCallback((letter: string): void => {
        setLabelStruct((prevState) => ({ ...prevState, shelves: letter || null }));
    }, []);

    const hasValue = (value: number | null): value is number => value !== null && !Number.isNaN(value);

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
    const printModeOptions: RadioOption<LabelPrintMode>[] = [
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
        const validationError = validateAisleLabelInput(labelStruct, {
            minAisleValue: MIN_AISLE_VALUE,
            maxAisleValue: MAX_AISLE_VALUE,
            maxBayValue: MAX_BAY_VALUE,
        });
        if (validationError) {
            setErrorMessage(validationError);
            setWarningMessage(null);
            setGeneratedLabels(null);
            return;
        }

        if (totalLabels > LABEL_HARD_LIMIT) {
            setErrorMessage(getLabelHardLimitMessage(LABEL_HARD_LIMIT));
            setWarningMessage(null);
            setGeneratedLabels(null);
            return;
        }

        setErrorMessage(null);
        setWarningMessage(totalLabels > LABEL_SOFT_LIMIT ? getLabelSoftLimitMessage(LABEL_SOFT_LIMIT) : null);
        setGeneratedLabels(generateAisleLabelCodes(labelStruct, formatTwoDigitValue));
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
                        onChange={(key) => setLabelPrintMode(key)}
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
            {warningMessage && (
                <div role="status" aria-live="polite" aria-atomic="true" className={alertStyles.alertWarning}>
                    <div><span>{warningMessage}</span></div>
                </div>
            )}

            <div className={styles.actionsRow}>
                <Button aria-label="Generate Labels" className={styles.generateButton} onClick={generateLabel}>
                    <span className={controlStyles.buttonLabel}>Generate Labels</span>
                    <span className={controlStyles.buttonIcon} aria-hidden="true">⚡</span>
                </Button>
            </div>

            {generatedLabels && (
                <LabelGenerator labelCodes={generatedLabels} layoutMode={labelPrintMode} miniVariantId={miniVariantId} />
            )}
        </div>
    );
};

export default AisleLabelForm;
