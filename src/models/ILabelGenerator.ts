import { ILabelConfig } from './ILabelConfig';
import { LabelPrintMode } from './ILabelLayoutStrategy';

export interface ILabelGenerator {
  aisles: string[];
  config: ILabelConfig;
  layoutMode?: LabelPrintMode;
}
