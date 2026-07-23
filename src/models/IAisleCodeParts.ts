import { IBaseCodeParts } from './IBaseCodeParts';
import { AISLE_SIDES } from '../config/labelConfig';

export type AisleSide = typeof AISLE_SIDES[number];

export interface IAisleCodeParts extends IBaseCodeParts {
  aisle: string;
  side: AisleSide;
}
