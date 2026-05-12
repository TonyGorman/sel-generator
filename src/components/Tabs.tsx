import * as React from 'react';
import { ICommonTabsProps } from '../models/ICommonTabsProps'
import styles from './LabelApp.module.css';

const Tabs: React.FC<ICommonTabsProps> = ({ tabs, selectedKey, onTabClick }) => {
  const buttonRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const activeKey = selectedKey ?? tabs[0]?.key;
  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  const focusTabAtIndex = (index: number): void => {
    const safeIndex = (index + tabs.length) % tabs.length;
    const targetTab = tabs[safeIndex];

    if (!targetTab) {
      return;
    }

    onTabClick?.(targetTab.key);
    buttonRefs.current[safeIndex]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number): void => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        focusTabAtIndex(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        focusTabAtIndex(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusTabAtIndex(0);
        break;
      case 'End':
        event.preventDefault();
        focusTabAtIndex(tabs.length - 1);
        break;
    }
  };

  if (!activeTab) {
    return <></>;
  }

  return (
    <>
      <div className={styles.tabList} role="tablist" aria-label="Label views">
        {tabs.map((tab, index) => {
          const isSelected = tab.key === activeTab.key;

          return (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`panel-${tab.key}`}
              tabIndex={isSelected ? 0 : -1}
              className={isSelected ? styles.tabButtonActive : styles.tabButton}
              onClick={() => onTabClick?.(tab.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {tab.headerText}
            </button>
          );
        })}
      </div>
      <div
        id={`panel-${activeTab.key}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab.key}`}
        className={styles.tabPanelBox}
      >
        <div className={styles.tabPanelContent}>{activeTab.content}</div>
      </div>
    </>
  );
};

export default Tabs;
