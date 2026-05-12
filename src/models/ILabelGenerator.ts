import { ILabelConfig } from './ILabelConfig';
import { LabelPrintMode } from './ILabelLayoutStrategy';

export interface ILabelGenerator {
  aisles: string[];
  type?: string;
  config: ILabelConfig;
  layoutMode?: LabelPrintMode;
}
