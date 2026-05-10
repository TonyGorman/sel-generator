import * as React from 'react';
import styles from './Barcode.module.scss';
import Tabs from './Tabs';
import AisleBarcode from './AisleBarcode';
import BAKBarcode from './BAKBarcode';
import SpecificBarcode from './SpecificBarcode';
import Configuration from './Configuration';
import { ITabItem } from '../models/ITabItem';
import { IBarcodeConfig } from '../models/IBarcodeConfig';

const Barcode = (): React.ReactElement => {
  const [selectedTabKey, setSelectedTabKey] = React.useState('specific');
  const [config, setConfig] = React.useState<IBarcodeConfig>({
    primaryCodeFormat: 'sideBay',
    shelfStyle: 'alphabetical',
    secondaryCodeFormat: 'dashes',
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
      key: 'bak',
      headerText: 'Back barcode',
      content: <BAKBarcode config={config} />,
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
