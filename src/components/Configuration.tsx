import * as React from 'react';
import styles from './Barcode.module.css';
import { IBarcodeConfig } from '../models/IBarcodeConfig';
import BarcodeTile from './BarcodeTile';
import { getShelfTokenForConfig, normalizeBackCodePrefix } from '../config/barcodeConfig';
import { RadioGroup, RadioOption, TextField } from './FormControls';

export interface IConfigurationProps {
  config: IBarcodeConfig;
  onConfigChange: (config: IBarcodeConfig) => void;
}

const Configuration: React.FC<IConfigurationProps> = ({ config, onConfigChange }) => {
  const primaryCodeOptions: RadioOption[] = [
    { key: 'sideBay', text: 'Side + Bay (e.g., "R01")' },
    { key: 'shelfOnly', text: 'Shelf only' },
  ];
  const shelfStyleOptions: RadioOption[] = [
    { key: 'number', text: 'Shelf as Number (e.g., "1")' },
    { key: 'alphabetical', text: 'Shelf as Alphabetical (e.g., "A")' },
  ];
  const secondaryCodeOptions: RadioOption[] = [
    { key: 'dashes', text: 'Use dashes (e.g., "01-R02-3")' },
    { key: 'spaces', text: 'Use spaces (e.g., "01 R02 3")' },
  ];
  const idPrefix = React.useId();

  const exampleShelfToken = getShelfTokenForConfig(2, config.shelfStyle);
  const exampleLabelCode = `01R02${exampleShelfToken}`;

  const handlePrimaryCodeFormatChange = (key: string) => {
    onConfigChange({
      ...config,
      primaryCodeFormat: key as 'sideBay' | 'shelfOnly',
    });
  };

  const handleShelfStyleChange = (key: string) => {
    onConfigChange({
      ...config,
      shelfStyle: key as 'number' | 'alphabetical',
    });
  };

  const handleSecondaryCodeFormatChange = (key: string) => {
    onConfigChange({
      ...config,
      secondaryCodeFormat: key as 'dashes' | 'spaces',
    });
  };

  const handleBackCodePrefixChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({
      ...config,
      backCodePrefix: normalizeBackCodePrefix(event.target.value),
    });
  };

  return (
    <div className={styles.panel}>
      <h1 className={styles.panelTitle}>Label Configuration</h1>
      <div className={styles.configLayout}>
        <div className={styles.configControlsColumn}>
          <section className={styles.sectionBox}>
            <h2 className={styles.sectionTitle}>Primary Code Format</h2>
            <RadioGroup
              name={`${idPrefix}-primary-code-format`}
              options={primaryCodeOptions}
              selectedKey={config.primaryCodeFormat}
              onChange={handlePrimaryCodeFormatChange}
            />
          </section>

          <section className={styles.sectionBox}>
            <h2 className={styles.sectionTitle}>Shelf Style</h2>
            <RadioGroup
              name={`${idPrefix}-shelf-style`}
              options={shelfStyleOptions}
              selectedKey={config.shelfStyle}
              onChange={handleShelfStyleChange}
            />
          </section>

          <section className={styles.sectionBox}>
            <h2 className={styles.sectionTitle}>Secondary Code Format</h2>
            <RadioGroup
              name={`${idPrefix}-secondary-code-format`}
              options={secondaryCodeOptions}
              selectedKey={config.secondaryCodeFormat}
              onChange={handleSecondaryCodeFormatChange}
            />
          </section>

          <section className={styles.sectionBox}>
            <h2 className={styles.sectionTitle}>Back Code Prefix</h2>
            <label className={styles.fieldLabel} htmlFor={`${idPrefix}-back-code-prefix`}>
              Prefix (letters or numbers)
            </label>
            <TextField
              id={`${idPrefix}-back-code-prefix`}
              value={config.backCodePrefix}
              maxLength={2}
              onChange={handleBackCodePrefixChange}
              aria-describedby={`${idPrefix}-back-code-prefix-help`}
            />
            <p id={`${idPrefix}-back-code-prefix-help`}>
              Example: BK or 99.
            </p>
          </section>
        </div>

        <div className={styles.configExampleBox}>
          <section className={styles.sectionBox}>
            <h2 className={styles.sectionTitle}>Preview</h2>
            <div className={styles.configExampleCard}>
              <BarcodeTile code={exampleLabelCode} config={config} type="Aisle" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Configuration;
