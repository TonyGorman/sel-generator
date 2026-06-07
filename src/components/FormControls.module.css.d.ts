export type Styles = {
  'button': string;
  'input': string;
  'inputMultiline': string;
  'radioGroup': string;
  'radioInput': string;
  'radioLabel': string;
  'radioOption': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
