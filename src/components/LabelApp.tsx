import * as React from 'react';
import styles from './LabelApp.module.css';
import Tabs from './Tabs';
import AisleLabelForm from './AisleLabelForm';
import BackLabelForm from './BackLabelForm';
import SpecificLabelForm from './SpecificLabelForm';
import ConfigureLabelForm from './ConfigureLabelForm';
import { ITabItem } from '../models/ITabItem';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX, SPECIAL_AISLE_VALUES } from '../config/labelConfig';

const LabelApp = (): React.ReactElement => {
  const [selectedTabKey, setSelectedTabKey] = React.useState('specific');
  const [config, setConfig] = React.useState<ILabelConfig>({
    shelfStyle: 'number',
    backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
    specialAisleValues: [...SPECIAL_AISLE_VALUES],
  });

  const handleTabClick = React.useCallback((key: string): void => {
    setSelectedTabKey(key);
  }, []);

  const openConfigurationTab = React.useCallback((): void => {
    setSelectedTabKey('config');
  }, []);

  const tabItems: ITabItem[] = React.useMemo(() => [
    {
      key: 'specific',
      headerText: 'Specific Labels',
      content: <SpecificLabelForm config={config} onOpenConfiguration={openConfigurationTab} />,
    },
    {
      key: 'aisle',
      headerText: 'Aisle Labels',
      content: <AisleLabelForm config={config} onOpenConfiguration={openConfigurationTab} />,
    },
    {
      key: 'back',
      headerText: 'Back Wall Labels',
      content: <BackLabelForm config={config} onOpenConfiguration={openConfigurationTab} />,
    },
    {
      key: 'config',
      headerText: 'Configuration',
      content: <ConfigureLabelForm config={config} onConfigChange={setConfig} />,
    },
  ], [config, openConfigurationTab]);

  return (
    <section className={styles.labelAppRoot}>
      <Tabs tabs={tabItems} selectedKey={selectedTabKey} onTabClick={handleTabClick} />
    </section>
  );
}
export default LabelApp;
