export type ShelfStyle = 'number' | 'alphabetical';
export type SecondaryCodeFormat = 'dashes' | 'spaces';

export interface ILabelConfig {
  shelfStyle: ShelfStyle;
  secondaryCodeFormat: SecondaryCodeFormat;
  backCodePrefix: string;
  specialAisleValues?: string[];
}
