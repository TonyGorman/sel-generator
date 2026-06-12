import * as React from 'react';
import styles from './LabelApp.module.css';
import shellStyles from './FormShell.module.css';
import { ILabelConfig } from '../models/ILabelConfig';
import LabelTile from './LabelTile';
import {
  normalizeBackCodePrefix,
  normalizeSpecialAisleValues,
  SPECIAL_AISLE_VALUES,
  MAX_SHELF_LETTER,
} from '../config/labelConfig';
import { getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { TextField } from './FormControls';
import { buildLayoutCssVars } from './labelLayoutCssVars';

const PREVIEW_STYLE = buildLayoutCssVars(getLabelLayoutStrategy('mini-sel'));

export interface IConfigureLabelFormProps {
  config: ILabelConfig;
  onConfigChange: (config: ILabelConfig) => void;
}

const ConfigureLabelForm: React.FC<IConfigureLabelFormProps> = ({ config, onConfigChange }) => {
  const idPrefix = React.useId();
  const defaultSpecialAisles = React.useMemo(() => [...SPECIAL_AISLE_VALUES], []);
  const [specialAisleInputValue, setSpecialAisleInputValue] = React.useState(
    (config.specialAisleValues ?? defaultSpecialAisles).join(', '),
  );

  React.useEffect(() => {
    setSpecialAisleInputValue((config.specialAisleValues ?? defaultSpecialAisles).join(', '));
  }, [config.specialAisleValues, defaultSpecialAisles]);

  const exampleShelfToken = MAX_SHELF_LETTER;
  const exampleLabelCode = `01R02${exampleShelfToken}`;

  const handleBackCodePrefixChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({
      ...config,
      backCodePrefix: normalizeBackCodePrefix(event.target.value),
    });
  };

  const commitSpecialAisleValues = (rawInput: string) => {
    const parsedValues = rawInput.split(',');
    const normalizedValues = normalizeSpecialAisleValues(parsedValues);

    onConfigChange({
      ...config,
      specialAisleValues: normalizedValues,
    });

    setSpecialAisleInputValue(normalizedValues.join(', '));
  };

  const handleSpecialAisleValuesChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSpecialAisleInputValue(event.target.value);
  };

  const handleSpecialAisleValuesBlur = () => {
    commitSpecialAisleValues(specialAisleInputValue);
  };

  return (
    <div className={shellStyles.panel}>
      <h1 className={shellStyles.panelTitle}>Label Configuration</h1>
      <p className={styles.sectionIntro}>
        Configure back-code prefix and special aisle values.
        The barcode will <strong>always</strong> be encoded <strong>without</strong> spaces or dashes.</p> 
            

      <div className={styles.configLayout}>
        <div className={styles.configControlsColumn}>
          <section className={shellStyles.sectionBox}>
            <h2 className={shellStyles.sectionTitle}>Back Code Prefix</h2>
            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-back-code-prefix`}>
              Prefix (letters or numbers)
            </label>
            <TextField
              id={`${idPrefix}-back-code-prefix`}
              value={config.backCodePrefix}
              maxLength={4}
              onChange={handleBackCodePrefixChange}
              aria-describedby={`${idPrefix}-back-code-prefix-help`}
            />
          </section>

          <section className={shellStyles.sectionBox}>
            <h2 className={shellStyles.sectionTitle}>Special Aisle Values</h2>
            <label className={shellStyles.fieldLabel} htmlFor={`${idPrefix}-special-aisle-values`}>
              Comma-separated names (letters only, max 8 chars each)
            </label>
            <TextField
              id={`${idPrefix}-special-aisle-values`}
              value={specialAisleInputValue}
              multiline
              autoGrow
              onChange={handleSpecialAisleValuesChange}
              onBlur={handleSpecialAisleValuesBlur}
              aria-describedby={`${idPrefix}-special-aisle-values-help`}
            />
          </section>
        </div>

        <div className={styles.configExampleBox}>
          <section className={shellStyles.sectionBox}>
            <h2 className={shellStyles.sectionTitle}>Preview</h2>
            <div className={styles.configExampleCard} style={PREVIEW_STYLE}>
              <LabelTile code={exampleLabelCode} config={config} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ConfigureLabelForm;
