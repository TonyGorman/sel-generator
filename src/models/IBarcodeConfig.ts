export type PrimaryCodeFormat = 'sideBay' | 'shelfOnly';
export type ShelfStyle = 'number' | 'alphabetical';
export type SecondaryCodeFormat = 'dashes' | 'spaces';

export interface IBarcodeConfig {
  primaryCodeFormat: PrimaryCodeFormat;
  shelfStyle: ShelfStyle;
  secondaryCodeFormat: SecondaryCodeFormat;
  backCodePrefix: string;
}
