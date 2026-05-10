export type Styles = {
  'actionsRow': string;
  'alertError': string;
  'configLayout': string;
  'fieldGroup': string;
  'fieldLabel': string;
  'generateButton': string;
  'panel': string;
  'panelTitle': string;
  'sectionBox': string;
  'sectionIntro': string;
  'sectionTitle': string;
  'sideGrid': string;
  'sideInputGroup': string;
  'sideLabel': string;
  'sideRow': string;
  'singleField': string;
  'stackedSections': string;
  'summaryBox': string;
  'summaryRow': string;
  'summaryTotal': string;
  'twoFieldGrid': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
