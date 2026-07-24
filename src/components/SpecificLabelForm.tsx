import * as React from 'react';
import styles from './SpecificLabelForm.module.css';
import shellStyles from './FormShell.module.css';
import LabelGenerator from './LabelGenerator';
import FormFeedback from './FormFeedback';
import GenerateLabelsButton from './GenerateLabelsButton';
import FormSection from './FormSection';
import {
    SHORT_CODE_PREFIXES,
    SPECIAL_AISLE_VALUES,
} from '../config/labelConfig';
import { RadioGroup, TextField } from './FormControls';
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant';
import { useResetOnVariantChange } from './useResetOnVariantChange';
import { useSpecificLabelForm } from './useSpecificLabelForm';

interface SpecificLabelFormProps {
    miniVariantId?: MiniCompositionVariantId;
}

const SpecificLabelForm: React.FC<SpecificLabelFormProps> = ({ miniVariantId }) => {
    const { content, state, actions } = useSpecificLabelForm();
    const { bayRangeText, shelfRangeText, namedAisleExamples, aislePrefixedExamples } = content;
    const { labelText, generatedLabels, errorMessage, warningMessage, labelPrintMode, printModeOptions } = state;
    const { onInputChange, handleModeChange, generateLabel, resetGeneratedLabels } = actions;

    useResetOnVariantChange(miniVariantId, resetGeneratedLabels);

    return (
        <div className={shellStyles.panel}>
            <h1 className={shellStyles.panelTitle}>Generate Specific Labels</h1>
            <p className={styles.sectionIntro}>Enter one label or a comma-separated list (for example: 01L01A, {aislePrefixedExamples}, {SHORT_CODE_PREFIXES[0]}01A, {SHORT_CODE_PREFIXES[1]}01A, {SPECIAL_AISLE_VALUES[0]}).
                <br/>Labels must have no spaces or dashes.
                <br/>Named aisle values without bay/shelf are supported: {namedAisleExamples}.
            </p>
            <FormFeedback errorMessage={errorMessage} warningMessage={warningMessage} />

            <FormSection title="Label Input">
                <div className={styles.formStack}>
                    <TextField
                        value={labelText}
                        placeholder="Enter labels"
                        onChange={onInputChange}
                    />
                    <p>Bay values must be {bayRangeText} and shelves must be {shelfRangeText}.</p>
                </div>
            </FormSection>

            <FormSection title="Label Size">
                <RadioGroup
                    name="specific-label-print-mode"
                    options={printModeOptions}
                    selectedKey={labelPrintMode}
                    onChange={handleModeChange}
                />
            </FormSection>

            <div className={styles.actionsRow}>
                <GenerateLabelsButton className={styles.generateButton} onClick={generateLabel} />
            </div>

            {generatedLabels && (
                <LabelGenerator labelCodes={generatedLabels} layoutMode={labelPrintMode} miniVariantId={miniVariantId} />
            )}
        </div>
    );
};

export default SpecificLabelForm;
