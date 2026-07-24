export type Styles = {
  'tabButton': string;
  'tabButtonActive': string;
  'tabList': string;
  'tabPanelBox': string;
  'tabPanelContent': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
