export type Styles = {
  'activePage': string;
  'pagenum': string;
  'pagination': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
