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
import { AISLE_SIDE_METADATA } from '../config/aisleSideMetadata';
import { getLabelHardLimitMessage, getLabelSoftLimitMessage } from '../config/validationMessages';
import { Button, RadioGroup, ShelfSelect, TextField } from './FormControls';
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant';
import {
    createEmptyAisleSideRanges,
    generateAisleLabelCodes,
    getShelfRangeCount,
    IAisleLabelInput,
    parseNumericInput,
    validateAisleLabelInput,
} from '../domain/labelGeneration';
import { useResetOnVariantChange } from './useResetOnVariantChange';
import { useLabelPrintMode } from './useLabelPrintMode';
import { hasValue } from '../domain/numericGuard';
import { AisleSide } from '../models/IAisleCodeParts';

type NumericAisleInputKey = 'aisleStart' | 'aisleEnd';

interface AisleLabelFormProps {
    miniVariantId?: MiniCompositionVariantId;
}

const AisleLabelForm: React.FC<AisleLabelFormProps> = ({ miniVariantId }) => {
    const aisleRangeText = `${MIN_AISLE_VALUE}-${MAX_AISLE_VALUE}`;
    const bayRangeText = `1-${MAX_BAY_VALUE}`;
    const shelfRangeText = `A-${MAX_SHELF_LETTER}`;
    const sideNamesText = AISLE_SIDE_METADATA.map((side) => side.label).join(', ');

    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [warningMessage, setWarningMessage] = React.useState<string | null>(null);
    const [generatedLabels, setGeneratedLabels] = React.useState<string[] | null>(null);
    const idPrefix = React.useId();
    const [formInput, setFormInput] = React.useState<IAisleLabelInput>({
        aisleStart: null,
        aisleEnd: null,
        sideRanges: createEmptyAisleSideRanges(),
        shelfStart: null,
        shelfEnd: null,
    });

    const resetGeneratedLabels = React.useCallback(() => setGeneratedLabels(null), []);
    useResetOnVariantChange(miniVariantId, resetGeneratedLabels);
    const { labelPrintMode, printModeOptions, handleModeChange } = useLabelPrintMode(resetGeneratedLabels);


    const onInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>, type: NumericAisleInputKey): void => {
        const numericValue = parseNumericInput(e.target.value);
        setFormInput((prevState) => ({ ...prevState, [type]: numericValue }));
    }, []);

    const onSideRangeInputChange = React.useCallback((
        e: React.ChangeEvent<HTMLInputElement>,
        side: AisleSide,
        rangeType: 'start' | 'end',
    ): void => {
        const numericValue = parseNumericInput(e.target.value);
        setFormInput((prevState) => ({
            ...prevState,
            sideRanges: {
                ...prevState.sideRanges,
                [side]: {
                    ...prevState.sideRanges[side],
                    [rangeType]: numericValue,
                },
            },
        }));
    }, []);

    const onShelfStartChange = React.useCallback((letter: string): void => {
        setFormInput((prevState) => ({ ...prevState, shelfStart: letter || null }));
    }, []);

    const onShelfEndChange = React.useCallback((letter: string): void => {
        setFormInput((prevState) => ({ ...prevState, shelfEnd: letter || null }));
    }, []);

    const formatTwoDigits = (value: number | null): string => {
        if (!hasValue(value)) {
            return '--';
        }

        return formatTwoDigitValue(value);
    };

    const formatShelfSummary = (): string => {
        if (!formInput.shelfEnd) {
            return '--';
        }
        const start = formInput.shelfStart ?? 'A';
        if (start === formInput.shelfEnd) {
            return formInput.shelfEnd;
        }
        return `${start} – ${formInput.shelfEnd}`;
    };

    const sideRows = AISLE_SIDE_METADATA;

    const activeSideRanges = sideRows
        .map((side) => ({
            ...side,
            start: formInput.sideRanges[side.side].start,
            end: formInput.sideRanges[side.side].end,
        }))
        .filter((side) => hasValue(side.start) && hasValue(side.end));

    const totalAisles = hasValue(formInput.aisleStart) && hasValue(formInput.aisleEnd)
        ? formInput.aisleEnd - formInput.aisleStart + 1
        : 0;

    const totalBayValues = activeSideRanges.reduce((total, side) => {
        const start = side.start;
        const end = side.end;

        if (!hasValue(start) || !hasValue(end)) {
            return total;
        }

        return total + (end - start + 1);
    }, 0);

    const shelfCount = getShelfRangeCount(formInput.shelfStart, formInput.shelfEnd);
    const totalLabels = totalAisles > 0 && shelfCount > 0
        ? totalAisles * totalBayValues * shelfCount
        : 0;

    const generateLabel = (): void => {
        const validationError = validateAisleLabelInput(formInput, {
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
        setGeneratedLabels(generateAisleLabelCodes(formInput, formatTwoDigitValue));
    }

    return (
        <div className={shellStyles.panel}>
            <h1 className={shellStyles.panelTitle}>Generate Aisle Labels</h1>
            <div className={styles.sectionIntro}>
                <p><strong>Enter values for:</strong> aisles from {MIN_AISLE_VALUE} to {MAX_AISLE_VALUE}, Sides ({sideNamesText}), Bays from 1 to {MAX_BAY_VALUE} and Shelves (alphabetical only) within {shelfRangeText}.</p>
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
                                value={formInput.aisleStart?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'aisleStart')}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-aisle-end`}>To</label>
                            <TextField
                                id={`${idPrefix}-aisle-end`}
                                value={formInput.aisleEnd?.toString() ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e, 'aisleEnd')}
                            />
                        </div>
                    </div>
                </section>

                <section className={shellStyles.sectionBox}>
                    <h2 className={shellStyles.sectionTitle}>Bay Configuration ({bayRangeText})</h2>
                    <div className={styles.sideGrid}>
                        {sideRows.map((side) => (
                            <div key={side.side} className={styles.sideRow}>
                                <div className={styles.sideLabel}>{side.label}</div>
                                <div className={styles.sideInputGroup}>
                                    <div className={styles.fieldGroup}>
                                        <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-${side.side}-start`}>From</label>
                                        <TextField
                                            id={`${idPrefix}-${side.side}-start`}
                                            value={formInput.sideRanges[side.side].start?.toString() ?? ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSideRangeInputChange(e, side.side, 'start')}
                                        />
                                    </div>
                                    <div className={styles.fieldGroup}>
                                        <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-${side.side}-end`}>To</label>
                                        <TextField
                                            id={`${idPrefix}-${side.side}-end`}
                                            value={formInput.sideRanges[side.side].end?.toString() ?? ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSideRangeInputChange(e, side.side, 'end')}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={shellStyles.sectionBox}>
                    <h2 className={shellStyles.sectionTitle}>Shelf Range ({shelfRangeText})</h2>
                    <div className={styles.twoFieldGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-shelf-start`}>Start Shelf</label>
                            <ShelfSelect
                                id={`${idPrefix}-shelf-start`}
                                value={formInput.shelfStart ?? ''}
                                onChange={onShelfStartChange}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-shelf-end`}>End Shelf</label>
                            <ShelfSelect
                                id={`${idPrefix}-shelf-end`}
                                value={formInput.shelfEnd ?? ''}
                                onChange={onShelfEndChange}
                            />
                        </div>
                    </div>
                </section>

                <section className={shellStyles.sectionBox}>
                    <h2 className={shellStyles.sectionTitle}>Label Size</h2>
                    <RadioGroup
                        name={`${idPrefix}-label-print-mode`}
                        options={printModeOptions}
                        selectedKey={labelPrintMode}
                        onChange={handleModeChange}
                    />
                </section>

                <section className={shellStyles.sectionBox}>
                    <h2 className={shellStyles.sectionTitle}>Summary</h2>
                    <div className={styles.summaryBox}>
                        <div className={styles.summaryRow}>
                            <span>Aisles:</span>
                            <span>{formatTwoDigits(formInput.aisleStart)} – {formatTwoDigits(formInput.aisleEnd)}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Bays:</span>
                            <span>
                                {activeSideRanges.length > 0
                                    ? activeSideRanges.map((side) => `${side.label} ${formatTwoDigits(side.start)} – ${formatTwoDigits(side.end)}`).join(', ')
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
