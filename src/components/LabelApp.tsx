import * as React from 'react';
import styles from './LabelApp.module.css';
import Tabs from './Tabs';
import AisleLabelForm from './AisleLabelForm';
import BackLabelForm from './BackLabelForm';
import SpecificLabelForm from './SpecificLabelForm';
import { ITabItem } from '../models/ITabItem';

const LabelApp = (): React.ReactElement => {
  const [selectedTabKey, setSelectedTabKey] = React.useState('specific');

  const handleTabClick = React.useCallback((key: string): void => {
    setSelectedTabKey(key);
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
      <Tabs tabs={tabItems} selectedKey={selectedTabKey} onTabClick={handleTabClick} />
    </section>
  );
}
export default LabelApp;
