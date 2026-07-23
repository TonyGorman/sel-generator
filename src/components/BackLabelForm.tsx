import * as React from 'react';
import styles from './AisleLabelForm.module.css';
import alertStyles from './Alert.module.css';
import shellStyles from './FormShell.module.css';
import controlStyles from './FormControls.module.css';
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
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant';
import { useResetOnVariantChange } from './useResetOnVariantChange';
import { useShortLabelForm } from './useShortLabelForm';

interface BackLabelFormProps {
    miniVariantId?: MiniCompositionVariantId;
}

const SHORT_CODE_PREFIX_OPTIONS = SHORT_CODE_PREFIXES.map((prefix) => ({
    key: prefix,
    text: prefix,
}));

const BackLabelForm: React.FC<BackLabelFormProps> = ({ miniVariantId }) => {
    const bayRangeText = `${MIN_BAY_VALUE}-${MAX_BAY_VALUE}`;
    const shelfRangeText = `A-${MAX_SHELF_LETTER}`;
    const idPrefix = React.useId();

    const { state, actions } = useShortLabelForm({
        initialPrefix: SHORT_CODE_PREFIXES[0],
        minBayValue: MIN_BAY_VALUE,
        maxBayValue: MAX_BAY_VALUE,
        softLimit: LABEL_SOFT_LIMIT,
        hardLimit: LABEL_HARD_LIMIT,
        formatTwoDigitValue,
    });

    const {
        labelStruct,
        selectedShortCodePrefix,
        errorMessage,
        warningMessage,
        generatedLabels,
    } = state;

    const {
        setSelectedShortCodePrefix,
        onInputChange,
        onShelfStartChange,
        onShelfEndChange,
        generateLabel,
        resetGeneratedLabels,
    } = actions;
    useResetOnVariantChange(miniVariantId, resetGeneratedLabels);

    return (
        <div className={shellStyles.panel}>
            <h1 className={shellStyles.panelTitle}>Generate FOS/BAK Labels</h1>
            <p className={styles.sectionIntro}>Choose BAK (Back Wall) or FOS (Front Of Store) using the prefix selector.
                <br/>Set the start bay, end bay, start shelf, and end shelf required.
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
                    <h2 className={shellStyles.sectionTitle}>Shelf Range ({shelfRangeText})</h2>
                    <div className={styles.twoFieldGrid}>
                        <div className={styles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-shelf-start`}>Start Shelf</label>
                            <ShelfSelect
                                id={`${idPrefix}-shelf-start`}
                                value={labelStruct.shelf_start ?? ''}
                                onChange={onShelfStartChange}
                            />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-shelf-end`}>End Shelf</label>
                            <ShelfSelect
                                id={`${idPrefix}-shelf-end`}
                                value={labelStruct.shelf_end ?? ''}
                                onChange={onShelfEndChange}
                            />
                        </div>
                    </div>
                </section>
            </div>

            <div className={styles.actionsRow}>
                <Button aria-label="Generate Labels" className={styles.generateButton} onClick={generateLabel}>
                    <span className={controlStyles.buttonLabel}>Generate Labels</span>
                    <span className={controlStyles.buttonIcon} aria-hidden="true">⚡</span>
                </Button>
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
                <LabelGenerator labelCodes={generatedLabels} layoutMode="mini-sel" miniVariantId={miniVariantId} />
            )}
        </div>
    );
};

export default BackLabelForm;
