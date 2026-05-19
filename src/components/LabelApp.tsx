import * as React from 'react';
import styles from './LabelApp.module.css';
import Tabs from './Tabs';
import AisleLabelForm from './AisleLabelForm';
import BackLabelForm from './BackLabelForm';
import SpecificLabelForm from './SpecificLabelForm';
import Configuration from './Configuration';
import { ITabItem } from '../models/ITabItem';
import { ILabelConfig } from '../models/ILabelConfig';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/labelConfig';

const LabelApp = (): React.ReactElement => {
  const [selectedTabKey, setSelectedTabKey] = React.useState('specific');
  const [config, setConfig] = React.useState<ILabelConfig>({
    primaryCodeFormat: 'sideBay',
    shelfStyle: 'number',
    secondaryCodeFormat: 'dashes',
    backCodePrefix: DEFAULT_BACK_CODE_PREFIX,
  });

  const handleTabClick = (key: string): void => {
    setSelectedTabKey(key);
  };

  const tabItems: ITabItem[] = [
    {
      key: 'specific',
      headerText: 'Specific Labels',
      content: <SpecificLabelForm config={config} onOpenConfiguration={() => setSelectedTabKey('config')} />,
    },
    {
      key: 'aisle',
      headerText: 'Aisle Labels',
      content: <AisleLabelForm config={config} onOpenConfiguration={() => setSelectedTabKey('config')} />,
    },
    {
      key: 'back',
      headerText: 'Back Wall Labels',
      content: <BackLabelForm config={config} onOpenConfiguration={() => setSelectedTabKey('config')} />,
    },
    {
      key: 'config',
      headerText: 'Configuration',
      content: <Configuration config={config} onConfigChange={setConfig} />,
    },
  ];

  return (
    <section className={styles.labelAppRoot}>
      <Tabs tabs={tabItems} selectedKey={selectedTabKey} onTabClick={handleTabClick} />
    </section>
  );
}
export default LabelApp;
