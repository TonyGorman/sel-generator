import { IBarcodeConfig } from './IBarcodeConfig';
import { LabelPrintMode } from './ILabelLayoutStrategy';

export interface IBarcodeGenerator {
  aisles: string[];
  type?: string;
  config: IBarcodeConfig;
  layoutMode?: LabelPrintMode;
}
