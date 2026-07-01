import { IBaseCodeParts } from './IBaseCodeParts';

export type AisleSide = 'L' | 'R' | 'E' | 'F';

export interface IAisleCodeParts extends IBaseCodeParts {
  aisle: string;
  side: AisleSide;
}
