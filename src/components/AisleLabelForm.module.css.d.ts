export type Styles = {
  'configLayout': string;
  'sideGrid': string;
  'sideInputGroup': string;
  'sideLabel': string;
  'sideRow': string;
  'summaryBox': string;
  'summaryRow': string;
  'summaryTotal': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
