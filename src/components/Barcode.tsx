import * as React from 'react';
import styles from './Barcode.module.scss';
import Tabs from './Tabs';
import AisleBarcode from './AisleBarcode';
import BackBarcode from './BackBarcode';
import SpecificBarcode from './SpecificBarcode';
import Configuration from './Configuration';
import { ITabItem } from '../models/ITabItem';
import { IBarcodeConfig } from '../models/IBarcodeConfig';
import { DEFAULT_BACK_CODE_PREFIX } from '../config/barcodeConfig';

const Barcode = (): React.ReactElement => {
  const [selectedTabKey, setSelectedTabKey] = React.useState('specific');
  const [config, setConfig] = React.useState<IBarcodeConfig>({
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
      headerText: 'Specific barcode',
      content: <SpecificBarcode config={config} />,
    },
    {
      key: 'aisle',
      headerText: 'Aisle barcode',
      content: <AisleBarcode config={config} onOpenConfiguration={() => setSelectedTabKey('config')} />,
    },
    {
      key: 'back',
      headerText: 'Back barcode',
      content: <BackBarcode config={config} />,
    },
    {
      key: 'config',
      headerText: 'Configuration',
      content: <Configuration config={config} onConfigChange={setConfig} />,
    },
  ];

  return (
    <section className={styles.barcodeRoot}>
      <Tabs tabs={tabItems} selectedKey={selectedTabKey} onTabClick={handleTabClick} />
    </section>
  );
}
export default Barcode;
