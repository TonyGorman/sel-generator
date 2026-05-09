import { IBarcodeConfig } from './IBarcodeConfig';

export interface IBarcodeGenerator {
  aisles: string[];
  type?: string;
  config: IBarcodeConfig;
}
