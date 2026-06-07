export type Styles = {
  'fieldLabel': string;
  'panel': string;
  'panelTitle': string;
  'sectionBox': string;
  'sectionTitle': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
