import { LabelPrintMode } from './ILabelLayoutStrategy';

export interface ILabelGenerator {
  labelCodes: string[];
  layoutMode?: LabelPrintMode;
}
