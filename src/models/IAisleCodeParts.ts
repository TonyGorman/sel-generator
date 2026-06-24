export type AisleSide = 'L' | 'R' | 'E' | 'F';

export interface IAisleCodeParts {
  aisle: string;
  side: AisleSide;
  bay: string;
  shelf: string;
}
