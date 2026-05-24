import * as React from 'react';
import styles from './LabelApp.module.css';
import { ILabelConfig } from '../models/ILabelConfig';
import LabelTile from './LabelTile';
import { getShelfTokenForConfig, normalizeBackCodePrefix } from '../config/labelConfig';
import { getLabelLayoutStrategy } from '../config/labelLayoutStrategies';
import { RadioGroup, RadioOption, TextField } from './FormControls';

const { page: miniPage, barcodeGeometry: miniGeo } = getLabelLayoutStrategy('mini-sel');
const PREVIEW_STYLE = {
  '--current-tile-width-mm': `${miniPage.labelWidthMm}mm`,
  '--current-tile-height-mm': `${miniPage.labelHeightMm}mm`,
  '--mini-sel-barcode-width-mm': `${miniGeo.widthMm}mm`,
  '--mini-sel-barcode-height-mm': `${miniGeo.heightMm}mm`,
  '--mini-sel-barcode-margin-bottom-mm': `${miniGeo.marginBottomMm}mm`,
} as React.CSSProperties;

export interface IConfigureLabelFormProps {
  config: ILabelConfig;
  onConfigChange: (config: ILabelConfig) => void;
}

const ConfigureLabelForm: React.FC<IConfigureLabelFormProps> = ({ config, onConfigChange }) => {
  const primaryCodeOptions: RadioOption[] = [
    { key: 'sideAndBay', text: 'Side + Bay (e.g., "R01")' },
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
      primaryCodeFormat: key as 'sideAndBay' | 'shelfOnly',
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
      <p className={styles.sectionIntro}>
        Configure how the text values appear.
        The barcode will <strong>always</strong> be encoded <strong>without</strong> spaces or dashes.</p> 
            

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
            <div className={styles.configExampleCard} style={PREVIEW_STYLE}>
              <LabelTile code={exampleLabelCode} config={config} type="Aisle" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ConfigureLabelForm;
