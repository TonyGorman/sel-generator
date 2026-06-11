export type ShelfStyle = 'number' | 'alphabetical';

export interface ILabelConfig {
  shelfStyle: ShelfStyle;
  backCodePrefix: string;
  specialAisleValues?: string[];
}
