import * as React from 'react';
import styles from './LabelApp.module.css';
import Tabs from './Tabs';
import AisleLabelForm from './AisleLabelForm';
import BackLabelForm from './BackLabelForm';
import SpecificLabelForm from './SpecificLabelForm';
import { ITabItem } from '../models/ITabItem';
import { MINI_VARIANT_STORAGE_KEY, writePersistedMiniVariant } from '../services/miniVariantPreferenceStore';
import { resolveConfiguredMiniVariantId } from '../domain/miniVariantPreference';
import { MiniCompositionVariantId } from '../models/IMiniCompositionVariant';
import { isMiniCompositionVariantId, MINI_VARIANT_OPTIONS } from '../domain/miniCompositionVariants';

const resolveInitialMiniVariant = (): MiniCompositionVariantId => {
  return resolveConfiguredMiniVariantId();
};

const LabelApp = (): React.ReactElement => {
  const [selectedTabKey, setSelectedTabKey] = React.useState('specific');
  const [miniVariant, setMiniVariant] = React.useState<MiniCompositionVariantId>(() => resolveInitialMiniVariant());

  const handleTabClick = React.useCallback((key: string): void => {
    setSelectedTabKey(key);
  }, []);

  const handleMiniVariantChange = React.useCallback((event: React.ChangeEvent<HTMLSelectElement>): void => {
    const nextVariant = event.target.value;
    if (isMiniCompositionVariantId(nextVariant)) {
      writePersistedMiniVariant(nextVariant);
      setMiniVariant(nextVariant);
    }
  }, []);

  const tabItems: ITabItem[] = React.useMemo(() => [
    {
      key: 'specific',
      headerText: 'Specific Labels',
      content: <SpecificLabelForm />,
    },
    {
      key: 'aisle',
      headerText: 'Aisle Labels',
      content: <AisleLabelForm />,
    },
    {
      key: 'bak',
      headerText: 'FOS/Bak Labels',
      content: <BackLabelForm />,
    },
  ], []);

  return (
    <section className={styles.labelAppRoot}>
      <div className={styles.variantControlRow}>
        <label htmlFor={MINI_VARIANT_STORAGE_KEY} className={styles.variantControlLabel}>Mini Variant</label>
        <select
          id={MINI_VARIANT_STORAGE_KEY}
          className={styles.variantControlSelect}
          value={miniVariant}
          onChange={handleMiniVariantChange}
          aria-label="Mini Variant"
        >
          {MINI_VARIANT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </div>
      <Tabs tabs={tabItems} selectedKey={selectedTabKey} onTabClick={handleTabClick} />
    </section>
  );
}
export default LabelApp;
